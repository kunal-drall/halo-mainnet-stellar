"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  isConnected,
  isAllowed,
  requestAccess,
  getAddress,
} from "@stellar/freighter-api";

export default function WalletPage() {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [freighterAvailable, setFreighterAvailable] = useState<boolean | null>(null);
  const [isCheckingFreighter, setIsCheckingFreighter] = useState(true);

  // Check for Freighter availability using the official API
  useEffect(() => {
    const checkFreighter = async () => {
      setIsCheckingFreighter(true);

      try {
        // Use the official Freighter API to check connection
        // This method properly handles extension detection in all environments
        const connectedResult = await isConnected();

        if (connectedResult.isConnected) {
          setFreighterAvailable(true);

          // Check if already allowed and get address
          const allowedResult = await isAllowed();
          if (allowedResult.isAllowed) {
            try {
              const addressResult = await getAddress();
              if (addressResult.address) {
                setWalletAddress(addressResult.address);
              }
            } catch {
              // Not connected yet, that's fine
            }
          }
        } else {
          // If not connected on first check, try a few more times
          // Extension might still be loading
          for (let i = 0; i < 5; i++) {
            await new Promise((resolve) => setTimeout(resolve, 500));
            const retryResult = await isConnected();
            if (retryResult.isConnected) {
              setFreighterAvailable(true);
              setIsCheckingFreighter(false);
              return;
            }
          }
          setFreighterAvailable(false);
        }
      } catch (err) {
        console.error("Error checking Freighter:", err);
        setFreighterAvailable(false);
      } finally {
        setIsCheckingFreighter(false);
      }
    };

    checkFreighter();
  }, []);

  const connectFreighter = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Verify Freighter is available
      const connectedResult = await isConnected();
      if (!connectedResult.isConnected) {
        setError("Freighter wallet not found. Please install the Freighter extension and refresh the page.");
        setIsConnecting(false);
        return;
      }

      // Request access to the wallet - this also returns the address
      const accessResult = await requestAccess();

      if (accessResult.error) {
        setError(`Access denied: ${accessResult.error}`);
        setIsConnecting(false);
        return;
      }

      if (!accessResult.address) {
        setError("Failed to get wallet address. Please try again.");
        setIsConnecting(false);
        return;
      }

      const publicKey = accessResult.address;

      // Call API to bind wallet
      const response = await fetch("/api/onboarding/wallet/bind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: publicKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 403 && data.error?.includes("KYC")) {
          setError("Please complete KYC verification first before connecting your wallet.");
        } else {
          setError(data.error || "Failed to bind wallet");
        }
        setIsConnecting(false);
        return;
      }

      // Only show connected state after successful binding
      setWalletAddress(publicKey);

      // Success - redirect to dashboard after a brief delay to show success state
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (err) {
      console.error("Wallet connection error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsConnecting(false);
    }
  };

  const skipForNow = () => {
    // For testnet, allow skipping wallet binding
    router.push("/dashboard");
  };

  const isLoading = isCheckingFreighter || freighterAvailable === null;

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

              {!isLoading && freighterAvailable === false && !error && (
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
                loading={isConnecting || isLoading}
                disabled={!isLoading && freighterAvailable === false}
                className="w-full"
                size="lg"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                </svg>
                {isLoading
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
