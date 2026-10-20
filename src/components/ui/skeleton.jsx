import React from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-gray-200/80 dark:bg-gray-800/80', className)}
      {...props}
    />
  );
}

export default Skeleton;
