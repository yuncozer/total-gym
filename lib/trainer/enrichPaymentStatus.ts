import type { SupabaseClient } from "@supabase/supabase-js";
import { getPaymentStatus, type PaymentStatus } from "./paymentStatus";

interface ClientLike {
  id: string;
}

export async function enrichWithPaymentStatus<T extends ClientLike>(
  supabase: SupabaseClient,
  clients: T[]
): Promise<(T & { paymentStatus: PaymentStatus })[]> {
  const clientIds = clients.map((c) => c.id);

  const latestPeriodEndByClient = new Map<string, string>();
  if (clientIds.length > 0) {
    const { data } = await supabase
      .from("client_payments")
      .select("client_id, period_end")
      .in("client_id", clientIds)
      .not("period_end", "is", null)
      .order("period_end", { ascending: false });

    for (const row of data || []) {
      if (!latestPeriodEndByClient.has(row.client_id)) {
        latestPeriodEndByClient.set(row.client_id, row.period_end);
      }
    }
  }

  return clients.map((c) => ({
    ...c,
    paymentStatus: getPaymentStatus(latestPeriodEndByClient.get(c.id) ?? null),
  }));
}
