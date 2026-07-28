import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:notifications@totalgym.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

const STREAK_HIGHLIGHT_THRESHOLD = 3;

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    const { data: trainers, error: trainersError } = await supabase
      .from("trainers")
      .select("user_id, display_name")
      .eq("is_active", true);

    if (trainersError) {
      return NextResponse.json({ error: trainersError.message }, { status: 500 });
    }

    if (!trainers || trainers.length === 0) {
      return NextResponse.json({ message: "No active trainers", sent: 0 });
    }

    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    let sentCount = 0;

    for (const trainer of trainers) {
      const { data: linkedClients } = await supabase
        .from("trainer_clients")
        .select("user_id")
        .eq("trainer_id", trainer.user_id)
        .eq("status", "active")
        .not("user_id", "is", null);

      const clientUserIds = (linkedClients || [])
        .map((c) => c.user_id as string)
        .filter(Boolean);

      if (clientUserIds.length === 0) continue;

      const { data: recentWorkouts } = await supabase
        .from("workouts")
        .select("user_id")
        .in("user_id", clientUserIds)
        .eq("status", "completed")
        .gte("started_at", weekStart);

      const trainedThisWeek = new Set((recentWorkouts || []).map((w) => w.user_id));
      const trainedCount = trainedThisWeek.size;
      const missedCount = clientUserIds.length - trainedCount;

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, current_streak")
        .in("id", clientUserIds);

      const streakCount = (profiles || []).filter(
        (p) => (p.current_streak || 0) >= STREAK_HIGHLIGHT_THRESHOLD
      ).length;

      const { data: subscriptions } = await supabase
        .from("push_subs")
        .select("*")
        .eq("user_id", trainer.user_id);

      if (!subscriptions || subscriptions.length === 0) continue;

      const parts = [`${trainedCount}/${clientUserIds.length} entrenaron esta semana`];
      if (missedCount > 0) parts.push(`${missedCount} sin actividad`);
      if (streakCount > 0) parts.push(`${streakCount} con racha activa`);

      const message = `📋 ${parts.join(" · ")}`;

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify({
              title: "Resumen semanal de tu cartera 🏋️",
              body: message,
              icon: "/icon-192.png",
              url: "/entrenador",
            })
          );
          sentCount++;
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          console.error(`Push error for trainer ${trainer.user_id}:`, err);

          if (statusCode === 410 || statusCode === 404) {
            await supabase.from("push_subs").delete().eq("id", sub.id);
          }
        }
      }
    }

    return NextResponse.json({
      message: "Trainer weekly summaries processed",
      sent: sentCount,
      date: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Trainer weekly summary cron error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
