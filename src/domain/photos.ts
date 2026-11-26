import type { PhotoIndex, PhotoPhase, PhotoSlotKey, PhotoView } from './types';

export const PHOTO_VIEWS: readonly { id: PhotoView; label: string }[] = [
  { id: 'frente', label: 'Frente' },
  { id: 'traseira', label: 'Traseira' },
  { id: 'lateral', label: 'Lateral' },
  { id: 'interior', label: 'Interior' },
];

export const PHOTO_PHASES: readonly { id: PhotoPhase; label: string; description: string }[] = [
  { id: 'antes', label: 'Original', description: 'Como veio do vendedor.' },
  { id: 'etapa-0', label: 'Etapa 0', description: 'Depois da compra e da base mecânica.' },
  { id: 'etapa-1', label: 'Etapa 1', description: 'Resultado da estética de fábrica.' },
  { id: 'etapa-2', label: 'Etapa 2', description: 'Resultado de rodas, pneus e suspensão.' },
  { id: 'etapa-3', label: 'Etapa 3', description: 'Resultado do interior e tecnologia.' },
  { id: 'meta', label: 'Projeto OEM+', description: 'Referência ou render do objetivo final.' },
];

const VIEW_IDS = new Set<string>(PHOTO_VIEWS.map((view) => view.id));
const PHASE_IDS = new Set<string>(PHOTO_PHASES.map((phase) => phase.id));

export function photoSlotKey(view: PhotoView, phase: PhotoPhase): PhotoSlotKey {
  return `${view}:${phase}`;
}

export function isPhotoSlotKey(value: string): value is PhotoSlotKey {
  const [view, phase, extra] = value.split(':');
  return extra === undefined && view !== undefined && phase !== undefined && VIEW_IDS.has(view) && PHASE_IDS.has(phase);
}

export function getPhaseLabel(phase: PhotoPhase): string {
  return PHOTO_PHASES.find((item) => item.id === phase)?.label ?? phase;
}

export function getViewLabel(view: PhotoView): string {
  return PHOTO_VIEWS.find((item) => item.id === view)?.label ?? view;
}

/** Lado "depois" padrão: a etapa mais recente com foto; sem fotos, o projeto OEM+. */
export function defaultAfterPhase(view: PhotoView, photos: PhotoIndex): PhotoPhase {
  const ordered: PhotoPhase[] = ['etapa-3', 'etapa-2', 'etapa-1', 'etapa-0'];
  return ordered.find((phase) => photos[photoSlotKey(view, phase)]) ?? 'meta';
}
