import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { getDailyNotification } from "@/lib/data/notifications";

webpush.setVapidDetails(
  "mailto:notifications@totalgym.app",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
  process.env.VAPID_PRIVATE_KEY || ""
);

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    const today = new Date();
    const dayOfWeek = today.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return NextResponse.json({ 
        message: "No reminder sent - weekend", 
        sent: 0 
      });
    }

    const { data: users, error: usersError } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("notify_enabled", true);

    if (usersError) {
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    if (!users || users.length === 0) {
      return NextResponse.json({ message: "No users with notifications enabled", sent: 0 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

  let sentCount = 0;

  for (const user of users) {
    const { data: workoutsToday } = await supabase
      .from("workouts")
      .select("id")
      .eq("user_id", user.id)
      .gte("started_at", todayStart)
      .lte("started_at", todayEnd)
      .not("completed_at", "is", null)
      .limit(1);

    if (workoutsToday && workoutsToday.length > 0) {
      continue;
    }

    const { data: subscriptions } = await supabase
      .from("push_subs")
      .select("*")
      .eq("user_id", user.id);

    if (!subscriptions || subscriptions.length === 0) {
      continue;
    }

    const message = getDailyNotification();

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification({
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        }, JSON.stringify({
          title: "Total Gym 🏋️",
          body: message,
          icon: "/icon-192.png",
        }));
        sentCount++;
      } catch (err: any) {
        console.error(`Push error for user ${user.id}:`, err.message);
        
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase
            .from("push_subs")
            .delete()
            .eq("id", sub.id);
        }
      }
    }
  }

  return NextResponse.json({ 
    message: "Daily reminders processed", 
    sent: sentCount,
    date: new Date().toISOString()
  });
  } catch (error: any) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}