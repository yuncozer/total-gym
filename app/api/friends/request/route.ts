import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

function createClient(request: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookies) { cookies.forEach(({ name, value, options }) => { request.cookies.set(name, value); }); },
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(request);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { receiverId } = await request.json();
    if (!receiverId) {
      return NextResponse.json({ error: "receiverId is required" }, { status: 400 });
    }

    if (receiverId === session.user.id) {
      return NextResponse.json({ error: "Cannot send request to yourself" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("friend_requests")
      .select("id, status")
      .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${session.user.id})`)
      .maybeSingle();

    if (existing) {
      if (existing.status === "pending") {
        return NextResponse.json({ error: "Request already pending" }, { status: 409 });
      }
      if (existing.status === "accepted") {
        return NextResponse.json({ error: "Already friends" }, { status: 409 });
      }
    }

    const { data: alreadyFriends } = await supabase
      .from("friends")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("friend_id", receiverId)
      .maybeSingle();

    if (alreadyFriends) {
      return NextResponse.json({ error: "Already friends" }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("friend_requests")
      .insert({ sender_id: session.user.id, receiver_id: receiverId })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ request: data });
  } catch (error) {
    console.error("Error sending friend request:", error);
    return NextResponse.json({ error: "Failed to send request" }, { status: 500 });
  }
}
