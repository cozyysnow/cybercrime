import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'zinc' | 'critical' | 'outline' | 'pulse' | 'neon' | 'success';
  className?: string;
  dot?: boolean;
}

export default function Badge({
  children,
  variant = 'blue',
  className,
  dot = false,
}: BadgeProps) {
  const variantStyles = {
    blue: "text-blue-700 bg-blue-50 border-blue-200",
    neon: "text-blue-700 bg-blue-50 border-blue-200", // backward compatibility
    zinc: "text-slate-700 bg-slate-100 border-slate-200",
    critical: "text-red-700 bg-red-50 border-red-200",
    success: "text-emerald-700 bg-emerald-50 border-emerald-200",
    outline: "text-slate-600 bg-white border-slate-300",
    pulse: "text-blue-700 bg-blue-50 border-blue-200",
  };

  const dotColors = {
    blue: "bg-blue-600",
    neon: "bg-blue-600",
    zinc: "bg-slate-500",
    critical: "bg-red-500",
    success: "bg-emerald-500",
    outline: "bg-slate-400",
    pulse: "bg-blue-600",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          {variant === 'pulse' || variant === 'critical' ? (
            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", dotColors[variant])}></span>
          ) : null}
          <span className={cn("relative inline-flex rounded-full h-2 w-2", dotColors[variant])}></span>
        </span>
      )}
      <span>{children}</span>
    </span>
  );
}
