import React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: 'primary' | 'secondary' | 'dark' | 'outline' | 'ghost' | 'neon' | 'bracket';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export default function Button({
  href,
  variant = 'primary',
  size = 'md',
  className,
  children,
  icon,
  ...props
}: ButtonProps) {
  const baseClasses = "relative inline-flex items-center justify-center font-medium transition-all duration-200 select-none rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500";
  
  const sizeClasses = {
    sm: "text-xs px-3 py-1.5 gap-x-1.5",
    md: "text-sm px-4 py-2 gap-x-2",
    lg: "text-base px-5 py-2.5 gap-x-2.5",
  };

  let variantClasses = "";
  if (variant === 'primary' || variant === 'neon') {
    variantClasses = "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-colors";
  } else if (variant === 'secondary' || variant === 'outline') {
    variantClasses = "bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm transition-colors";
  } else if (variant === 'dark') {
    variantClasses = "bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors";
  } else if (variant === 'bracket') {
    variantClasses = "text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md font-mono text-xs transition-colors";
  } else if (variant === 'ghost') {
    variantClasses = "text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors";
  }

  const content = (
    <>
      <span className="flex items-center gap-2">{children}</span>
      {icon && (
        <span className="transition-transform duration-200 group-hover:translate-x-0.5">
          {icon}
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        onClick={props.onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}
        id={props.id}
        title={props.title}
        tabIndex={props.tabIndex}
        role={props.role}
        aria-label={props['aria-label']}
        className={cn(baseClasses, sizeClasses[size], variantClasses, className)}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      className={cn(baseClasses, sizeClasses[size], variantClasses, className)}
      {...props}
    >
      {content}
    </button>
  );
}
