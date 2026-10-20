import React from 'react';
import { cn } from '../../lib/utils';

export const Textarea = React.forwardRef(
  ({ className, label, error, containerClassName, id, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={cn('flex flex-col space-y-1.5 w-full', containerClassName)}>
        {label && (
          <label htmlFor={textareaId} className="text-xs font-semibold text-text-secondary select-none tracking-wide uppercase">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            'flex min-h-[80px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 font-medium shadow-2xs transition-all placeholder:text-slate-400 placeholder:font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/20 focus-visible:border-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error focus-visible:ring-error focus-visible:border-error',
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-xs text-error font-medium mt-1">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
