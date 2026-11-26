import { CircleCheck, KeyRound } from 'lucide-react';
import { GEMINI_MODEL, isGeminiConfigured } from '@/services/gemini';

export function GeminiStatus() {
  if (isGeminiConfigured) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border bg-card p-4">
        <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0" style={{ color: 'var(--status-good)' }} />
        <div className="space-y-1 text-sm">
          <p className="font-medium">Gemini conectado ({GEMINI_MODEL})</p>
          <p className="text-muted-foreground">
            A chave vai embutida no bundle do navegador: use o app só localmente. Para publicar, mova a chamada para um
            backend.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-2xl border bg-card p-4">
      <KeyRound aria-hidden className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
      <div className="space-y-2 text-sm">
        <p className="font-medium">Gemini não configurado</p>
        <p className="text-muted-foreground">
          O gerador de prompts e a varredura rápida funcionam sem chave. Para refinar prompts e analisar documentos com IA:
        </p>
        <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>
            Copie <code className="rounded bg-muted px-1 py-0.5 text-foreground">.env.example</code> para{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">.env.local</code>.
          </li>
          <li>
            Cole sua chave do Google AI Studio em{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-foreground">VITE_GEMINI_API_KEY</code>.
          </li>
          <li>Reinicie o servidor de desenvolvimento.</li>
        </ol>
      </div>
    </div>
  );
}
