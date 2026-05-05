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

    const setsToInsert = exercises.flatMap((ej: { id: string; name: string; sets: Array<{ reps: number; peso: number }> }) =>
      ej.sets.map((_, index) => ({
        workout_id: workout.id,
        exercise_id: ej.id,
        exercise_name: ej.name,
        set_number: index + 1,
        reps: 0,
        weight_kg: 0,
        is_completed: false
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

    const { data: workouts, error } = await supabase
      .from("workouts")
      .select("id, date, started_at, status, completed_at")
      .eq("user_id", session.user.id)
      .order("started_at", { ascending: false });

    if (error) throw error;

    const workoutsWithSets = await Promise.all(
      (workouts || []).map(async (workout) => {
        const { data: sets } = await supabase
          .from("workout_sets")
          .select("id, exercise_id, exercise_name, set_number, reps, weight_kg, is_completed")
          .eq("workout_id", workout.id);

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