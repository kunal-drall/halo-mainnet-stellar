"use client";

import React, { useEffect, useRef } from "react";

interface Transaction {
  hash: string;
  type: string;
  wallet: string;
  timestamp: string;
  details: string;
}

interface TransactionTimelineProps {
  transactions: Transaction[];
}

const EVENT_TYPE_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  bind_wallet: {
    bg: "bg-white/10",
    text: "text-neutral-300",
    dot: "bg-neutral-400",
  },
  create_circle: {
    bg: "bg-[#E2A336]/15",
    text: "text-[#E2A336]",
    dot: "bg-[#E2A336]",
  },
  join_circle: {
    bg: "bg-emerald-500/15",
    text: "text-[#34D399]",
    dot: "bg-[#34D399]",
  },
  contribute: {
    bg: "bg-white/10",
    text: "text-neutral-300",
    dot: "bg-neutral-400",
  },
  payout: {
    bg: "bg-[#E2A336]/20",
    text: "text-[#E2A336]",
    dot: "bg-[#E2A336]",
  },
};

function getEventStyles(type: string) {
  return EVENT_TYPE_STYLES[type] || EVENT_TYPE_STYLES.contribute;
}

function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function TimelineItem({
  transaction,
  index,
}: {
  transaction: Transaction;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            element.style.opacity = "1";
            element.style.transform = "translateY(0)";
          }, index * 100);
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [index]);

  const styles = getEventStyles(transaction.type);
  const relativeTime = getRelativeTime(transaction.timestamp);
  const txUrl = `https://stellar.expert/explorer/testnet/tx/${transaction.hash}`;

  return (
    <div
      ref={ref}
      className="relative flex items-start gap-4 md:gap-0 opacity-0 translate-y-5 transition-all duration-500 ease-out"
      style={{ opacity: 0, transform: "translateY(20px)" }}
    >
      {/* Timestamp — left side on desktop, hidden on mobile (shown inline instead) */}
      <div className="hidden md:block w-[120px] shrink-0 text-right pr-6 pt-0.5">
        <span className="text-xs text-neutral-500 font-mono">{relativeTime}</span>
      </div>

      {/* Timeline node */}
      <div className="relative flex flex-col items-center shrink-0">
        <div
          className={`w-2 h-2 rounded-full ${styles.dot} ring-4 ring-[var(--color-midnight,#0B0F1A)] z-10`}
        />
        <div className="w-px flex-1 bg-white/10 absolute top-2 bottom-0" />
      </div>

      {/* Content — right side */}
      <div className="pb-8 pl-4 flex-1 min-w-0">
        {/* Mobile timestamp */}
        <span className="md:hidden text-xs text-neutral-500 font-mono">
          {relativeTime}
        </span>

        <div className="flex items-center gap-2 mt-0.5 md:mt-0 flex-wrap">
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold ${styles.bg} ${styles.text}`}
          >
            {transaction.type.replace(/_/g, " ")}
          </span>
        </div>

        <p className="text-sm text-[var(--color-soft-white,#E5E7EB)] mt-1.5 leading-relaxed">
          {transaction.details}
        </p>

        <a
          href={txUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-1 font-mono text-xs text-neutral-500 hover:text-neutral-300 hover:underline transition-colors truncate max-w-full"
        >
          {transaction.hash.slice(0, 12)}...{transaction.hash.slice(-8)}
        </a>
      </div>
    </div>
  );
}

export function TransactionTimeline({ transactions }: TransactionTimelineProps) {
  return (
    <div className="relative">
      {transactions.map((tx, i) => (
        <TimelineItem key={tx.hash} transaction={tx} index={i} />
      ))}
    </div>
  );
}
