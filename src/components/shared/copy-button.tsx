import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/download';

interface CopyButtonProps {
  text: string;
  label?: string;
  size?: 'sm' | 'default';
}

export function CopyButton({ text, label = 'Copiar', size = 'sm' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <Button
      type="button"
      variant="secondary"
      size={size}
      onClick={() => {
        void copyToClipboard(text).then((ok) => {
          if (!ok) {
            toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.');
            return;
          }
          setCopied(true);
          window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => setCopied(false), 1800);
        });
      }}
    >
      {copied ? <Check /> : <Copy />}
      {copied ? 'Copiado' : label}
    </Button>
  );
}
