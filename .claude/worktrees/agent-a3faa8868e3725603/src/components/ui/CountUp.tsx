"use client";

import { useEffect, useRef, useState } from "react";

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function CountUp({
  end,
  duration = 1800,
  suffix = "",
  prefix = "",
  decimals = 0,
  className,
  style,
}: CountUpProps) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const startTime = performance.now();
    let raf: number;
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const value = easeOut(progress) * end;
      setCount(
        decimals > 0
          ? Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)
          : Math.round(value)
      );
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [started, end, duration, decimals]);

  const display =
    decimals > 0 ? count.toFixed(decimals) : count.toString();

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
