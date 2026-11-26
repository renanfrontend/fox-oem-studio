import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { PageHeader } from '@/components/shared/page-header';
import type { MaintenanceItem } from '@/domain/types';
import { useAppStore } from '@/store/app-store';
import { useMaintenanceOverview } from '@/store/selectors';
import { ImotionGuide } from './imotion-guide';
import { MaintenanceItemDialog } from './maintenance-item-dialog';
import { MaintenanceList } from './maintenance-list';
import { OdometerCard } from './odometer-card';
import { RegisterServiceDialog } from './register-service-dialog';

export function TechnicalPage() {
  const odometer = useAppStore((state) => state.odometer);
  const removeMaintenanceItem = useAppStore((state) => state.removeMaintenanceItem);
  const overview = useMaintenanceOverview();

  const [registering, setRegistering] = useState<MaintenanceItem | null>(null);
  const [editing, setEditing] = useState<MaintenanceItem | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<MaintenanceItem | null>(null);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Oficina"
        description="Motor EA111 1.6 e câmbio I-Motion: quilometragem, trocas preventivas e o guia de condução."
      />

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-5">
          <OdometerCard readings={odometer} currentKm={overview.currentKm} kmPerDay={overview.kmPerDay} />
        </div>
        <div className="lg:col-span-7">
          <MaintenanceList
            entries={overview.entries}
            onRegister={setRegistering}
            onEdit={setEditing}
            onCreate={() => setEditing(null)}
          />
        </div>
      </div>

      <ImotionGuide />

      <RegisterServiceDialog
        item={registering}
        currentKm={overview.currentKm}
        onOpenChange={(open) => {
          if (!open) setRegistering(null);
        }}
      />
      <MaintenanceItemDialog
        item={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(undefined);
        }}
        onRequestDelete={setDeleting}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Excluir item preventivo?"
        description={`“${deleting?.label ?? ''}” e todo o histórico de trocas saem da oficina. As tarefas vinculadas continuam no roadmap.`}
        confirmLabel="Excluir"
        destructive
        onConfirm={() => {
          if (deleting) {
            removeMaintenanceItem(deleting.key);
            toast('Item excluído', { description: deleting.label });
          }
          setDeleting(null);
        }}
      />
    </div>
  );
}
