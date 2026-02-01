// Database types for Supabase
// These match the schema defined in supabase/migrations/

export type KycStatus = "pending" | "processing" | "verified" | "rejected";
export type CircleStatus = "forming" | "active" | "completed" | "cancelled";
export type ContributionStatus = "pending" | "paid" | "late" | "missed";
export type PayoutStatus = "pending" | "processing" | "completed" | "failed";
export type CreditTier = "building" | "fair" | "good" | "excellent";
export type CreditEventType = "payment_ontime" | "payment_late" | "payment_missed" | "circle_completed";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          profile_image: string | null;
          google_id: string | null;
          kyc_status: KycStatus;
          kyc_session_id: string | null;
          kyc_verified_at: string | null;
          unique_id: string | null; // hex string of 32 bytes
          wallet_address: string | null;
          wallet_bound_at: string | null;
          wallet_binding_tx: string | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["users"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      circles: {
        Row: {
          id: string;
          contract_circle_id: string; // hex string of 32 bytes
          name: string;
          contribution_amount: number; // in stroops
          member_count: number;
          start_date: string;
          frequency: string;
          payout_method: string;
          contribution_token: string;
          status: CircleStatus;
          current_period: number;
          invite_code: string;
          organizer_id: string;
          created_at: string;
          started_at: string | null;
          completed_at: string | null;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["circles"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["circles"]["Insert"]>;
      };
      memberships: {
        Row: {
          id: string;
          circle_id: string;
          user_id: string;
          payout_position: number;
          has_received_payout: boolean;
          joined_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["memberships"]["Row"], "id" | "joined_at"> & {
          id?: string;
          joined_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["memberships"]["Insert"]>;
      };
      contributions: {
        Row: {
          id: string;
          circle_id: string;
          user_id: string;
          membership_id: string;
          period: number;
          amount: number;
          late_fee: number;
          due_date: string;
          paid_at: string | null;
          status: ContributionStatus;
          on_time: boolean | null;
          transaction_hash: string | null;
          credit_points: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["contributions"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["contributions"]["Insert"]>;
      };
      payouts: {
        Row: {
          id: string;
          circle_id: string;
          recipient_id: string;
          period: number;
          amount: number;
          status: PayoutStatus;
          transaction_hash: string | null;
          processed_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["payouts"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payouts"]["Insert"]>;
      };
      credit_scores: {
        Row: {
          id: string;
          user_id: string;
          score: number;
          tier: CreditTier;
          total_payments: number;
          on_time_payments: number;
          late_payments: number;
          missed_payments: number;
          circles_completed: number;
          last_synced_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["credit_scores"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["credit_scores"]["Insert"]>;
      };
      credit_events: {
        Row: {
          id: string;
          user_id: string;
          event_type: CreditEventType;
          points_change: number;
          score_after: number;
          circle_id: string | null;
          description: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["credit_events"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["credit_events"]["Insert"]>;
      };
    };
  };
}

// Convenience types
export type User = Database["public"]["Tables"]["users"]["Row"];
export type Circle = Database["public"]["Tables"]["circles"]["Row"];
export type Membership = Database["public"]["Tables"]["memberships"]["Row"];
export type Contribution = Database["public"]["Tables"]["contributions"]["Row"];
export type Payout = Database["public"]["Tables"]["payouts"]["Row"];
export type CreditScore = Database["public"]["Tables"]["credit_scores"]["Row"];
export type CreditEvent = Database["public"]["Tables"]["credit_events"]["Row"];
