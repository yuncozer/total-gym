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

    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .select("*")
      .eq("id", workoutId)
      .eq("user_id", session.user.id)
      .single();

    if (workoutError || !workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    const { data: sets, error: setsError } = await supabase
      .from("workout_sets")
      .select("*")
      .eq("workout_id", workoutId)
      .order("exercise_id", { ascending: true })
      .order("set_number", { ascending: true });

    if (setsError) throw setsError;

    const grouped: Record<string, { exerciseId: string; name: string; equipment: string; sets: unknown[] }> = {};
    
    (sets || []).forEach(set => {
      if (!grouped[set.exercise_id]) {
        grouped[set.exercise_id] = {
          exerciseId: set.exercise_id,
          name: set.exercise_name,
          equipment: "",
          sets: []
        };
      }
      grouped[set.exercise_id].sets.push(set);
    });

    return NextResponse.json(Object.values(grouped));
  } catch (error) {
    console.error("Error loading workout:", error);
    return NextResponse.json({ error: "Failed to load workout" }, { status: 500 });
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