import type { Concept } from '@/lib/api';
import { CONCEPT_LABELS, CONCEPT_SCORE } from '@/lib/api/interviews';

interface ConceptSelectorProps {
  label: string;
  value: Concept;
  onChange: (value: Concept) => void;
}

const CONCEPT_OPTIONS: Concept[] = ['FRACO', 'REGULAR', 'BOM', 'OTIMO'];

export function ConceptSelector({ label, value, onChange }: ConceptSelectorProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex-1">
        <label className="text-sm font-semibold text-slate-700">{label}</label>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {CONCEPT_OPTIONS.map(concept => {
            const isSelected = value === concept;
            const score = CONCEPT_SCORE[concept];

            return (
              <button
                key={concept}
                type="button"
                onClick={() => onChange(concept)}
                className={`
                  relative flex min-w-[70px] flex-col items-center rounded-lg px-3 py-2 text-xs font-semibold
                  transition-all
                  ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }
                `}
              >
                <span>{CONCEPT_LABELS[concept]}</span>
                <span
                  className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}
                >
                  {score} pts
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
