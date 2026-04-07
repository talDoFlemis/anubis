import { Separator } from '@/components/ui/separator';

interface OAuthDividerProps {
  label?: string;
}

export function OAuthDivider({
  label = 'alternativa de acesso',
}: OAuthDividerProps) {
  return (
    <div className="relative py-1">
      <Separator />
      <span className="anubis-surface-stack absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full px-4 py-1 text-[0.68rem] text-muted-foreground font-label">
        {label}
      </span>
    </div>
  );
}
