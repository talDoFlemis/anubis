import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium ring-offset-background transition-[color,background-color,box-shadow,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'anubis-gradient-action text-primary-foreground shadow-[0_22px_45px_-24px_rgba(9,76,178,0.72)] hover:brightness-105',
        destructive:
          'bg-destructive text-destructive-foreground shadow-[0_22px_45px_-24px_rgba(186,26,26,0.5)] hover:brightness-105',
        outline:
          'anubis-glass anubis-ghost-border text-foreground hover:bg-[rgba(255,255,255,0.92)] hover:text-primary',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-[var(--surface-highest)]',
        ghost:
          'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        link: 'rounded-none px-0 text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5 py-2 text-sm',
        sm: 'h-9 px-3.5 text-sm',
        lg: 'h-12 px-8 text-base',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
