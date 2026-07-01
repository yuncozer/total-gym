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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseClient(request);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .select("id, name")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (workoutError || !workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    if (!workout.name?.trim()) {
      return NextResponse.json({ error: "Workout must have a name before sharing" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("shared_workouts")
      .select("token, expires_at")
      .eq("workout_id", id)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (existing) {
      const base = process.env.NEXT_PUBLIC_APP_URL || `http://${request.headers.get("host") || "localhost:3000"}`;
      const url = `${base.replace(/\/+$/, "")}/shared/${existing.token}`;
      return NextResponse.json({ token: existing.token, url, expires_at: existing.expires_at });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: share, error } = await supabase
      .from("shared_workouts")
      .insert({
        workout_id: id,
        expires_at: expiresAt,
      })
      .select("token, expires_at")
      .single();

    if (error) throw error;

    const base = process.env.NEXT_PUBLIC_APP_URL || `http://${request.headers.get("host") || "localhost:3000"}`;
    const url = `${base.replace(/\/+$/, "")}/shared/${share.token}`;

    return NextResponse.json({ token: share.token, url, expires_at: share.expires_at });
  } catch (error) {
    console.error("Error sharing workout:", error);
    return NextResponse.json({ error: "Failed to share workout" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseClient(request);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { data: workout } = await supabase
      .from("workouts")
      .select("id")
      .eq("id", id)
      .eq("user_id", session.user.id)
      .single();

    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("shared_workouts")
      .delete()
      .eq("workout_id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error revoking share:", error);
    return NextResponse.json({ error: "Failed to revoke share" }, { status: 500 });
  }
}
