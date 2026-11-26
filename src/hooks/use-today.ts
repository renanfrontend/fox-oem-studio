import { useSyncExternalStore } from 'react';
import { todayISO } from '@/lib/dates';

/**
 * "Hoje" como store externa: atualiza à meia-noite sem tornar os
 * componentes impuros (nada de `new Date()` durante o render).
 */
let current = todayISO();
const listeners = new Set<() => void>();
let timer: number | undefined;

function tick(): void {
  const next = todayISO();
  if (next !== current) {
    current = next;
    listeners.forEach((listener) => listener());
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  timer ??= window.setInterval(tick, 60_000);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
    }
  };
}

function getSnapshot(): string {
  return current;
}

export function useToday(): string {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
