import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
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

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: received } = await adminClient
      .from("friend_shares")
      .select("id, workout_id, sender_id, created_at")
      .eq("receiver_id", session.user.id)
      .order("created_at", { ascending: false });

    const { data: sent } = await adminClient
      .from("friend_shares")
      .select("id, workout_id, receiver_id, created_at")
      .eq("sender_id", session.user.id)
      .order("created_at", { ascending: false });

    const senderIds = [...new Set(received?.map(s => s.sender_id) || [])];
    const receiverIds = [...new Set(sent?.map(s => s.receiver_id) || [])];
    const workoutIds = [...new Set([...(received || []), ...(sent || [])].map(s => s.workout_id))];

    const { data: senders } = senderIds.length > 0
      ? await adminClient.from("profiles").select("id, email").in("id", senderIds)
      : { data: [] };

    const { data: receivers } = receiverIds.length > 0
      ? await adminClient.from("profiles").select("id, email").in("id", receiverIds)
      : { data: [] };

    const { data: workouts } = workoutIds.length > 0
      ? await adminClient.from("workouts").select("id, started_at, name").in("id", workoutIds)
      : { data: [] };

    const senderMap = new Map((senders || []).map(p => [p.id, p.email]));
    const receiverMap = new Map((receivers || []).map(p => [p.id, p.email]));

    const typedReceived = (received || []).map(s => ({
      id: s.id,
      workoutId: s.workout_id,
      senderEmail: senderMap.get(s.sender_id) || "Unknown",
      workoutName: workouts?.find(w => w.id === s.workout_id)?.name || "Workout",
      workoutDate: workouts?.find(w => w.id === s.workout_id)?.started_at,
      createdAt: s.created_at,
    }));

    const typedSent = (sent || []).map(s => ({
      id: s.id,
      workoutId: s.workout_id,
      receiverEmail: receiverMap.get(s.receiver_id) || "Unknown",
      workoutName: workouts?.find(w => w.id === s.workout_id)?.name || "Workout",
      workoutDate: workouts?.find(w => w.id === s.workout_id)?.started_at,
      createdAt: s.created_at,
    }));

    return NextResponse.json({ received: typedReceived, sent: typedSent });
  } catch (error) {
    console.error("Error listing workout shares:", error);
    return NextResponse.json({ error: "Failed to list shares" }, { status: 500 });
  }
}
