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

    const friendId = request.nextUrl.searchParams.get("friendId");

    if (friendId) {
      let fromFriend;
      try {
        const { data } = await adminClient
          .from("friend_shares")
          .select("id, workout_id, sender_id, created_at, viewed_at")
          .eq("receiver_id", session.user.id)
          .eq("sender_id", friendId)
          .order("created_at", { ascending: false });
        fromFriend = data;
      } catch {
        const { data } = await adminClient
          .from("friend_shares")
          .select("id, workout_id, sender_id, created_at")
          .eq("receiver_id", session.user.id)
          .eq("sender_id", friendId)
          .order("created_at", { ascending: false });
        fromFriend = data;
      }

      const workoutIds = [...new Set(fromFriend?.map(s => s.workout_id) || [])];

      const { data: workouts } = workoutIds.length > 0
        ? await adminClient.from("workouts").select("id, started_at, name").in("id", workoutIds)
        : { data: [] };

      const typed = (fromFriend || []).map(s => ({
        id: s.id,
        workoutId: s.workout_id,
        senderId: s.sender_id,
        workoutName: workouts?.find(w => w.id === s.workout_id)?.name || "Workout",
        workoutDate: workouts?.find(w => w.id === s.workout_id)?.started_at,
        createdAt: s.created_at,
        viewedAt: (s as any).viewed_at ?? null,
      }));

      return NextResponse.json({ shares: typed });
    }

    let received;
    try {
      const { data } = await adminClient
        .from("friend_shares")
        .select("id, workout_id, sender_id, created_at")
        .eq("receiver_id", session.user.id)
        .is("viewed_at", null)
        .order("created_at", { ascending: false });
      received = data;
    } catch {
      const { data } = await adminClient
        .from("friend_shares")
        .select("id, workout_id, sender_id, created_at")
        .eq("receiver_id", session.user.id)
        .order("created_at", { ascending: false });
      received = data;
    }

    const { data: sent } = await adminClient
      .from("friend_shares")
      .select("id, workout_id, receiver_id, created_at")
      .eq("sender_id", session.user.id)
      .order("created_at", { ascending: false });

    const senderIds = [...new Set(received?.map(s => s.sender_id) || [])];
    const receiverIds = [...new Set(sent?.map(s => s.receiver_id) || [])];
    const workoutIds = [...new Set([...(received || []), ...(sent || [])].map(s => s.workout_id))];

    const { data: senders } = senderIds.length > 0
      ? await adminClient.from("profiles").select("id, email, avatar_url").in("id", senderIds)
      : { data: [] };

    const { data: receivers } = receiverIds.length > 0
      ? await adminClient.from("profiles").select("id, email, avatar_url").in("id", receiverIds)
      : { data: [] };

    const { data: workouts } = workoutIds.length > 0
      ? await adminClient.from("workouts").select("id, started_at, name").in("id", workoutIds)
      : { data: [] };

    const senderMap = new Map((senders || []).map(p => [p.id, p]));
    const receiverMap = new Map((receivers || []).map(p => [p.id, p]));

    const typedReceived = (received || []).map(s => ({
      id: s.id,
      workoutId: s.workout_id,
      senderId: s.sender_id,
      senderEmail: senderMap.get(s.sender_id)?.email || "Unknown",
      senderAvatarUrl: senderMap.get(s.sender_id)?.avatar_url || null,
      workoutName: workouts?.find(w => w.id === s.workout_id)?.name || "Workout",
      workoutDate: workouts?.find(w => w.id === s.workout_id)?.started_at,
      createdAt: s.created_at,
    }));

    const typedSent = (sent || []).map(s => ({
      id: s.id,
      workoutId: s.workout_id,
      receiverId: s.receiver_id,
      receiverEmail: receiverMap.get(s.receiver_id)?.email || "Unknown",
      receiverAvatarUrl: receiverMap.get(s.receiver_id)?.avatar_url || null,
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
