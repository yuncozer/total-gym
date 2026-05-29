import { createServerClient } from "@supabase/ssr";
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

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient(request);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { exercises } = body;

    if (!exercises || !Array.isArray(exercises)) {
      return NextResponse.json({ error: "Invalid exercises data" }, { status: 400 });
    }

    const fecha = new Date().toISOString().split("T")[0];

    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .insert({
        user_id: session.user.id,
        date: fecha,
        status: "pendiente"
      })
      .select()
      .single();

    if (workoutError) throw workoutError;

    const setsToInsert = exercises.flatMap((ej: { id: string; name: string; imageUrl?: string; is_cardio?: boolean; sets: Array<{ reps: number; peso: number }> }) =>
      ej.sets.map((_, index) => ({
        workout_id: workout.id,
        exercise_id: ej.id,
        exercise_name: ej.name,
        set_number: index + 1,
        reps: ej.is_cardio ? null : 0,
        weight_kg: ej.is_cardio ? null : 0,
        is_cardio: ej.is_cardio || false,
        distance_km: ej.is_cardio ? 0 : null,
        duration_minutes: ej.is_cardio ? 0 : null,
        is_completed: false,
        image_url: ej.imageUrl || null,
      }))
    );

    const { error: setsError } = await supabase
      .from("workout_sets")
      .insert(setsToInsert);

    if (setsError) throw setsError;

    return NextResponse.json({ id: workout.id });
  } catch (error) {
    console.error("Error creating workout:", error);
    return NextResponse.json({ error: "Failed to create workout" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient(request);
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", session.user.id)
      .maybeSingle();

    const isPremium = !sub || (sub.plan === "premium" && sub.status === "active");

    let query = supabase
      .from("workouts")
      .select("id, date, name, started_at, status, completed_at")
      .eq("user_id", session.user.id)
      .neq("status", "cancelled");

    if (!isPremium) {
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - 30);
      dateLimit.setHours(0, 0, 0, 0);
      query = query.gte("started_at", dateLimit.toISOString());
    }

    const { data: workouts, error } = await query.order("started_at", { ascending: false });

    if (error) throw error;

    const workoutsWithSets = await Promise.all(
      (workouts || []).map(async (workout) => {
        const { data: sets } = await supabase
          .from("workout_sets")
          .select("id, exercise_id, exercise_name, image_url, set_number, reps, weight_kg, is_cardio, distance_km, duration_minutes, is_completed")
          .eq("workout_id", workout.id);

        const grouped: Record<string, { exerciseId: string; name: string; equipment: string; imageUrl?: string; sets: unknown[] }> = {};
        
        (sets || []).forEach(set => {
          if (!grouped[set.exercise_id]) {
            grouped[set.exercise_id] = {
              exerciseId: set.exercise_id,
              name: set.exercise_name,
              equipment: "",
              imageUrl: set.image_url || undefined,
              sets: []
            };
          }
          grouped[set.exercise_id].sets.push(set);
        });

        return {
          ...workout,
          exercises: Object.values(grouped)
        };
      })
    );

    return NextResponse.json(workoutsWithSets);
  } catch (error) {
    console.error("Error loading workouts:", error);
    return NextResponse.json({ error: "Failed to load workouts" }, { status: 500 });
  }
}