import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workoutId } = await params;

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

    const { data: { user: authUser } } = await authClient.auth.getUser();
    const session = authUser ? { user: authUser } : null;

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { completed_at } = body;

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookies) { cookies.forEach(({ name, value, options }) => { request.cookies.set(name, value); }); },
        },
      }
    );

    const { error } = await supabase
      .from("workouts")
      .update({ status: "completed", ...(completed_at ? { completed_at } : {}) })
      .eq("id", workoutId)
      .eq("user_id", session.user.id);

    if (error) throw error;

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    await adminClient.rpc("sync_gamification", { p_user_id: session.user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error completing workout:", error);
    return NextResponse.json({ error: "Failed to complete workout" }, { status: 500 });
  }
}
