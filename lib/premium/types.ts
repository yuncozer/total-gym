export type SubscriptionPlan = "free" | "premium";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "incomplete";

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
}

export interface SubscriptionResponse {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  isPremium: boolean;
  daysLeft: number | null;
  periodEnd: string | null;
}

export const FREE_HISTORY_DAYS = 30;
