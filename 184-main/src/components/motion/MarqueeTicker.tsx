'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MarqueeTickerProps {
  items: string[];
  direction?: 'left' | 'right';
  speed?: number;
  className?: string;
  theme?: 'dark' | 'platinum' | 'neon';
  separator?: string;
}

export default function MarqueeTicker({
  items,
  speed = 25,
  className,
  theme = 'platinum',
  separator = '→',
}: MarqueeTickerProps) {
  const themeStyles = {
    dark: 'bg-[#111111] text-white border-y border-white/10',
    platinum: 'bg-[#ececec] text-black border-y border-black/10',
    neon: 'bg-neon text-black border-y border-black',
  };

  // Duplicate items array to ensure seamless infinite scroll
  const duplicatedItems = [...items, ...items, ...items, ...items];

  return (
    <div className={cn('relative w-full overflow-hidden py-3 select-none', themeStyles[theme], className)}>
      <div
        className="flex whitespace-nowrap will-change-transform"
        style={{
          animation: `marquee ${speed}s linear infinite`,
        }}
      >
        {duplicatedItems.map((item, idx) => (
          <div key={idx} className="flex items-center mx-4 gap-4">
            <span className="font-mono text-sm sm:text-base font-bold uppercase tracking-widest">
              {item}
            </span>
            <span className={cn(
              "font-mono text-xs select-none",
              theme === 'neon' ? 'text-black/60' : theme === 'platinum' ? 'text-black/40' : 'text-neon'
            )}>
              {separator}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
