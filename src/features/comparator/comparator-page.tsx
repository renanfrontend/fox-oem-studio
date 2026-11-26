import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HardDrive } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, SectionHeader } from '@/components/shared/page-header';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  PHOTO_PHASES,
  PHOTO_VIEWS,
  defaultAfterPhase,
  getPhaseLabel,
  getViewLabel,
  photoSlotKey,
} from '@/domain/photos';
import type { PhotoPhase, PhotoSlotKey, PhotoView } from '@/domain/types';
import { usePhotoUrl } from '@/hooks/use-photo-url';
import { ImageProcessingError, processImageFile } from '@/services/image-processing';
import { photoStorage } from '@/services/photo-storage';
import { useAppStore } from '@/store/app-store';
import { BeforeAfterSlider } from './before-after-slider';
import { CarIllustration } from './car-illustration';
import { PhotoSlotCard } from './photo-slot-card';

function isPhase(value: string): value is PhotoPhase {
  return PHOTO_PHASES.some((phase) => phase.id === value);
}

function isView(value: string): value is PhotoView {
  return PHOTO_VIEWS.some((view) => view.id === value);
}

export function ComparatorPage() {
  const photos = useAppStore((state) => state.photos);
  const setPhotoMeta = useAppStore((state) => state.setPhotoMeta);
  const removePhotoMeta = useAppStore((state) => state.removePhotoMeta);

  const [view, setView] = useState<PhotoView>('lateral');
  const [leftPhase, setLeftPhase] = useState<PhotoPhase>('antes');
  const [rightChoice, setRightChoice] = useState<PhotoPhase | null>(null);
  const [busyKey, setBusyKey] = useState<PhotoSlotKey | null>(null);
  const [persistent, setPersistent] = useState(true);

  const rightPhase = rightChoice ?? defaultAfterPhase(view, photos);
  const leftKey = photoSlotKey(view, leftPhase);
  const rightKey = photoSlotKey(view, rightPhase);
  const leftUrl = usePhotoUrl(photos[leftKey] ? leftKey : null, photos[leftKey]?.updatedAt);
  const rightUrl = usePhotoUrl(photos[rightKey] ? rightKey : null, photos[rightKey]?.updatedAt);
  const usesIllustration = !leftUrl || !rightUrl;

  useEffect(() => {
    let active = true;
    void photoStorage.isPersistent().then((value) => {
      if (active) setPersistent(value);
    });
    return () => {
      active = false;
    };
  }, []);

  async function handleUpload(phase: PhotoPhase, file: File) {
    const key = photoSlotKey(view, phase);
    setBusyKey(key);
    try {
      const processed = await processImageFile(file);
      await photoStorage.save(key, processed.blob);
      setPhotoMeta({
        key,
        width: processed.width,
        height: processed.height,
        bytes: processed.blob.size,
        mimeType: processed.mimeType,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Foto salva', { description: `${getPhaseLabel(phase)}, ${getViewLabel(view).toLowerCase()}.` });
    } catch (error) {
      const message =
        error instanceof ImageProcessingError ? error.message : 'Não foi possível salvar a foto. Tente outra imagem.';
      toast.error(message);
    } finally {
      setBusyKey(null);
    }
  }

  async function handleRemove(phase: PhotoPhase) {
    const key = photoSlotKey(view, phase);
    const meta = photos[key];
    if (!meta) return;
    const blob = await photoStorage.load(key);
    await photoStorage.remove(key);
    removePhotoMeta(key);
    toast('Foto removida', {
      description: `${getPhaseLabel(phase)}, ${getViewLabel(view).toLowerCase()}.`,
      action: blob
        ? {
            label: 'Desfazer',
            onClick: () => {
              void photoStorage.save(key, blob).then(() => setPhotoMeta({ ...meta, updatedAt: new Date().toISOString() }));
            },
          }
        : undefined,
    });
  }

  const phaseOptions = PHOTO_PHASES.map((phase) => (
    <SelectItem key={phase.id} value={phase.id}>
      {phase.label}
      {photos[photoSlotKey(view, phase.id)] ? '' : ' (sem foto)'}
    </SelectItem>
  ));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Antes e depois"
        description="Arraste a divisória para comparar o carro original com cada etapa do projeto OEM+."
      />

      <section aria-label="Comparador" className="space-y-4">
        <ToggleGroup
          type="single"
          variant="outline"
          value={view}
          onValueChange={(value) => {
            if (isView(value)) setView(value);
          }}
          className="grid w-full grid-cols-4 sm:w-fit"
          aria-label="Visão do carro"
        >
          {PHOTO_VIEWS.map((item) => (
            <ToggleGroupItem key={item.id} value={item.id} className="px-2 sm:px-4">
              {item.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        <div className="grid grid-cols-2 gap-3 sm:max-w-md">
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor="left-phase">Antes</Label>
            <Select
              value={leftPhase}
              onValueChange={(value) => {
                if (isPhase(value)) setLeftPhase(value);
              }}
            >
              <SelectTrigger id="left-phase">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>{phaseOptions}</SelectContent>
            </Select>
          </div>
          <div className="grid min-w-0 gap-1.5">
            <Label htmlFor="right-phase">Depois</Label>
            <Select
              value={rightPhase}
              onValueChange={(value) => {
                if (isPhase(value)) setRightChoice(value);
              }}
            >
              <SelectTrigger id="right-phase">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>{phaseOptions}</SelectContent>
            </Select>
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="lg:max-w-4xl"
          >
            <BeforeAfterSlider
              ariaLabel={`Comparação da ${getViewLabel(view).toLowerCase()}: ${getPhaseLabel(leftPhase)} contra ${getPhaseLabel(rightPhase)}`}
              before={{
                side: 'Antes',
                caption: getPhaseLabel(leftPhase),
                src: leftUrl,
                alt: `${getPhaseLabel(leftPhase)}, ${getViewLabel(view).toLowerCase()}`,
                fallback: <CarIllustration view={view} variant={leftPhase === 'antes' ? 'stock' : 'oem'} />,
              }}
              after={{
                side: 'Depois',
                caption: getPhaseLabel(rightPhase),
                src: rightUrl,
                alt: `${getPhaseLabel(rightPhase)}, ${getViewLabel(view).toLowerCase()}`,
                fallback: <CarIllustration view={view} variant={rightPhase === 'antes' ? 'stock' : 'oem'} />,
              }}
            />
          </motion.div>
        </AnimatePresence>

        {usesIllustration && (
          <p className="text-sm text-muted-foreground">
            Onde ainda não há foto, entra uma ilustração de referência. Envie as fotos do vendedor e de cada etapa logo
            abaixo.
          </p>
        )}
      </section>

      <section aria-labelledby="photos-heading" className="space-y-4">
        <SectionHeader
          id="photos-heading"
          title={`Fotos: ${getViewLabel(view).toLowerCase()}`}
          description="As imagens são reduzidas para até 1920 px antes de salvar, sem perder a qualidade de tela."
        />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {PHOTO_PHASES.map((phase) => (
            <PhotoSlotCard
              key={phase.id}
              view={view}
              phase={phase.id}
              label={phase.label}
              description={phase.description}
              meta={photos[photoSlotKey(view, phase.id)]}
              busy={busyKey === photoSlotKey(view, phase.id)}
              onUpload={(file) => void handleUpload(phase.id, file)}
              onRemove={() => void handleRemove(phase.id)}
            />
          ))}
        </div>
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <HardDrive aria-hidden className="mt-0.5 size-4 shrink-0" />
          {persistent
            ? 'As fotos ficam salvas neste aparelho. Para levar para outro dispositivo, exporte o backup com fotos em Ajustes.'
            : 'Este navegador não permite salvar fotos de forma permanente (modo privado?). Elas ficam só nesta sessão.'}
        </p>
      </section>
    </div>
  );
}
