type HomeMetricCardProps = {
  label: string;
  value: string;
};

export function HomeMetricCard({ label, value }: HomeMetricCardProps) {
  return (
    <div className="anubis-glass anubis-ghost-border rounded-3xl p-5">
      <p className="font-label text-muted-foreground">{label}</p>
      <p className="text-foreground mt-3 font-serif text-2xl leading-tight">{value}</p>
    </div>
  );
}
