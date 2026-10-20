import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export const Select = ({
  options = [],
  value,
  onValueChange,
  onChange,
  placeholder = 'Select an option',
  label,
  error,
  className,
  containerClassName,
  disabled = false,
  children
}) => {
  const safeOptions = Array.isArray(options) ? options : [];
  const handleValueChange = (val) => {
    if (onValueChange) onValueChange(val);
    if (onChange) onChange({ target: { value: val } });
  };

  return (
    <div className={cn('flex flex-col space-y-1.5 w-full', containerClassName)}>
      {label && (
        <span className="text-xs font-semibold text-text-secondary select-none tracking-wide uppercase">
          {label}
        </span>
      )}
      <SelectPrimitive.Root value={value} onValueChange={handleValueChange} disabled={disabled}>
        <SelectPrimitive.Trigger
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-main shadow-xs transition-colors focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error focus:ring-error focus:border-error',
            className
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="relative z-50 min-w-[8rem] overflow-hidden rounded-lg border border-border bg-white text-text-main shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className="h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] p-1">
              {safeOptions.length > 0 ? (
                safeOptions.map((option) => (
                  <SelectPrimitive.Item
                    key={option?.value ?? option}
                    value={option?.value ?? option}
                    className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-none hover:bg-background focus:bg-background focus:text-text-main data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <SelectPrimitive.ItemIndicator>
                        <Check className="h-4 w-4 text-primary" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <SelectPrimitive.ItemText>{option?.label ?? option?.value ?? option}</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))
              ) : (
                children
              )}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      
      {error && (
        <span className="text-xs text-error font-medium mt-1">
          {error}
        </span>
      )}
    </div>
  );
};

export default Select;
