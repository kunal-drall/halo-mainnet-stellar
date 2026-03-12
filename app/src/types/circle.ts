/**
 * Type definitions for circles and related entities.
 */

export type CircleStatus = "forming" | "active" | "completed" | "cancelled";
export type Frequency = "weekly" | "biweekly" | "monthly";
export type MembershipStatus = "invited" | "joined" | "left" | "removed";

export interface Circle {
  id: string;
  name: string;
  organizer_id: string;
  max_members: number;
  contribution_amount: number;
  frequency: Frequency;
  status: CircleStatus;
  invite_code: string;
  contract_circle_id: number;
  start_date: string;
  created_at: string;
  updated_at: string;
}

export interface CircleMembership {
  id: string;
  circle_id: string;
  user_id: string;
  status: MembershipStatus;
  payout_position: number | null;
  joined_at: string;
  created_at: string;
}

export interface Contribution {
  id: string;
  circle_id: string;
  user_id: string;
  round_number: number;
  amount: number;
  status: "pending" | "paid" | "late" | "missed";
  tx_hash: string | null;
  created_at: string;
}

export interface Payout {
  id: string;
  circle_id: string;
  user_id: string;
  round_number: number;
  amount: number;
  tx_hash: string | null;
  created_at: string;
}

export interface CircleWithMembers extends Circle {
  members: CircleMemberWithUser[];
  memberCount: number;
}

export interface CircleMemberWithUser extends CircleMembership {
  user: {
    id: string;
    name: string;
    email: string;
    wallet_address: string | null;
  };
}
