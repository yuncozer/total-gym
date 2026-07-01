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

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: profile } = await adminClient
      .from("profiles")
      .select("xp, level, current_streak, longest_streak")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      xp: profile?.xp ?? 0,
      level: profile?.level ?? 1,
      currentStreak: profile?.current_streak ?? 0,
      longestStreak: profile?.longest_streak ?? 0,
    });
  } catch (error) {
    console.error("Error fetching gamification:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

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

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await adminClient.rpc("sync_gamification", { p_user_id: user.id });

    if (error) throw error;

    const result = data?.[0] || data;
    return NextResponse.json({
      xp: result?.xp ?? 0,
      level: result?.level ?? 1,
      currentStreak: result?.current_streak ?? 0,
      longestStreak: result?.longest_streak ?? 0,
    });
  } catch (error) {
    console.error("Error syncing gamification:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
