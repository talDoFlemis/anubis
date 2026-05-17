import { useLogout } from '@/hooks/use-auth';
import { type JSX } from 'react';
import { Button } from './ui/button';

export function Footer(): JSX.Element {
  const logout = useLogout();
  const handleLogout = () => logout.mutate();
  return (
    <footer className="bg-background text-center py-4 mt-8">
      <div className="justify-self-start">
        <Button variant="destructive" onClick={handleLogout} className="cursor-pointer">
          Logout
        </Button>
      </div>
      <span>MDCC-UFC</span>
      <p className="text-sm text-gray-600">
        &copy; {new Date().getFullYear()} MDCC-UFC - Programa de Pós-Graduação em Ciência da
        Computação.
      </p>
    </footer>
  );
}
