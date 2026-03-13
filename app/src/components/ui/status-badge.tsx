"use client";

type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral";

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  neutral: "bg-white/5 text-neutral-400 border-white/10",
};

/**
 * Status badge for circle status, contribution status, etc.
 */
export function StatusBadge({ label, variant = "neutral", className = "" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
    >
      {label}
    </span>
  );
}

/**
 * Map circle status to badge variant.
 */
export function circleStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "active":
      return "success";
    case "forming":
      return "info";
    case "completed":
      return "neutral";
    case "cancelled":
      return "error";
    default:
      return "neutral";
  }
}

/**
 * Map contribution status to badge variant.
 */
export function contributionStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "paid":
      return "success";
    case "pending":
      return "warning";
    case "late":
      return "error";
    case "missed":
      return "error";
    default:
      return "neutral";
  }
}
