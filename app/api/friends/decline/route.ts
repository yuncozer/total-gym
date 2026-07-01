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

    const { requestId } = await request.json();
    if (!requestId) {
      return NextResponse.json({ error: "requestId is required" }, { status: 400 });
    }

    const { data: req, error: reqError } = await supabase
      .from("friend_requests")
      .select("*")
      .eq("id", requestId)
      .eq("receiver_id", session.user.id)
      .eq("status", "pending")
      .single();

    if (reqError || !req) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("friend_requests")
      .update({ status: "declined", updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error declining friend request:", error);
    return NextResponse.json({ error: "Failed to decline request" }, { status: 500 });
  }
}
