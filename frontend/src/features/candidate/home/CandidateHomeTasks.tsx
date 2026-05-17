import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockCandidateHome } from '@/lib/mock-candidate-home';
import { CircleCheckBig, Clock3 } from 'lucide-react';

export function CandidateHomeTasks() {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <p className="font-label text-primary">Proximas acoes</p>
        <CardTitle>Checklist curado para esta semana</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockCandidateHome.tasks.map(task => (
          <div key={task.title} className="anubis-surface-stack rounded-3xl p-5">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 text-primary mt-1 rounded-full p-2">
                <CircleCheckBig className="h-4 w-4" />
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-foreground font-serif text-lg">{task.title}</p>
                  <Badge variant="outline">{task.emphasis}</Badge>
                </div>
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Clock3 className="h-4 w-4" />
                  {task.due}
                </p>
              </div>
            </div>
          </div>
        ))}

        <Button className="w-full">Preparar documentacao</Button>
      </CardContent>
    </Card>
  );
}
