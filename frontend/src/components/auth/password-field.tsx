import { Link } from '@tanstack/react-router';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minLength?: number;
  required?: boolean;
  forgotPasswordLink?: boolean;
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  placeholder = 'Sua senha',
  minLength,
  required = true,
  forgotPasswordLink = false,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>{label}</Label>
        {forgotPasswordLink ? (
          <Link
            to="/auth/forgot-password"
            className="text-primary text-sm underline-offset-4 hover:underline"
          >
            Recuperar acesso
          </Link>
        ) : null}
      </div>
      <div className="relative">
        <Input
          id={id}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={event => onChange(event.target.value)}
          minLength={minLength}
          required={required}
          className="pr-11"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-1/2 right-1 h-9 w-9 -translate-y-1/2 active:translate-y-[-50%]"
          onClick={() => setVisible(prev => !prev)}
          tabIndex={-1}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
