import { ImageUp, LoaderCircle, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { photoSlotKey } from '@/domain/photos';
import type { PhotoMeta, PhotoPhase, PhotoView } from '@/domain/types';
import { usePhotoUrl } from '@/hooks/use-photo-url';
import { formatBytes } from '@/lib/format';
import { cn } from '@/lib/utils';
import { CarIllustration } from './car-illustration';

interface PhotoSlotCardProps {
  view: PhotoView;
  phase: PhotoPhase;
  label: string;
  description: string;
  meta: PhotoMeta | undefined;
  busy: boolean;
  onUpload: (file: File) => void;
  onRemove: () => void;
}

export function PhotoSlotCard({ view, phase, label, description, meta, busy, onUpload, onRemove }: PhotoSlotCardProps) {
  const url = usePhotoUrl(meta ? photoSlotKey(view, phase) : null, meta?.updatedAt);
  const inputId = `upload-${view}-${phase}`;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <div className="studio-backdrop relative aspect-[4/3]">
        {url ? (
          <img src={url} alt={`${label}: foto da ${view}`} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-2 opacity-55">
            <CarIllustration view={view} variant={phase === 'antes' ? 'stock' : 'oem'} />
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 grid place-items-center bg-black/60">
            <LoaderCircle aria-hidden className="size-6 animate-spin text-foreground" />
            <span className="sr-only">Processando foto</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="text-sm font-semibold">{label}</h3>
            {meta && <span className="tabular text-xs text-muted-foreground">{formatBytes(meta.bytes)}</span>}
          </div>
          <p className="text-xs leading-snug text-muted-foreground">{description}</p>
        </div>

        <div className="mt-auto flex items-center gap-2">
          <label
            htmlFor={inputId}
            className={cn(
              'inline-flex h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-secondary px-3 text-sm font-medium transition-colors focus-within:ring-[3px] focus-within:ring-ring/50 hover:bg-accent',
              busy && 'pointer-events-none opacity-50',
            )}
          >
            <ImageUp aria-hidden className="size-4" />
            {meta ? 'Trocar' : 'Enviar foto'}
            <input
              id={inputId}
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) onUpload(file);
              }}
            />
          </label>
          {meta && (
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label={`Remover foto: ${label}`}
              disabled={busy}
              onClick={onRemove}
            >
              <Trash />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
