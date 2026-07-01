import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const FALLBACK_EMAILS_CACHE = new Map<string, string>();

async function fillMissingEmails(
  adminClient: any,
  profiles: { id: string; email?: string | null }[]
) {
  const missing = profiles.filter(p => !p.email).map(p => p.id);
  if (missing.length === 0) return;

  const uncached = missing.filter(id => !FALLBACK_EMAILS_CACHE.has(id));
  if (uncached.length > 0) {
    const { data: authEmails } = await adminClient.rpc("get_users_emails", { user_ids: uncached });
    if (authEmails) {
      for (const ae of authEmails) {
        FALLBACK_EMAILS_CACHE.set(ae.id, ae.email);
      }
    }
  }
  for (const p of profiles) {
    if (!p.email && FALLBACK_EMAILS_CACHE.has(p.id)) {
      p.email = FALLBACK_EMAILS_CACHE.get(p.id)!;
    }
  }
}

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

    const userId = session.user.id;

    const { data: friendRows } = await adminClient
      .from("friends")
      .select("friend_id, created_at")
      .eq("user_id", userId);

    const friendIds = friendRows?.map(f => f.friend_id) || [];

    const { data: friendProfiles } = friendIds.length > 0
      ? await adminClient
          .from("profiles")
          .select("id, email, level, xp, current_streak")
          .in("id", friendIds)
      : { data: [] };

    await fillMissingEmails(adminClient, friendProfiles || []);

    const { data: incomingRequests } = await adminClient
      .from("friend_requests")
      .select("id, sender_id, created_at")
      .eq("receiver_id", userId)
      .eq("status", "pending");

    const senderIds = incomingRequests?.map(r => r.sender_id) || [];

    const { data: senderProfiles } = senderIds.length > 0
      ? await adminClient
          .from("profiles")
          .select("id, email, level, xp")
          .in("id", senderIds)
      : { data: [] };

    await fillMissingEmails(adminClient, senderProfiles || []);

    const profileMap = new Map((friendProfiles || []).map(p => [p.id, p]));
    const senderMap = new Map((senderProfiles || []).map(p => [p.id, p]));

    const friends = (friendRows || []).map(f => {
      const profile = profileMap.get(f.friend_id);
      return {
        id: f.friend_id,
        email: profile?.email || "Unknown",
        level: profile?.level || 1,
        xp: profile?.xp || 0,
        streak: profile?.current_streak ?? 0,
        friendSince: f.created_at,
      };
    });

    const incoming = (incomingRequests || []).map(r => {
      const profile = senderMap.get(r.sender_id);
      return {
        requestId: r.id,
        senderId: r.sender_id,
        email: profile?.email || "Unknown",
        level: profile?.level || 1,
        xp: profile?.xp || 0,
        createdAt: r.created_at,
      };
    });

    const { data: outgoingRequests } = await adminClient
      .from("friend_requests")
      .select("id, receiver_id, created_at")
      .eq("sender_id", userId)
      .eq("status", "pending");

    const receiverIds = outgoingRequests?.map(r => r.receiver_id) || [];

    const { data: receiverProfiles } = receiverIds.length > 0
      ? await adminClient
          .from("profiles")
          .select("id, email")
          .in("id", receiverIds)
      : { data: [] };

    await fillMissingEmails(adminClient, receiverProfiles || []);

    const receiverMap = new Map((receiverProfiles || []).map(p => [p.id, p.email]));

    const outgoing = (outgoingRequests || []).map(r => ({
      requestId: r.id,
      receiverId: r.receiver_id,
      email: receiverMap.get(r.receiver_id) || "Unknown",
      createdAt: r.created_at,
    }));

    return NextResponse.json({ friends, incoming, outgoing });
  } catch (error) {
    console.error("Error listing friends:", error);
    return NextResponse.json({ error: "Failed to list friends" }, { status: 500 });
  }
}
