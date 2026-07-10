export const MEC_SCORE_FACTORS: Record<number, number> = {
  5: 1.0,
  4: 0.8,
  3: 0.6,
  2: 0.4,
  1: 0.2,
};

export const DEFAULT_MEC_FACTOR = 0.6;

export function getMecFactor(mecScore: number | null | undefined): number {
  if (mecScore === null || mecScore === undefined) return DEFAULT_MEC_FACTOR;
  return MEC_SCORE_FACTORS[mecScore] ?? DEFAULT_MEC_FACTOR;
}
