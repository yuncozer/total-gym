import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { session } } = await authClient.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: ownWorkouts } = await admin
    .from("workouts")
    .select("id")
    .eq("user_id", session.user.id);

  const workoutIds = (ownWorkouts || []).map((w) => w.id);
  if (workoutIds.length === 0) {
    return NextResponse.json({ unreadByWorkoutId: {} });
  }

  const { data: unread } = await admin
    .from("session_comments")
    .select("workout_id")
    .in("workout_id", workoutIds)
    .neq("author_id", session.user.id)
    .is("read_at", null);

  const unreadByWorkoutId: Record<string, number> = {};
  for (const c of unread || []) {
    unreadByWorkoutId[c.workout_id] = (unreadByWorkoutId[c.workout_id] || 0) + 1;
  }

  return NextResponse.json({ unreadByWorkoutId });
}
