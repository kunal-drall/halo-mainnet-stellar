import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "success"
    | "warning"
    | "error"
    | "info"
    | "forming"
    | "active"
    | "completed";
}

const Badge = ({
  className,
  variant = "default",
  ...props
}: BadgeProps) => {
  const variants = {
    default: "bg-white/10 text-white",
    success: "bg-green-500/20 text-green-400",
    warning: "bg-yellow-500/20 text-yellow-400",
    error: "bg-red-500/20 text-red-400",
    info: "bg-blue-500/20 text-blue-400",
    forming: "bg-yellow-500/20 text-yellow-400",
    active: "bg-green-500/20 text-green-400",
    completed: "bg-purple-500/20 text-purple-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
};

Badge.displayName = "Badge";

export { Badge };
