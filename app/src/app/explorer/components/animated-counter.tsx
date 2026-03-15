"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  label: string;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedCounter({
  value,
  duration = 2000,
  label,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  const animate = useCallback(() => {
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      setDisplayValue(Math.round(easedProgress * value));

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      }
    };

    animationRef.current = requestAnimationFrame(step);
  }, [value, duration]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          animate();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, hasAnimated]);

  return (
    <div ref={ref} className="flex flex-col items-center gap-1">
      <span className="text-5xl font-bold font-mono text-[var(--color-soft-white,#E5E7EB)]">
        {displayValue.toLocaleString()}
      </span>
      <span className="text-xs uppercase tracking-wider text-neutral-500">
        {label}
      </span>
    </div>
  );
}
