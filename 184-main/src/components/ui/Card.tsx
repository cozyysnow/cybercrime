import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'white' | 'dark' | 'glass' | 'platinum' | 'muted';
  crosshairs?: boolean; // kept for interface compatibility
}

export default function Card({
  children,
  variant = 'white',
  crosshairs = false,
  className,
  ...props
}: CardProps) {
  const variantStyles = {
    white: "bg-white border border-slate-200 text-slate-900 shadow-sm hover:shadow-md hover:border-slate-300",
    dark: "bg-white border border-slate-200 text-slate-900 shadow-sm", // updated from pitch dark to clean light
    glass: "bg-white/90 backdrop-blur-md border border-slate-200/80 text-slate-900 shadow-sm",
    platinum: "bg-slate-50 border border-slate-200 text-slate-900 shadow-sm",
    muted: "bg-slate-50/80 border border-slate-100 text-slate-700",
  };

  return (
    <div
      className={cn(
        "rounded-xl p-6 transition-all duration-200",
        variantStyles[variant] || variantStyles.white,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
