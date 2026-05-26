import { createServerClient } from "@supabase/ssr";
import type { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";

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

  if (!sub) return true;

  return sub.plan === "premium" && sub.status === "active";
}

export function getDateLimit(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}
