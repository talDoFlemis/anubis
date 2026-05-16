import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { toFieldErrors } from '@/shared/errors/fieldErrors';

interface EmailFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  errors?: readonly unknown[];
  isInvalid?: boolean;
}

export function EmailField({
  id = 'email',
  value,
  onChange,
  onBlur,
  placeholder = 'seu@email.com',
  required = true,
  autoComplete = 'email',
  errors,
  isInvalid = false,
}: EmailFieldProps) {
  const fieldErrors = toFieldErrors(errors);

  return (
    <Field data-invalid={isInvalid} className="space-y-2">
      <FieldLabel htmlFor={id}>Email</FieldLabel>
      <FieldContent>
        <Input
          id={id}
          type="email"
          placeholder={placeholder}
          value={value}
          onChange={event => onChange(event.target.value)}
          onBlur={onBlur}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={isInvalid}
        />
        <FieldError errors={fieldErrors} />
      </FieldContent>
    </Field>
  );
}
