import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'anubis-ghost-border text-foreground ring-offset-background placeholder:text-muted-foreground/85 focus-visible:ring-ring flex h-12 w-full rounded-2xl bg-[rgba(255,255,255,0.94)] px-4 py-3 text-base focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

export { Input };
