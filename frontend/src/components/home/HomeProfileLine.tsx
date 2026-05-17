import type { ReactNode } from 'react';

type HomeProfileLineProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

export function HomeProfileLine({ icon, label, value }: HomeProfileLineProps) {
  return (
    <div className="anubis-surface-stack rounded-[1.2rem] p-4">
      <div className="text-muted-foreground mb-2 flex items-center gap-2">
        {icon}
        <span className="font-label text-muted-foreground">{label}</span>
      </div>
      <p className="text-foreground text-sm leading-6">{value}</p>
    </div>
  );
}
