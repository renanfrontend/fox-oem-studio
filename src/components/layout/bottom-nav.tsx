import { motion } from 'framer-motion';
import { APP_TABS, type AppTab } from '@/app/navigation';
import { cn } from '@/lib/utils';
import { TAB_ICONS } from './nav-icons';

interface BottomNavProps {
  active: AppTab;
  onNavigate: (tab: AppTab) => void;
}

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <nav
      aria-label="Navegação principal"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-background/90 backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-5">
        {APP_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.id];
          const isActive = active === tab.id;
          return (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => onNavigate(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className="relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[11px] font-medium outline-none focus-visible:bg-accent/60"
              >
                {isActive && (
                  <motion.span
                    layoutId="bottom-nav-pill"
                    className="absolute top-2 h-8 w-14 rounded-full bg-secondary"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
                <Icon
                  aria-hidden
                  className={cn('relative size-5', isActive ? 'text-foreground' : 'text-muted-foreground')}
                />
                <span className={cn('relative', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                  {tab.shortLabel}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
