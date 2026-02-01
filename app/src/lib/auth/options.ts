import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { createAdminClient } from "@/lib/supabase/admin";

// Type for user data from Supabase
interface SupabaseUserData {
  id: string;
  kyc_status: string;
  wallet_address: string | null;
  onboarding_completed: boolean;
  [key: string]: any;
}

// Extend the session type
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      kycStatus: "pending" | "processing" | "verified" | "rejected";
      walletAddress: string | null;
      onboardingCompleted: boolean;
    };
  }

  interface User {
    id: string;
    kycStatus?: string;
    walletAddress?: string;
    onboardingCompleted?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    kycStatus?: string;
    walletAddress?: string;
    onboardingCompleted?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false;

      const supabase = createAdminClient();

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", user.email)
        .single();

      if (!existingUser) {
        // Create new user in our users table
        const { error } = await (supabase.from("users") as any).insert({
          email: user.email,
          name: user.name || "User",
          profile_image: user.image,
          google_id: account?.providerAccountId,
        });

        if (error) {
          console.error("Error creating user:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account, trigger }) {
      // On initial sign in, get user data
      if (account && user) {
        const supabase = createAdminClient();

        const { data: userDataResult } = await supabase
          .from("users")
          .select("id, kyc_status, wallet_address, onboarding_completed")
          .eq("email", token.email!)
          .single();

        const userData = userDataResult as SupabaseUserData | null;

        if (userData) {
          token.id = userData.id;
          token.kycStatus = userData.kyc_status;
          token.walletAddress = userData.wallet_address ?? undefined;
          token.onboardingCompleted = userData.onboarding_completed;
        }
      }

      // On token refresh, update user data
      if (trigger === "update") {
        const supabase = createAdminClient();

        const { data: userDataResult } = await supabase
          .from("users")
          .select("id, kyc_status, wallet_address, onboarding_completed")
          .eq("id", token.id)
          .single();

        const userData = userDataResult as SupabaseUserData | null;

        if (userData) {
          token.kycStatus = userData.kyc_status;
          token.walletAddress = userData.wallet_address ?? undefined;
          token.onboardingCompleted = userData.onboarding_completed;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.kycStatus = (token.kycStatus as "pending" | "processing" | "verified" | "rejected") || "pending";
        session.user.walletAddress = (token.walletAddress as string) || null;
        session.user.onboardingCompleted = (token.onboardingCompleted as boolean) || false;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // If the URL is a callback from OAuth, check wallet status
      if (url.startsWith(baseUrl)) {
        // After sign in, redirect based on wallet status
        // This is handled by checking the session on the client side
        // For now, default to dashboard, the app will redirect if needed
        if (url === baseUrl || url === `${baseUrl}/`) {
          return `${baseUrl}/dashboard`;
        }
        return url;
      }
      // Allow relative URLs
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      return baseUrl;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};
