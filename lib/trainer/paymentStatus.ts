export type PaymentStatus = "current" | "due_soon" | "overdue" | "none";

const DUE_SOON_DAYS = 7;

export function getPaymentStatus(periodEnd: string | null): PaymentStatus {
  if (!periodEnd) return "none";
  const daysLeft = Math.ceil((new Date(periodEnd).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= DUE_SOON_DAYS) return "due_soon";
  return "current";
}
