import { createAdminClient } from "@/lib/supabase/admin";

export type ActivityType =
  | "login"
  | "create_circle"
  | "join_circle"
  | "contribute"
  | "view_dashboard"
  | "bind_wallet"
  | "payout_received";

/**
 * Track a user activity event for analytics.
 * This is fire-and-forget — errors are logged but don't block the caller.
 */
export async function trackActivity(
  userId: string,
  activityType: ActivityType,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await (supabase.from("user_activity") as any).insert({
      user_id: userId,
      activity_type: activityType,
      metadata: metadata || {},
    });
  } catch (error) {
    console.error("[analytics] Failed to track activity:", activityType, error);
  }
}
