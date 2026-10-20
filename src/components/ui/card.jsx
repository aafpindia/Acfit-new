import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export const Card = React.forwardRef(
  ({ className, hoverLift = false, glass = false, ...props }, ref) => {
    const Component = hoverLift ? motion.div : 'div';
    const animationProps = hoverLift 
      ? { 
          whileHover: { y: -4, shadow: 'var(--shadow-premium-hover)' },
          transition: { type: 'spring', stiffness: 300, damping: 20 }
        } 
      : {};

    return (
      <Component
        ref={ref}
        className={cn(
          'rounded-xl border border-border bg-card text-text-main shadow-premium',
          glass && 'glass-panel backdrop-blur-md',
          hoverLift && 'transition-all duration-300 hover:shadow-premium-hover hover:-translate-y-0.5',
          className
        )}
        {...animationProps}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('font-semibold text-lg leading-none tracking-tight text-text-main', className)} {...props} />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-text-secondary', className)} {...props} />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0 border-t border-border mt-4', className)} {...props} />
  )
);
CardFooter.displayName = 'CardFooter';
