import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function createAuthClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll() {},
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const authClient = createAuthClient(request);
  const { data: { session } } = await authClient.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: assignment } = await adminClient
    .from("routine_assignments")
    .select("id, routine_id, trainer_id, created_at, trainer_routines(name, description, goal, exercises), trainers(display_name)")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!assignment) {
    return NextResponse.json({ assignment: null });
  }

  const routineRel = assignment.trainer_routines as unknown as
    | { name: string; description: string | null; goal: string | null; exercises: unknown }
    | { name: string; description: string | null; goal: string | null; exercises: unknown }[]
    | null;
  const routine = Array.isArray(routineRel) ? routineRel[0] : routineRel;

  const trainerRel = assignment.trainers as unknown as
    | { display_name: string }
    | { display_name: string }[]
    | null;
  const trainer = Array.isArray(trainerRel) ? trainerRel[0] : trainerRel;

  return NextResponse.json({
    assignment: {
      id: assignment.id,
      routineId: assignment.routine_id,
      routineName: routine?.name || null,
      description: routine?.description || null,
      goal: routine?.goal || null,
      exercises: routine?.exercises || [],
      trainerName: trainer?.display_name || null,
      createdAt: assignment.created_at,
    },
  });
}
