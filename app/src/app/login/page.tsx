import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="min-h-screen flex items-center justify-center px-4 grid-pattern">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B0F1A] via-[#0B0F1A] to-[#111827]" />

      {/* Glow effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-white">Halo</h1>
          </Link>
          <p className="mt-2 text-neutral-400">Build Credit Through Community</p>
        </div>

        {/* Login Card */}
        <Card variant="glass">
          <CardHeader className="text-center">
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your circles and credit score
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && <AuthError error={error} />}
            <GoogleSignInButton />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#111827] px-2 text-neutral-500">
                  Secure & Private
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm text-neutral-400">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Your data is encrypted and stored securely</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>We never share your information with third parties</span>
              </div>
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Built on the secure Stellar blockchain</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <p className="mt-6 text-center text-xs text-neutral-500">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-white hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-white hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
