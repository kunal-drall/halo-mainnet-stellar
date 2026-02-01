"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function KYCPage() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    // Simulate KYC verification (in production, this would open Fractal ID widget)
    await new Promise((resolve) => setTimeout(resolve, 2000));
    router.push("/onboarding/wallet");
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-sm font-medium">
            1
          </div>
          <span className="text-sm text-white">Verify Identity</span>
        </div>
        <div className="flex-1 h-px bg-white/20" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/10 text-neutral-400 flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="text-sm text-neutral-400">Connect Wallet</span>
        </div>
      </div>

      <Card variant="glass">
        <CardHeader>
          <CardTitle>Verify Your Identity</CardTitle>
          <CardDescription>
            Complete a quick identity verification to prevent fraud and ensure
            one account per person.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5">
              <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">Privacy Protected</p>
                <p className="text-xs text-neutral-400">
                  Your data is encrypted and never shared with third parties.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5">
              <svg className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">Quick Process</p>
                <p className="text-xs text-neutral-400">
                  Verification typically takes less than 2 minutes.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 rounded-lg bg-white/5">
              <svg className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
              </svg>
              <div>
                <p className="text-sm font-medium text-white">One-Time Only</p>
                <p className="text-xs text-neutral-400">
                  You only need to verify once per account.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleVerify}
              loading={isVerifying}
              className="w-full"
              size="lg"
            >
              {isVerifying ? "Verifying..." : "Start Verification"}
            </Button>
            <p className="text-xs text-center text-neutral-500 mt-4">
              For testnet, verification is simulated. Production will use Fractal ID.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
