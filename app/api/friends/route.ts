import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { levelFromXp } from "@/lib/gamification";

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
          .select("id, email, level, xp, current_streak, avatar_url")
          .in("id", friendIds)
      : { data: [] };

    const staleFriendIds = (friendProfiles || [])
      .filter(p => !p.xp || p.level === 1)
      .map(p => p.id);

    if (staleFriendIds.length > 0) {
      const { data: staleWorkouts } = await adminClient
        .from("workouts")
        .select("id, user_id, completed_at")
        .in("user_id", staleFriendIds)
        .not("completed_at", "is", null);

      const staleWorkoutIds = [...new Set((staleWorkouts || []).map((w: any) => w.id))];

      const { data: staleSets } = staleWorkoutIds.length > 0
        ? await adminClient
            .from("workout_sets")
            .select("id, workout_id")
            .eq("is_completed", true)
            .in("workout_id", staleWorkoutIds)
        : { data: [] };

      const staleWorkoutMap = new Map<string, any[]>();
      for (const w of (staleWorkouts || [])) {
        const arr = staleWorkoutMap.get(w.user_id) || [];
        arr.push(w);
        staleWorkoutMap.set(w.user_id, arr);
      }

      const staleSetsMap = new Map<string, number>();
      for (const s of (staleSets || [])) {
        staleSetsMap.set(s.workout_id, (staleSetsMap.get(s.workout_id) || 0) + 1);
      }

      for (const friend of (friendProfiles || [])) {
        if (!staleFriendIds.includes(friend.id)) continue;
        const userWorkouts = staleWorkoutMap.get(friend.id) || [];
        const completedCount = userWorkouts.length;
        let setCount = 0;
        for (const w of userWorkouts) {
          setCount += staleSetsMap.get(w.id) || 0;
        }
        const xp = setCount * 10 + completedCount * 25;
        friend.xp = xp;
        friend.level = levelFromXp(xp);

        // Calculate streak
        const dates: string[] = userWorkouts.map((w: any) => {
          const d = new Date(w.completed_at);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        });
        const uniqueDates = [...new Set(dates)].sort((a, b) => b.localeCompare(a));
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = today.toISOString().split("T")[0];
        const cd = new Date(today);
        if (uniqueDates.includes(todayStr)) {
          streak = 1;
          cd.setDate(cd.getDate() - 1);
        }
        while (true) {
          const ds = cd.toISOString().split("T")[0];
          if (uniqueDates.includes(ds)) { streak++; cd.setDate(cd.getDate() - 1); }
          else break;
        }
        friend.current_streak = streak;
      }
    }

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
          .select("id, email, level, xp, avatar_url")
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
        avatarUrl: profile?.avatar_url || null,
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
        avatarUrl: profile?.avatar_url || null,
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
          .select("id, email, avatar_url")
          .in("id", receiverIds)
      : { data: [] };

    await fillMissingEmails(adminClient, receiverProfiles || []);

    const receiverProfileMap = new Map((receiverProfiles || []).map(p => [p.id, p]));

    const outgoing = (outgoingRequests || []).map(r => {
      const profile = receiverProfileMap.get(r.receiver_id);
      return {
        requestId: r.id,
        receiverId: r.receiver_id,
        email: profile?.email || "Unknown",
        avatarUrl: profile?.avatar_url || null,
        createdAt: r.created_at,
      };
    });

    return NextResponse.json({ friends, incoming, outgoing });
  } catch (error) {
    console.error("Error listing friends:", error);
    return NextResponse.json({ error: "Failed to list friends" }, { status: 500 });
  }
}
