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

async function computeXp(userId: string, supabase: ReturnType<typeof createSupabaseClient>) {
  const { data: workouts } = await supabase
    .from("workouts")
    .select("id")
    .eq("user_id", userId);

  if (!workouts || workouts.length === 0) return { xp: 0, level: 1 };

  const workoutIds = workouts.map((w: { id: string }) => w.id);

  const { count: completedSets } = await supabase
    .from("workout_sets")
    .select("*", { head: true, count: "exact" })
    .in("workout_id", workoutIds)
    .eq("is_completed", true);

  const { count: completedWorkouts } = await supabase
    .from("workouts")
    .select("*", { head: true, count: "exact" })
    .eq("user_id", userId)
    .not("completed_at", "is", null);

  const sets = completedSets ?? 0;
  const workoutsDone = completedWorkouts ?? 0;
  const xp = sets * 10 + workoutsDone * 25;
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;

  return { xp, level };
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const result = await computeXp(user.id, supabase);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching gamification:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient(request);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const result = await computeXp(user.id, supabase);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error syncing gamification:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
