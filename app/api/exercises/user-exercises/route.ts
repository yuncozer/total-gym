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

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient(request);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: sets, error } = await supabase
      .from("workout_sets")
      .select("exercise_id, exercise_name")
      .eq("is_completed", true)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false });

    if (error) throw error;

    const seen = new Set<string>();
    const exercises: { id: string; name: string }[] = [];
    for (const set of sets || []) {
      const key = set.exercise_id;
      if (!seen.has(key)) {
        seen.add(key);
        exercises.push({ id: set.exercise_id, name: set.exercise_name });
      }
    }

    return NextResponse.json(exercises);
  } catch (error) {
    console.error("Error loading user exercises:", error);
    return NextResponse.json({ error: "Failed to load exercises" }, { status: 500 });
  }
}
