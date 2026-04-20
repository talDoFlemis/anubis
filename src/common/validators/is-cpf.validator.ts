import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { normalizeCpf } from '../utils/normalize-cpf';

/**
 * Validates a Brazilian CPF number.
 *
 * Accepts either the raw 11-digit string ("12345678909") or the formatted
 * version ("123.456.789-09"). All-same-digit sequences (e.g. "11111111111")
 * are rejected as they are structurally invalid per the CPF spec.
 */
export function isValidCpf(cpf: unknown): boolean {
  if (typeof cpf !== 'string') return false;
  if (!/^[\d.-]+$/.test(cpf)) return false;

  const digits = normalizeCpf(cpf);

  if (typeof digits !== 'string') return false;

  if (digits.length !== 11) return false;
  if (!/^\d{11}$/.test(digits)) return false;

  // Reject sequences of all identical digits
  if (/^(\d)\1{10}$/.test(digits)) return false;

  const calc = (factor: number): number => {
    let sum = 0;
    for (let i = 0; i < factor - 1; i++) {
      sum += parseInt(digits[i]) * (factor - i);
    }
    const remainder = (sum * 10) % 11;
    return remainder === 10 || remainder === 11 ? 0 : remainder;
  };

  return calc(10) === parseInt(digits[9]) && calc(11) === parseInt(digits[10]);
}

@ValidatorConstraint({ name: 'IsCpf', async: false })
export class IsCpfConstraint implements ValidatorConstraintInterface {
  validate(cpf: unknown): boolean {
    return isValidCpf(cpf);
  }

  defaultMessage(): string {
    return 'CPF inválido.';
  }
}

export function IsCpf(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCpfConstraint,
    });
  };
}
