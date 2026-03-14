"use client";

import { ReactNode } from "react";
import { ErrorBoundary } from "@/components/error-boundary";

/**
 * Client-side providers wrapper for the app layout.
 * Wraps children in error boundary and any future context providers.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
