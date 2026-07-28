import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function createSupabaseClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
        },
      },
    }
  );
}

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workoutId } = await params;
    const supabase = createSupabaseClient(request);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let isSharedAccess = false;
    let senderEmail: string | null = null;

    let { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .select("*")
      .eq("id", workoutId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!workout) {
      const { data: share } = await supabase
        .from("friend_shares")
        .select("id")
        .eq("workout_id", workoutId)
        .eq("receiver_id", session.user.id)
        .maybeSingle();

      if (share) {
        isSharedAccess = true;
        const admin = createAdminClient();
        const { data: sharedWorkout, error: sharedError } = await admin
          .from("workouts")
          .select("*")
          .eq("id", workoutId)
          .maybeSingle();

        if (sharedError || !sharedWorkout) {
          return NextResponse.json({ error: "Workout not found" }, { status: 404 });
        }
        workout = sharedWorkout;

        if (sharedWorkout.user_id) {
          const { data: profileData } = await admin
            .from("profiles")
            .select("email")
            .eq("id", sharedWorkout.user_id)
            .maybeSingle();
          senderEmail = profileData?.email ?? null;
        }

        admin
          .from("friend_shares")
          .update({ viewed_at: new Date().toISOString() })
          .eq("receiver_id", session.user.id)
          .eq("workout_id", workoutId)
          .then(() => {}, () => {});
      } else {
        const admin = createAdminClient();
        const { data: anyWorkout } = await admin
          .from("workouts")
          .select("*")
          .eq("id", workoutId)
          .maybeSingle();

        const { data: trainerLink } = anyWorkout?.user_id
          ? await admin
              .from("trainer_clients")
              .select("id")
              .eq("trainer_id", session.user.id)
              .eq("user_id", anyWorkout.user_id)
              .eq("status", "active")
              .maybeSingle()
          : { data: null };

        if (anyWorkout && trainerLink) {
          isSharedAccess = true;
          workout = anyWorkout;
        } else {
          return NextResponse.json({ error: "Workout not found" }, { status: 404 });
        }
      }
    }

    const client = isSharedAccess ? createAdminClient() : supabase;

    const { data: sets, error: setsError } = await client
      .from("workout_sets")
      .select("*")
      .eq("workout_id", workoutId)
      .order("exercise_order", { ascending: true })
      .order("set_number", { ascending: true });

    if (setsError) throw setsError;

    const grouped: Record<string, { exerciseId: string; name: string; description?: string; equipment: string; imageUrl?: string; muscleGroup?: string; sets: unknown[] }> = {};
    
    (sets || []).forEach(set => {
      if (!grouped[set.exercise_id]) {
        grouped[set.exercise_id] = {
          exerciseId: set.exercise_id,
          name: set.exercise_name,
          description: set.description || undefined,
          equipment: "",
          imageUrl: set.image_url || undefined,
          muscleGroup: set.muscle_group || undefined,
          sets: []
        };
      }
      grouped[set.exercise_id].sets.push(set);
    });

    const { data: photos } = await client
      .from("workout_photos")
      .select("id, storage_path, created_at")
      .eq("workout_id", workoutId)
      .order("created_at", { ascending: true });

    return NextResponse.json({
      exercises: Object.values(grouped),
      name: workout?.name || null,
      photos: (photos || []).map(p => {
        const { data } = client.storage.from("workout-photos").getPublicUrl(p.storage_path);
        return { id: p.id, url: data.publicUrl, createdAt: p.created_at };
      }),
      ...(isSharedAccess && senderEmail ? { senderEmail } : {}),
    });
  } catch (error) {
    console.error("Error loading workout:", error);
    return NextResponse.json({ error: "Failed to load workout" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workoutId } = await params;
    const supabase = createSupabaseClient(request);

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("workouts")
      .update({ name: name.trim().slice(0, 40) })
      .eq("id", workoutId)
      .eq("user_id", session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error renaming workout:", error);
    return NextResponse.json({ error: "Failed to rename workout" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workoutId } = await params;
    const supabase = createSupabaseClient(request);

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { error } = await supabase
      .from("workouts")
      .delete()
      .eq("id", workoutId)
      .eq("user_id", session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting workout:", error);
    return NextResponse.json({ error: "Failed to delete workout" }, { status: 500 });
  }
}