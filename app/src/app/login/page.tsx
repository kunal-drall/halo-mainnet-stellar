import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { AuthError } from "@/components/auth/auth-error";

export const metadata = {
  title: "Sign In - Halo Protocol",
  description: "Sign in to your Halo Protocol account",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 bg-[#080B12]">
      {/* Dot grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div
        className="relative z-10 w-full max-w-sm"
        style={{ animation: "fadeInUp 0.4s ease-out both" }}
      >
        {/* Heading */}
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-bold text-[#EDEDED] mb-2"
            style={{ fontFamily: "var(--font-display), sans-serif" }}
          >
            Sign in to Halo
          </h1>
          <p className="text-sm text-[#787E88]">
            Continue with your Google account
          </p>
        </div>

        {/* Login Card */}
        <div
          className={`bg-[#0F1319] rounded-2xl p-8 border ${
            error
              ? "border-[#E04040]/40"
              : "border-[rgba(255,255,255,0.06)]"
          }`}
        >
          {error && (
            <div className="mb-6">
              <AuthError error={error} />
            </div>
          )}

          <GoogleSignInButton />

          <p className="mt-6 text-center text-xs text-[#545963]">
            By signing in, you agree to our terms
          </p>
        </div>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-[#545963] hover:text-[#EDEDED] transition-colors"
          >
            &larr; Back to home
          </Link>
        </div>
      </div>

      {/* Keyframes */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `,
        }}
      />
    </div>
  );
}
