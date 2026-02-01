import { getServerSession } from "next-auth";
import { authOptions } from "./options";

/**
 * Get the current session on the server side
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Get the current user from session, or null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user || null;
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

/**
 * Check if user has completed onboarding
 */
export async function requireOnboarding() {
  const user = await requireAuth();
  if (!user.onboardingCompleted) {
    throw new Error("Onboarding not completed");
  }
  return user;
}
