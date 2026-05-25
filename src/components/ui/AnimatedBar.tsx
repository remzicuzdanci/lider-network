"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedBarProps {
  value: number;
  color?: string;
  bgColor?: string;
  delay?: number;
}

export default function AnimatedBar({
  value,
  color = "var(--color-primary-container)",
  bgColor = "var(--color-outline-variant)",
  delay = 0,
}: AnimatedBarProps) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setWidth(value), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [value, delay]);

  return (
    <div
      ref={ref}
      className="h-1.5 rounded-full overflow-hidden"
      style={{ backgroundColor: bgColor }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${width}%`,
          backgroundColor: color,
          transition: `width 1.3s cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      />
    </div>
  );
}
