import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import { APP_TABS, type AppTab } from '@/app/navigation';
import { Button } from '@/components/ui/button';
import { formatCurrencyWhole } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useFinanceSummary } from '@/store/selectors';
import { Wordmark } from './brand';
import { TAB_ICONS } from './nav-icons';

interface SideNavProps {
  active: AppTab;
  onNavigate: (tab: AppTab) => void;
  onOpenSettings: () => void;
}

export function SideNav({ active, onNavigate, onOpenSettings }: SideNavProps) {
  const summary = useFinanceSummary();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r bg-background px-4 py-6 lg:flex">
      <Wordmark className="px-2" />

      <nav aria-label="Navegação principal" className="mt-10">
        <ul className="space-y-1">
          {APP_TABS.map((tab) => {
            const Icon = TAB_ICONS[tab.id];
            const isActive = active === tab.id;
            return (
              <li key={tab.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'relative flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-ring/50',
                    isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="side-nav-pill"
                      className="absolute inset-0 rounded-lg bg-secondary"
                      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    />
                  )}
                  <Icon aria-hidden className="relative size-[18px]" />
                  <span className="relative">{tab.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto space-y-4">
        <div className="space-y-1 rounded-xl border bg-card p-3">
          <p className="text-xs text-muted-foreground">Livre para upgrades</p>
          <p className="text-lg font-semibold">{formatCurrencyWhole(summary.upgradeRemaining)}</p>
        </div>
        <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={onOpenSettings}>
          <Settings />
          Ajustes e backup
        </Button>
      </div>
    </aside>
  );
}
