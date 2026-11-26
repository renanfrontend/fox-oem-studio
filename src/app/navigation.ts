import { useCallback, useSyncExternalStore } from 'react';

export type AppTab = 'painel' | 'roadmap' | 'comparador' | 'oficina' | 'ia';

export const APP_TABS: readonly { id: AppTab; label: string; shortLabel: string }[] = [
  { id: 'painel', label: 'Painel', shortLabel: 'Painel' },
  { id: 'roadmap', label: 'Roadmap', shortLabel: 'Roadmap' },
  { id: 'comparador', label: 'Antes e depois', shortLabel: 'Fotos' },
  { id: 'oficina', label: 'Oficina', shortLabel: 'Oficina' },
  { id: 'ia', label: 'IA', shortLabel: 'IA' },
];

const DEFAULT_TAB: AppTab = 'painel';
const TAB_IDS = new Set<string>(APP_TABS.map((tab) => tab.id));

function readTab(): AppTab {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return TAB_IDS.has(hash) ? (hash as AppTab) : DEFAULT_TAB;
}

function subscribe(listener: () => void): () => void {
  window.addEventListener('hashchange', listener);
  return () => window.removeEventListener('hashchange', listener);
}

/** Navegação por hash simples (#roadmap): sem router, com botão voltar e link direto para cada tela. */
export function useAppTab(): [AppTab, (tab: AppTab) => void] {
  const tab = useSyncExternalStore(subscribe, readTab, () => DEFAULT_TAB);
  const navigate = useCallback((next: AppTab) => {
    if (readTab() === next) return;
    window.location.hash = next;
    window.scrollTo({ top: 0 });
  }, []);
  return [tab, navigate];
}
