import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { photoSlotKey } from '@/domain/photos';
import { getCurrentStage, getStage } from '@/domain/tasks';
import type { AcquisitionStatus, PhotoIndex, PhotoPhase, Task, VehicleProfile } from '@/domain/types';
import { usePhotoUrl } from '@/hooks/use-photo-url';
import { formatKm } from '@/lib/format';
import { CarIllustration } from '@/features/comparator/car-illustration';

const ACQUISITION_LABEL: Record<AcquisitionStatus, string> = {
  pesquisando: 'Pesquisando',
  negociando: 'Em negociação',
  comprado: 'Comprado',
};

const SIDE_PHASE_PRIORITY: PhotoPhase[] = ['etapa-3', 'etapa-2', 'etapa-1', 'etapa-0', 'antes'];

interface GarageCardProps {
  vehicle: VehicleProfile;
  photos: PhotoIndex;
  tasks: Task[];
  currentKm: number | null;
  onOpenPhotos: () => void;
}

export function GarageCard({ vehicle, photos, tasks, currentKm, onOpenPhotos }: GarageCardProps) {
  const latestPhase = SIDE_PHASE_PRIORITY.find((phase) => photos[photoSlotKey('lateral', phase)]);
  const latestKey = latestPhase ? photoSlotKey('lateral', latestPhase) : null;
  const photoUrl = usePhotoUrl(latestKey, latestKey ? photos[latestKey]?.updatedAt : undefined);

  const currentStage = getCurrentStage(tasks);

  return (
    <section aria-labelledby="garage-heading" className="h-full overflow-hidden rounded-2xl border bg-card">
      <div className="studio-backdrop relative aspect-[16/9]">
        {photoUrl ? (
          <img src={photoUrl} alt={`${vehicle.model} visto de lado`} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-end justify-center px-6 pt-2">
            <CarIllustration view="lateral" variant="stock" className="h-[115%]" />
          </div>
        )}
        {!photoUrl && (
          <Button size="sm" variant="secondary" className="absolute right-3 bottom-3" onClick={onOpenPhotos}>
            <Camera />
            Enviar fotos
          </Button>
        )}
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-1">
          <h1 id="garage-heading" className="type-expanded text-2xl leading-tight font-semibold sm:text-3xl">
            {vehicle.model}
          </h1>
          <p className="text-sm text-muted-foreground">
            {vehicle.modelYear}, {vehicle.color.toLowerCase()}. {vehicle.engine}, câmbio {vehicle.transmission}.
          </p>
        </div>

        <dl className="grid grid-cols-3 gap-3 border-t pt-4 text-sm">
          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Aquisição</dt>
            <dd className="font-medium">{ACQUISITION_LABEL[vehicle.acquisitionStatus]}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Hodômetro</dt>
            <dd className="tabular font-medium">{currentKm === null ? 'Sem leitura' : formatKm(currentKm)}</dd>
          </div>
          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Etapa atual</dt>
            <dd className="font-medium">{currentStage === null ? 'Concluído' : getStage(currentStage).label}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
