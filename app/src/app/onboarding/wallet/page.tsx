"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function WalletPage() {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [freighterAvailable, setFreighterAvailable] = useState<boolean | null>(null);

  // Check for Freighter availability on mount with retry logic
  useEffect(() => {
    const checkFreighter = async () => {
      // Try up to 10 times with increasing delays
      for (let i = 0; i < 10; i++) {
        if (typeof window !== "undefined" && (window as any).freighter) {
          setFreighterAvailable(true);
          return;
        }
        // Wait with increasing delay: 200ms, 400ms, 600ms, etc.
        await new Promise((resolve) => setTimeout(resolve, 200 * (i + 1)));
      }
      // After all retries, Freighter is not available
      setFreighterAvailable(false);
    };

    checkFreighter();
  }, []);

  const connectFreighter = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Double-check Freighter availability with one more attempt
      if (typeof window === "undefined" || !(window as any).freighter) {
        // Try one more time with a short delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        if (!(window as any).freighter) {
          setError("Freighter wallet not found. Please install the Freighter extension and refresh the page.");
          setIsConnecting(false);
          return;
        }
      }

      // Request public key from Freighter
      const publicKey = await (window as any).freighter?.getPublicKey();

      if (!publicKey) {
        setError("Failed to get wallet address. Please try again.");
        setIsConnecting(false);
        return;
      }

      setWalletAddress(publicKey);

      // Call API to bind wallet
      const response = await fetch("/api/onboarding/wallet/bind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: publicKey }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to bind wallet");
      }

      // Success - redirect to dashboard
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsConnecting(false);
    }
  };

  const skipForNow = () => {
    // For testnet, allow skipping wallet binding
    router.push("/dashboard");
  };

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <span className="text-sm text-neutral-400">Verify Identity</span>
        </div>
        <div className="flex-1 h-px bg-white/20" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-sm font-medium">
            2
          </div>
          <span className="text-sm text-white">Connect Wallet</span>
        </div>
      </div>

      <Card variant="glass">
        <CardHeader>
          <CardTitle>Connect Your Wallet</CardTitle>
          <CardDescription>
            Link your Freighter wallet to complete setup. This binding is permanent
            and ensures one wallet per identity.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {walletAddress ? (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-400">Wallet Connected</p>
                  <p className="text-xs text-neutral-400 font-mono mt-1">
                    {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <svg className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-400">Important</p>
                    <p className="text-xs text-neutral-400">
                      This wallet will be permanently linked to your identity. You cannot
                      change it later. Make sure you're using the correct wallet.
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-400">{error}</p>
                  {error.includes("not found") && (
                    <a
                      href="https://www.freighter.app/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-red-400 hover:underline mt-2 block"
                    >
                      Install Freighter Wallet →
                    </a>
                  )}
                </div>
              )}

              {freighterAvailable === false && !error && (
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <p className="text-sm text-blue-400">
                    Freighter wallet not detected. Please install the extension and refresh.
                  </p>
                  <a
                    href="https://www.freighter.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline mt-2 block"
                  >
                    Get Freighter Wallet →
                  </a>
                </div>
              )}

              <Button
                onClick={connectFreighter}
                loading={isConnecting || freighterAvailable === null}
                disabled={freighterAvailable === false}
                className="w-full"
                size="lg"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                </svg>
                {freighterAvailable === null
                  ? "Detecting Wallet..."
                  : freighterAvailable
                  ? "Connect Freighter Wallet"
                  : "Freighter Not Detected"}
              </Button>
            </>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#111827] px-2 text-neutral-500">or</span>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={skipForNow}
            className="w-full"
          >
            Skip for now (Testnet only)
          </Button>

          <p className="text-xs text-center text-neutral-500">
            You can connect your wallet later from settings, but you won't be able
            to participate in circles until you do.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
