import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-2xl bg-[linear-gradient(90deg,var(--surface),var(--surface-high),var(--surface))]',
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
