import { Skeleton } from '@/components/ui/skeleton';

export function CandidateHomeSkeleton() {
  return (
    <div className="min-h-svh px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-80 w-full rounded-4xl" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-96 w-full rounded-4xl" />
          <Skeleton className="h-96 w-full rounded-4xl" />
        </div>
      </div>
    </div>
  );
}
