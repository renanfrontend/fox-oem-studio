import { useState } from 'react';
import { Download, LoaderCircle, RotateCcw, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { downloadBlob } from '@/lib/download';
import { formatBytes, formatDateTime, pluralize } from '@/lib/format';
import { sumBy } from '@/lib/utils';
import {
  BackupError,
  backupFileName,
  buildBackup,
  countBackupPhotos,
  readBackupFile,
  restoreBackup,
  serializeBackup,
  type BackupPayload,
} from '@/services/backup';
import { photoStorage } from '@/services/photo-storage';
import { pickAppData, useAppStore } from '@/store/app-store';

/** Base64 ocupa ~4/3 do binário. */
const BASE64_OVERHEAD = 4 / 3;

export function BackupPanel() {
  const photos = useAppStore((state) => state.photos);
  const replaceData = useAppStore((state) => state.replaceData);
  const resetData = useAppStore((state) => state.resetData);

  const [includePhotos, setIncludePhotos] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [pending, setPending] = useState<BackupPayload | null>(null);
  const [importing, setImporting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const photoList = Object.values(photos).filter((meta) => meta !== undefined);
  const estimatedPhotoBytes = sumBy(photoList, (meta) => meta.bytes) * BASE64_OVERHEAD;

  async function handleExport() {
    setExporting(true);
    try {
      const payload = await buildBackup(pickAppData(useAppStore.getState()), includePhotos);
      const blob = serializeBackup(payload);
      downloadBlob(blob, backupFileName());
      toast.success('Backup exportado', {
        description: `${formatBytes(blob.size)}${includePhotos ? `, ${pluralize(countBackupPhotos(payload), 'foto', 'fotos')}` : ', sem fotos'}.`,
      });
    } catch (error) {
      console.error(error);
      toast.error('Não foi possível gerar o backup.');
    } finally {
      setExporting(false);
    }
  }

  async function handleFile(file: File) {
    try {
      setPending(await readBackupFile(file));
    } catch (error) {
      toast.error(error instanceof BackupError ? error.message : 'Não foi possível ler o arquivo.');
    }
  }

  async function confirmImport() {
    if (!pending) return;
    setImporting(true);
    try {
      const data = await restoreBackup(pending, useAppStore.getState().photos);
      replaceData(data);
      toast.success('Backup restaurado', { description: `Exportado em ${formatDateTime(pending.exportedAt)}.` });
      setPending(null);
    } catch (error) {
      console.error(error);
      toast.error('Falha ao restaurar o backup. Seus dados atuais foram mantidos.');
    } finally {
      setImporting(false);
    }
  }

  async function handleReset() {
    await photoStorage.clearAll();
    resetData();
    toast('Dados iniciais restaurados', { description: 'Roadmap, finanças e oficina voltaram ao padrão do projeto.' });
  }

  const pendingPhotoCount = pending ? countBackupPhotos(pending) : 0;

  return (
    <div className="grid gap-6">
      <section className="grid gap-4" aria-labelledby="export-heading">
        <div className="space-y-1">
          <h3 id="export-heading" className="text-sm font-semibold">
            Exportar backup
          </h3>
          <p className="text-sm text-muted-foreground">
            Um arquivo JSON com roadmap, finanças, oficina e, se quiser, as fotos em Base64.
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl border p-3">
          <Label htmlFor="backup-photos" className="flex-col items-start gap-1">
            Incluir fotos
            <span className="text-xs font-normal text-muted-foreground">
              {photoList.length === 0
                ? 'Nenhuma foto salva ainda.'
                : `${pluralize(photoList.length, 'foto', 'fotos')}, cerca de ${formatBytes(estimatedPhotoBytes)} a mais.`}
            </span>
          </Label>
          <Switch id="backup-photos" checked={includePhotos} onCheckedChange={setIncludePhotos} />
        </div>
        <Button onClick={() => void handleExport()} disabled={exporting} className="justify-self-start">
          {exporting ? <LoaderCircle className="animate-spin" /> : <Download />}
          Exportar backup (.json)
        </Button>
      </section>

      <Separator />

      <section className="grid gap-4" aria-labelledby="import-heading">
        <div className="space-y-1">
          <h3 id="import-heading" className="text-sm font-semibold">
            Importar backup
          </h3>
          <p className="text-sm text-muted-foreground">Substitui os dados deste aparelho pelos do arquivo.</p>
        </div>
        <label
          htmlFor="backup-file"
          className="inline-flex h-10 w-fit cursor-pointer items-center gap-2 rounded-lg border border-input px-4 text-sm font-medium transition-colors focus-within:ring-[3px] focus-within:ring-ring/50 hover:bg-accent"
        >
          <Upload aria-hidden className="size-4" />
          Escolher arquivo .json
          <input
            id="backup-file"
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (file) void handleFile(file);
            }}
          />
        </label>
      </section>

      <Separator />

      <section className="grid gap-3" aria-labelledby="reset-heading">
        <div className="space-y-1">
          <h3 id="reset-heading" className="text-sm font-semibold">
            Recomeçar
          </h3>
          <p className="text-sm text-muted-foreground">
            Volta para os dados iniciais do Fox 2011/2012 e apaga as fotos deste aparelho.
          </p>
        </div>
        <Button variant="outline" className="justify-self-start" onClick={() => setConfirmReset(true)}>
          <RotateCcw />
          Restaurar dados iniciais
        </Button>
      </section>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Os dados ficam no navegador (localStorage) e as fotos no IndexedDB deste aparelho. Nada é enviado a servidores, exceto
        o que você mandar ao Gemini.
      </p>

      <ConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open && !importing) setPending(null);
        }}
        title="Substituir dados pelo backup?"
        description={
          pending ? (
            <div className="space-y-2">
              <p>Exportado em {formatDateTime(pending.exportedAt)}.</p>
              <p>
                {pluralize(pending.data.tasks.length, 'tarefa', 'tarefas')},{' '}
                {pluralize(pending.data.maintenance.length, 'item preventivo', 'itens preventivos')} e{' '}
                {pendingPhotoCount > 0
                  ? pluralize(pendingPhotoCount, 'foto', 'fotos')
                  : 'nenhuma foto (as fotos atuais serão mantidas)'}
                .
              </p>
              <p>Os dados atuais deste aparelho serão substituídos.</p>
            </div>
          ) : null
        }
        confirmLabel={importing ? 'Restaurando' : 'Substituir dados'}
        onConfirm={() => void confirmImport()}
      />

      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Restaurar dados iniciais?"
        description="Tarefas, pagamentos, quilometragem, histórico de trocas e fotos deste aparelho serão apagados. Exporte um backup antes se quiser guardar."
        confirmLabel="Apagar e restaurar"
        destructive
        onConfirm={() => void handleReset()}
      />
    </div>
  );
}
