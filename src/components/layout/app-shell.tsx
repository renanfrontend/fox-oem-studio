import { lazy, Suspense, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { APP_TABS, useAppTab, type AppTab } from '@/app/navigation';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { AppHeader } from './app-header';
import { BottomNav } from './bottom-nav';
import { SideNav } from './side-nav';

// O painel carrega junto; as demais telas viram chunks sob demanda.
const RoadmapPage = lazy(() => import('@/features/roadmap/roadmap-page').then((m) => ({ default: m.RoadmapPage })));
const ComparatorPage = lazy(() =>
  import('@/features/comparator/comparator-page').then((m) => ({ default: m.ComparatorPage })),
);
const TechnicalPage = lazy(() =>
  import('@/features/technical/technical-page').then((m) => ({ default: m.TechnicalPage })),
);
const AiPage = lazy(() => import('@/features/ai/ai-page').then((m) => ({ default: m.AiPage })));
const SettingsSheet = lazy(() =>
  import('@/features/settings/settings-sheet').then((m) => ({ default: m.SettingsSheet })),
);

function PageFallback() {
  return (
    <div aria-busy="true" aria-label="Carregando" className="space-y-4">
      <div className="h-9 w-2/3 max-w-sm animate-pulse rounded-lg bg-muted" />
      <div className="h-4 w-full max-w-lg animate-pulse rounded bg-muted" />
      <div className="h-64 animate-pulse rounded-2xl bg-muted/70" />
    </div>
  );
}

function TabContent({ tab, onNavigate }: { tab: AppTab; onNavigate: (tab: AppTab) => void }) {
  switch (tab) {
    case 'painel':
      return <DashboardPage onNavigate={onNavigate} />;
    case 'roadmap':
      return <RoadmapPage />;
    case 'comparador':
      return <ComparatorPage />;
    case 'oficina':
      return <TechnicalPage />;
    case 'ia':
      return <AiPage onNavigate={onNavigate} />;
  }
}

export function AppShell() {
  const [tab, navigate] = useAppTab();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsMounted, setSettingsMounted] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const label = APP_TABS.find((item) => item.id === tab)?.label ?? 'Painel';
    document.title = `${label} | Fox OEM+ Studio`;
  }, [tab]);

  function openSettings() {
    setSettingsMounted(true);
    setSettingsOpen(true);
  }

  return (
    <div className="min-h-dvh">
      <button
        type="button"
        onClick={() => document.getElementById('conteudo')?.focus()}
        className="sr-only z-50 rounded-lg bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Pular para o conteúdo
      </button>

      <SideNav active={tab} onNavigate={navigate} onOpenSettings={openSettings} />

      <div className="lg:pl-64">
        <AppHeader onOpenSettings={openSettings} />
        <main
          id="conteudo"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl px-4 pt-5 pb-28 outline-none sm:px-6 lg:px-10 lg:pt-10 lg:pb-16"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Suspense fallback={<PageFallback />}>
                <TabContent tab={tab} onNavigate={navigate} />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <BottomNav active={tab} onNavigate={navigate} />
      {settingsMounted && (
        <Suspense fallback={null}>
          <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
        </Suspense>
      )}
    </div>
  );
}
