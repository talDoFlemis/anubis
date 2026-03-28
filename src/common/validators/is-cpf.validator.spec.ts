import { isValidCpf } from './is-cpf.validator';

describe('isValidCpf', () => {
  describe('valid CPFs', () => {
    it('should accept a valid raw 11-digit CPF', () => {
      // Mathematically valid CPF
      expect(isValidCpf('52998224725')).toBe(true);
    });

    it('should accept a valid formatted CPF (XXX.XXX.XXX-XX)', () => {
      expect(isValidCpf('529.982.247-25')).toBe(true);
    });

    it('should accept another valid CPF', () => {
      expect(isValidCpf('11144477735')).toBe(true);
    });
  });

  describe('invalid CPFs', () => {
    it('should reject non-string values', () => {
      expect(isValidCpf(12345678909)).toBe(false);
      expect(isValidCpf(null)).toBe(false);
      expect(isValidCpf(undefined)).toBe(false);
      expect(isValidCpf({})).toBe(false);
    });

    it('should reject strings with fewer than 11 digits', () => {
      expect(isValidCpf('1234567890')).toBe(false);
      expect(isValidCpf('123.456.789')).toBe(false);
    });

    it('should reject strings with more than 11 digits', () => {
      expect(isValidCpf('123456789012')).toBe(false);
    });

    it('should reject strings containing non-digit characters other than . and -', () => {
      expect(isValidCpf('1234 5678 909')).toBe(false);
      expect(isValidCpf('abcdefghijk')).toBe(false);
    });

    it('should reject all-same-digit sequences', () => {
      expect(isValidCpf('00000000000')).toBe(false);
      expect(isValidCpf('11111111111')).toBe(false);
      expect(isValidCpf('22222222222')).toBe(false);
      expect(isValidCpf('99999999999')).toBe(false);
      expect(isValidCpf('111.111.111-11')).toBe(false);
    });

    it('should reject a CPF with incorrect first check digit', () => {
      // Flip the 10th digit of a valid CPF
      expect(isValidCpf('52998224715')).toBe(false);
    });

    it('should reject a CPF with incorrect second check digit', () => {
      // Flip the 11th digit of a valid CPF
      expect(isValidCpf('52998224724')).toBe(false);
    });

    it('should reject an empty string', () => {
      expect(isValidCpf('')).toBe(false);
    });
  });
});
