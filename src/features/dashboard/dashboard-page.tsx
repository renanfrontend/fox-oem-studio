import type { AppTab } from '@/app/navigation';
import { useAppStore } from '@/store/app-store';
import { useFinanceSummary, useMaintenanceOverview, useStageFinances } from '@/store/selectors';
import { BudgetHero } from './budget-gauge';
import { FinanceTiles } from './finance-tiles';
import { GarageCard } from './garage-card';
import { RecentPayments } from './recent-payments';
import { StageMeters } from './stage-meters';
import { UpcomingMaintenance } from './upcoming-maintenance';

export function DashboardPage({ onNavigate }: { onNavigate: (tab: AppTab) => void }) {
  const vehicle = useAppStore((state) => state.vehicle);
  const finance = useAppStore((state) => state.finance);
  const tasks = useAppStore((state) => state.tasks);
  const photos = useAppStore((state) => state.photos);
  const summary = useFinanceSummary();
  const stages = useStageFinances();
  const maintenance = useMaintenanceOverview();

  const doneCount = tasks.filter((task) => task.status === 'concluido').length;

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-5">
        <GarageCard
          vehicle={vehicle}
          photos={photos}
          tasks={tasks}
          currentKm={maintenance.currentKm}
          onOpenPhotos={() => onNavigate('comparador')}
        />
      </div>
      <div className="lg:col-span-7">
        <BudgetHero summary={summary} />
      </div>

      <div className="lg:col-span-12">
        <FinanceTiles
          summary={summary}
          finance={finance}
          acquisitionStatus={vehicle.acquisitionStatus}
          doneCount={doneCount}
          openCount={tasks.length - doneCount}
        />
      </div>

      <div className="lg:col-span-7">
        <StageMeters stages={stages} />
      </div>
      <div className="space-y-6 lg:col-span-5 lg:space-y-8">
        <UpcomingMaintenance entries={maintenance.entries} onOpenWorkshop={() => onNavigate('oficina')} />
        <RecentPayments tasks={tasks} />
      </div>
    </div>
  );
}
