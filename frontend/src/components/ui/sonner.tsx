'use client';

import { CircleCheck, Info, LoaderCircle, OctagonX, TriangleAlert } from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      icons={{
        success: <CircleCheck className="h-4 w-4" />,
        info: <Info className="h-4 w-4" />,
        warning: <TriangleAlert className="h-4 w-4" />,
        error: <OctagonX className="h-4 w-4" />,
        loading: <LoaderCircle className="h-4 w-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            'group toast anubis-glass anubis-ghost-border group-[.toaster]:text-foreground group-[.toaster]:shadow-[0_28px_60px_-36px_rgba(27,28,29,0.26)]',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:anubis-gradient-action group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
