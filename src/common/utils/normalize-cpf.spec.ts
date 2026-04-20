import { normalizeCpf } from './normalize-cpf';

describe('normalizeCpf', () => {
  it('removes punctuation from CPF strings', () => {
    expect(normalizeCpf('529.982.247-25')).toBe('52998224725');
  });

  it('preserves non-string values', () => {
    expect(normalizeCpf(undefined)).toBeUndefined();
    expect(normalizeCpf(null)).toBeNull();
    expect(normalizeCpf(123)).toBe(123);
  });
});
