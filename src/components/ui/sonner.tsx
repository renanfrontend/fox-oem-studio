import type * as React from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

/** Toaster do shadcn sem next-themes: o app é sempre dark. */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="top-center"
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      toastOptions={{ classNames: { toast: 'font-sans', description: '!text-muted-foreground' } }}
      {...props}
    />
  );
}

export { Toaster };
