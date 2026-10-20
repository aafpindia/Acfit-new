import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export const Button = React.forwardRef(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    
    const baseStyles = 'inline-flex items-center justify-center whitespace-nowrap font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none';
    
    const variants = {
      primary: 'bg-primary text-white font-bold hover:bg-primary-hover shadow-sm hover:shadow-md transition-shadow',
      secondary: 'bg-secondary text-slate-800 font-bold hover:bg-secondary-hover shadow-sm',
      outline: 'bg-transparent border border-border text-text-main hover:bg-background hover:border-primary/30 transition-colors',
      ghost: 'bg-transparent text-text-main hover:bg-background',
      danger: 'bg-error text-white hover:bg-red-600 shadow-sm'
    };

    const sizes = {
      sm: 'h-9 px-3 text-xs gap-1.5',
      md: 'h-10 px-4 text-sm gap-2',
      lg: 'h-11 px-6 text-base gap-2.5'
    };

    const handleRipple = (e) => {
      const button = e.currentTarget;
      const ripple = document.createElement('span');
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.classList.add('ripple-span');
      
      const container = button.querySelector('.ripple-container-inner') || button;
      container.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    };

    return (
      <motion.button
        ref={ref}
        disabled={disabled || isLoading}
        whileTap={{ scale: 0.98 }}
        onClick={(e) => {
          handleRipple(e);
          if (props.onClick) props.onClick(e);
        }}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          'ripple-container',
          className
        )}
        {...props}
      >
        <span className="ripple-container-inner absolute inset-0 pointer-events-none overflow-hidden rounded-lg" />
        
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-current shrink-0" />}
        {!isLoading && leftIcon && <span className="shrink-0 flex items-center">{leftIcon}</span>}
        
        <span className="relative z-10 inline-flex items-center justify-center gap-1.5 whitespace-nowrap">{children}</span>
        
        {!isLoading && rightIcon && <span className="shrink-0 flex items-center">{rightIcon}</span>}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
