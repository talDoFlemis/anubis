import { type JSX } from 'react';

export function Footer(): JSX.Element {
  return (
    <footer className="bg-background text-center py-4 mt-8">
      <span>MDCC-UFC</span>
      <p className="text-sm text-gray-600">
        &copy; {new Date().getFullYear()} MDCC-UFC - Programa de Pós-Graduação em Ciência da
        Computação.
      </p>
    </footer>
  );
}
