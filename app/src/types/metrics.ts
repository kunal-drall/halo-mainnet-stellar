/**
 * Type definitions for platform metrics and analytics.
 */

export interface PlatformOverview {
  totalUsers: number;
  newUsersToday: number;
  dau: number;
  wau: number;
  mau: number;
  totalCircles: number;
  circleStatuses: Record<string, number>;
  totalContributions: number;
  contributionCount: number;
  totalPayouts: number;
  payoutCount: number;
  avgCreditScore: number;
  totalTransactionVolume: number;
}

export interface ScoreDistributionBucket {
  tier: string;
  count: number;
}

export interface ActivityEntry {
  id: string;
  user_id: string;
  activity_type: ActivityType;
  metadata: Record<string, unknown>;
  created_at: string;
  user?: {
    name: string;
    email: string;
  };
}

export type ActivityType =
  | "login"
  | "create_circle"
  | "join_circle"
  | "contribute"
  | "view_dashboard"
  | "bind_wallet"
  | "payout_received";

export interface MetricsSnapshot {
  date: string;
  total_users: number;
  active_users_daily: number;
  active_users_weekly: number;
  active_users_monthly: number;
  total_circles: number;
  active_circles: number;
  forming_circles: number;
  completed_circles: number;
  total_contributions: number;
  contribution_count: number;
  total_payouts: number;
  payout_count: number;
  avg_credit_score: number;
  total_transaction_volume: number;
  new_users_today: number;
}

export interface MetricsResponse {
  overview: PlatformOverview;
  scoreDistribution: ScoreDistributionBucket[];
  recentActivity: ActivityEntry[];
}
