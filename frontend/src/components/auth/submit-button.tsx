import { Button } from '@/components/ui/button';

interface SubmitButtonProps {
  isPending: boolean;
  label: string;
  pendingLabel: string;
}

export function SubmitButton({ isPending, label, pendingLabel }: SubmitButtonProps) {
  return (
    <Button type="submit" className="w-full" disabled={isPending}>
      {isPending ? pendingLabel : label}
    </Button>
  );
}
