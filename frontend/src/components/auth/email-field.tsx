import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EmailFieldProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function EmailField({
  id = 'email',
  value,
  onChange,
  placeholder = 'seu@email.com',
  required = true,
}: EmailFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Email</Label>
      <Input
        id={id}
        type="email"
        placeholder={placeholder}
        value={value}
        onChange={event => onChange(event.target.value)}
        required={required}
      />
    </div>
  );
}
