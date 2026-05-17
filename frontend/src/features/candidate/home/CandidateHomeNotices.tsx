import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockCandidateHome } from '@/lib/mock-candidate-home';
import { Bell } from 'lucide-react';

export function CandidateHomeNotices() {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <p className="font-label text-primary">Alertas e leitura rapida</p>
        <CardTitle>O que merece atencao agora</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockCandidateHome.notices.map(notice => (
          <div key={notice.title} className="anubis-surface-muted rounded-3xl p-5">
            <div className="text-primary mb-3 flex items-center gap-3">
              <Bell className="h-4 w-4" />
              <span className="font-label text-primary">{notice.tag}</span>
            </div>
            <p className="text-foreground font-serif text-xl">{notice.title}</p>
            <p className="text-muted-foreground mt-2 text-sm leading-6">{notice.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
