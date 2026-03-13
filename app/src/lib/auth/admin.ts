import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "kunaldrall29@gmail.com").split(",");

/**
 * Check if the current session user is an admin.
 * Returns the session if admin, null otherwise.
 */
export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  if (!ADMIN_EMAILS.includes(session.user.email)) return null;
  return session;
}

/**
 * Check if a given email is in the admin list.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.includes(email);
}
