import { FileText } from 'lucide-react';

export function ValidationHeader() {
  return (
    <div className="space-y-2 mb-6">
      <div className="flex items-center gap-2 text-primary">
        <FileText className="h-4 w-4" />
        <p className="font-label">Mesa de Avaliação</p>
      </div>
      <h1 className="font-serif text-4xl leading-tight tracking-[-0.03em] text-foreground">
        Validação de Currículos
      </h1>
      <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
        Analise e valide a pontuação declarada pelos candidatos inscritos nos seus temas de
        pesquisa.
      </p>
    </div>
  );
}
