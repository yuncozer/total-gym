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

    const { data: { session } } = await authClient.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { receiverId } = await request.json();
    if (!receiverId) {
      return NextResponse.json({ error: "receiverId is required" }, { status: 400 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existing } = await adminClient
      .from("friend_shares")
      .select("id")
      .eq("sender_id", session.user.id)
      .eq("receiver_id", receiverId)
      .eq("workout_id", workoutId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Already shared" }, { status: 409 });
    }

    const { error } = await adminClient
      .from("friend_shares")
      .insert({ sender_id: session.user.id, receiver_id: receiverId, workout_id: workoutId });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error sharing workout with friend:", error);
    return NextResponse.json({ error: "Failed to share workout" }, { status: 500 });
  }
}
