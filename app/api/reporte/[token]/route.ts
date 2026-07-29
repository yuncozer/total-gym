import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { computeUserStats } from "@/lib/gamification/computeUserStats";

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: share } = await admin
    .from("trainer_progress_shares")
    .select("id, client_id, trainer_id, expires_at, view_count")
    .eq("token", token)
    .maybeSingle();

  if (!share || new Date(share.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Este informe ya no está disponible" }, { status: 404 });
  }

  const { data: client } = await admin
    .from("trainer_clients")
    .select("display_name, goal, user_id, created_at")
    .eq("id", share.client_id)
    .maybeSingle();

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: trainer } = await admin
    .from("trainers")
    .select("display_name, specialty")
    .eq("user_id", share.trainer_id)
    .maybeSingle();

  let stats = null;
  let avatarUrl: string | null = null;
  if (client.user_id) {
    stats = await computeUserStats(admin, client.user_id);
    const { data: clientProfile } = await admin
      .from("profiles")
      .select("avatar_url")
      .eq("id", client.user_id)
      .maybeSingle();
    avatarUrl = clientProfile?.avatar_url || null;
  }

  const { data: checkins } = await admin
    .from("client_checkins")
    .select("weight_kg, waist_cm, created_at")
    .eq("client_id", share.client_id)
    .order("created_at", { ascending: true });

  const firstCheckin = checkins && checkins.length > 0 ? checkins[0] : null;
  const lastCheckin = checkins && checkins.length > 0 ? checkins[checkins.length - 1] : null;

  admin
    .from("trainer_progress_shares")
    .update({ view_count: (share.view_count || 0) + 1 })
    .eq("id", share.id)
    .then(() => {}, () => {});

  return NextResponse.json({
    clientName: client.display_name,
    goal: client.goal,
    avatarUrl,
    memberSince: client.created_at,
    trainerName: trainer?.display_name || null,
    trainerSpecialty: trainer?.specialty || null,
    stats,
    progress: firstCheckin && lastCheckin && firstCheckin !== lastCheckin
      ? {
          weightChange: lastCheckin.weight_kg != null && firstCheckin.weight_kg != null
            ? Math.round((lastCheckin.weight_kg - firstCheckin.weight_kg) * 10) / 10
            : null,
          waistChange: lastCheckin.waist_cm != null && firstCheckin.waist_cm != null
            ? Math.round((lastCheckin.waist_cm - firstCheckin.waist_cm) * 10) / 10
            : null,
          since: firstCheckin.created_at,
        }
      : null,
    viewCount: (share.view_count || 0) + 1,
  });
}
