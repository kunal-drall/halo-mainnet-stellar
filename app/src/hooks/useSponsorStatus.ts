"use client";

import { useState, useEffect } from "react";

interface SponsorStatus {
  enabled: boolean;
  sponsorPublicKey: string | null;
  remainingToday: number;
  dailyLimit: number;
}

/**
 * Hook to check fee sponsorship status for the current user.
 * Returns null while loading.
 */
export function useSponsorStatus() {
  const [status, setStatus] = useState<SponsorStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch("/api/stellar/sponsor/status");
        if (res.ok) {
          const data = await res.json();
          setStatus(data);
        }
      } catch {
        // Silently fail - sponsorship is optional
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, []);

  return { status, loading };
}
