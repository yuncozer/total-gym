import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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

    const { requestId } = await request.json();
    if (!requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: req, error: reqError } = await adminClient
      .from("friend_requests")
      .select("*")
      .eq("id", requestId)
      .eq("receiver_id", session.user.id)
      .eq("status", "pending")
      .single();

    if (reqError || !req) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const { error: updateError } = await adminClient
      .from("friend_requests")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (updateError) throw updateError;

    const { error: insertError1 } = await adminClient
      .from("friends")
      .insert({ user_id: session.user.id, friend_id: req.sender_id });

    if (insertError1) throw insertError1;

    const { error: insertError2 } = await adminClient
      .from("friends")
      .insert({ user_id: req.sender_id, friend_id: session.user.id });

    if (insertError2) throw insertError2;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    return NextResponse.json({ error: "Failed to accept request" }, { status: 500 });
  }
}
