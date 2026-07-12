import { CONCEPT_LABELS, scoreToConcept } from '@/lib/api/interviews';

interface ScoreInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function ScoreInput({
  label,
  value,
  onChange,
  min = 0,
  max = 10,
  step = 0.5,
}: ScoreInputProps) {
  const concept = scoreToConcept(value);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange(0);
      return;
    }
    const num = parseFloat(raw);
    if (!isNaN(num)) {
      onChange(Math.min(max, Math.max(min, num)));
    }
  };

  const getConceptColor = (c: string) => {
    switch (c) {
      case 'OTIMO':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'BOM':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'REGULAR':
        return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'FRACO':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700">{label}</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={value}
              onChange={handleInputChange}
              min={min}
              max={max}
              step={step}
              className="w-16 rounded-md border border-slate-300 px-2 py-1 text-center text-sm font-bold text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <span className="text-xs text-slate-400">/ {max}</span>
          </div>
        </div>

        {/* Slider */}
        <input
          type="range"
          value={value}
          onChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-indigo-600"
        />

        {/* Grade de valores de referência */}
        <div className="flex justify-between px-0.5">
          {[0, 2, 4, 6, 8, 10].map(mark => (
            <button
              key={mark}
              type="button"
              onClick={() => onChange(mark)}
              className={`text-[10px] font-medium transition-colors ${
                Math.abs(value - mark) < 0.3
                  ? 'text-indigo-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {mark}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-400">Conceito:</span>
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getConceptColor(concept)}`}
          >
            {CONCEPT_LABELS[concept]}
          </span>
        </div>
      </div>
    </div>
  );
}
