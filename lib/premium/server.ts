import { createServerClient } from "@supabase/ssr";
import type { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";
import type { SubscriptionPlan, SubscriptionStatus } from "./types";

export function resolveIsPremium(sub: { plan: SubscriptionPlan; status: SubscriptionStatus } | null): boolean {
  return sub != null && sub.plan === "premium" && sub.status === "active";
}

export async function isUserPremium(cookies: RequestCookies | { getAll: () => { name: string; value: string }[] }): Promise<boolean> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookies.getAll();
        },
        setAll() {
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.user) return false;

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", session.user.id)
    .maybeSingle();

  return resolveIsPremium(sub);
}

export function getDateLimit(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}
