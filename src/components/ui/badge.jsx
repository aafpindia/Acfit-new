import React from 'react';
import { cn } from '../../lib/utils';

export const Badge = ({
  className,
  variant = 'primary',
  children,
  ...props
}) => {
  const variants = {
    primary: 'bg-primary/10 text-primary border border-primary/20',
    secondary: 'bg-text-secondary/10 text-text-secondary border border-text-secondary/20',
    success: 'bg-success/10 text-success border border-success/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    error: 'bg-error/10 text-error border border-error/20',
    outline: 'bg-transparent text-text-main border border-border'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold select-none leading-none shrink-0 tracking-wide',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
