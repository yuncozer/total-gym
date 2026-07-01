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

    const { data: allAchievements } = await adminClient
      .from("achievements")
      .select("*")
      .order("id");

    const { data: userAchievements } = await adminClient
      .from("user_achievements")
      .select("achievement_id, earned_at")
      .eq("user_id", user.id);

    const earnedMap = new Map((userAchievements || []).map(a => [a.achievement_id, a.earned_at]));

    const achievements = (allAchievements || []).map(a => ({
      id: a.id,
      name: { es: a.name_es, en: a.name_en },
      desc: { es: a.desc_es, en: a.desc_en },
      icon: a.icon,
      earned: earnedMap.has(a.id),
      earnedAt: earnedMap.get(a.id) || null,
    }));

    return NextResponse.json({ achievements });
  } catch (error) {
    console.error("Error fetching achievements:", error);
    return NextResponse.json({ error: "Failed to load achievements" }, { status: 500 });
  }
}
