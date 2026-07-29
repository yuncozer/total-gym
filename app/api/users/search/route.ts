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

    const userId = session.user.id;
    const q = (request.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
    if (!q) {
      return NextResponse.json({ users: [] });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profiles, error } = await adminClient
      .from("profiles")
      .select("id, email, level, xp, avatar_url")
      .neq("id", userId)
      .eq("email", q)
      .limit(5);

    if (error) throw error;

    const userIds = profiles?.map(p => p.id) || [];

    const { data: existingFriends } = await adminClient
      .from("friends")
      .select("friend_id")
      .eq("user_id", userId)
      .in("friend_id", userIds);

    const friendIds = new Set(existingFriends?.map(f => f.friend_id) || []);

    const { data: existingRequests } = await adminClient
      .from("friend_requests")
      .select("sender_id, receiver_id, status")
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .in("sender_id", userIds)
      .in("receiver_id", userIds);

    const requestMap = new Map<string, string>();
    for (const r of existingRequests || []) {
      const otherId = r.sender_id === userId ? r.receiver_id : r.sender_id;
      requestMap.set(otherId, r.status);
    }

    const users = (profiles || []).map(p => ({
      id: p.id,
      email: p.email,
      level: friendIds.has(p.id) ? p.level : null,
      xp: friendIds.has(p.id) ? p.xp : null,
      avatarUrl: p.avatar_url || null,
      isFriend: friendIds.has(p.id),
      requestStatus: requestMap.get(p.id) || null,
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error searching users:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
