"use client";

import React, { useState, useCallback } from "react";

interface AddressDisplayProps {
  address: string;
  truncate?: boolean;
  className?: string;
  href?: string;
}

export function AddressDisplay({
  address,
  truncate = true,
  className = "",
  href,
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const displayAddress = truncate
    ? `${address.slice(0, 6)}...${address.slice(-6)}`
    : address;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = address;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [address]);

  const addressElement = href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:underline"
    >
      {displayAddress}
    </a>
  ) : (
    <span>{displayAddress}</span>
  );

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-sm text-[var(--color-soft-white,#E5E7EB)] ${className}`}
    >
      {addressElement}

      <button
        type="button"
        onClick={handleCopy}
        className="relative inline-flex items-center justify-center w-5 h-5 rounded hover:bg-white/10 transition-colors"
        aria-label="Copy address"
      >
        {copied ? (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-3.5 h-3.5 text-emerald-400"
            >
              <path
                fillRule="evenodd"
                d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                clipRule="evenodd"
              />
            </svg>
            <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 text-[10px] font-sans text-white bg-neutral-800 rounded whitespace-nowrap pointer-events-none">
              Copied!
            </span>
          </>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="w-3.5 h-3.5 text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            <path
              fillRule="evenodd"
              d="M10.986 3H12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1.014A2 2 0 0 1 2 10V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 1.986V3ZM5.5 5v5A1.5 1.5 0 0 0 7 11.5h5V13a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V5ZM7 3.5H4a.5.5 0 0 0-.5.5v6a.5.5 0 0 0 .5.5h1V5a2 2 0 0 1 2-2Z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
    </span>
  );
}
