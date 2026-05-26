import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SubscriptionResponse } from "@/lib/premium/types";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json<SubscriptionResponse>({
        plan: "free",
        status: "active",
        isPremium: false,
        daysLeft: null,
        periodEnd: null,
      });
    }

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (!sub) {
      return NextResponse.json<SubscriptionResponse>({
        plan: "premium",
        status: "active",
        isPremium: true,
        daysLeft: null,
        periodEnd: null,
      });
    }

    if (sub.plan === "free" || sub.status !== "active") {
      return NextResponse.json<SubscriptionResponse>({
        plan: "free",
        status: sub.status,
        isPremium: false,
        daysLeft: null,
        periodEnd: null,
      });
    }

    const daysLeft = sub.current_period_end
      ? Math.max(0, Math.ceil((new Date(sub.current_period_end).getTime() - Date.now()) / 86400000))
      : null;

    return NextResponse.json<SubscriptionResponse>({
      plan: "premium",
      status: sub.status,
      isPremium: true,
      daysLeft,
      periodEnd: sub.current_period_end,
    });
  } catch {
    return NextResponse.json<SubscriptionResponse>({
      plan: "free",
      status: "active",
      isPremium: false,
      daysLeft: null,
      periodEnd: null,
    });
  }
}
