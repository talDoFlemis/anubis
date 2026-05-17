import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockCandidateHome } from '@/lib/mock-candidate-home';

export function CandidateHomeTimeline() {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <p className="font-label text-primary">Linha do tempo</p>
        <CardTitle>Etapas em destaque</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockCandidateHome.timeline.map(item => (
          <div key={item.title} className="anubis-surface-muted rounded-3xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-2">
                <p className="text-foreground font-serif text-xl">{item.title}</p>
                <p className="text-muted-foreground text-sm leading-6">{item.description}</p>
              </div>
              <Badge variant={item.status === 'current' ? 'default' : 'outline'}>{item.date}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
