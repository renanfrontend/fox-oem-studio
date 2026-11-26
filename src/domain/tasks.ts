import type { StageId, Task, TaskCategory, TaskStatus } from './types';

export interface StageMeta {
  id: StageId;
  label: string;
  title: string;
  description: string;
}

export const STAGES: readonly StageMeta[] = [
  {
    id: 0,
    label: 'Etapa 0',
    title: 'Aquisição e base mecânica',
    description: 'Comprar certo e zerar a manutenção que veio sem histórico.',
  },
  {
    id: 1,
    label: 'Etapa 1',
    title: 'Estética de fábrica',
    description: 'Pintura prata, faróis, vidros e acabamentos como saíram da fábrica.',
  },
  {
    id: 2,
    label: 'Etapa 2',
    title: 'Rodas, pneus e suspensão',
    description: 'Postura OEM+: rodas originais, pneus certos e suspensão renovada.',
  },
  {
    id: 3,
    label: 'Etapa 3',
    title: 'Interior e tecnologia',
    description: 'Peças de versões topo de linha e conforto no dia a dia.',
  },
];

export const STAGE_IDS: readonly StageId[] = [0, 1, 2, 3];

export function getStage(id: StageId): StageMeta {
  const stage = STAGES.find((item) => item.id === id);
  if (!stage) throw new Error(`Etapa desconhecida: ${String(id)}`);
  return stage;
}

export function isStageId(value: number): value is StageId {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

export interface TaskStatusMeta {
  id: TaskStatus;
  label: string;
  description: string;
}

export const TASK_STATUSES: readonly TaskStatusMeta[] = [
  { id: 'pendente', label: 'Pendente', description: 'Ainda não começou.' },
  { id: 'cotando', label: 'Cotando', description: 'Levantando preços e fornecedores.' },
  { id: 'agendado', label: 'Agendado', description: 'Data marcada com a oficina ou loja.' },
  { id: 'concluido', label: 'Concluído', description: 'Pago e executado: abate da verba.' },
];

export function getTaskStatus(id: TaskStatus): TaskStatusMeta {
  const status = TASK_STATUSES.find((item) => item.id === id);
  if (!status) throw new Error(`Status desconhecido: ${id}`);
  return status;
}

/** Próximo status no fluxo (o último permanece). */
export function nextTaskStatus(status: TaskStatus): TaskStatus {
  const index = TASK_STATUSES.findIndex((item) => item.id === status);
  const next = TASK_STATUSES[Math.min(index + 1, TASK_STATUSES.length - 1)];
  return next ? next.id : status;
}

export const TASK_CATEGORIES: readonly { id: TaskCategory; label: string }[] = [
  { id: 'documentacao', label: 'Documentação' },
  { id: 'mecanica', label: 'Mecânica' },
  { id: 'estetica', label: 'Estética' },
  { id: 'rodas-suspensao', label: 'Rodas e suspensão' },
  { id: 'interior', label: 'Interior' },
  { id: 'eletrica', label: 'Elétrica' },
];

export function getCategoryLabel(id: TaskCategory): string {
  return TASK_CATEGORIES.find((item) => item.id === id)?.label ?? id;
}

/** Etapa atual: a primeira com tarefa em aberto (null quando tudo foi concluído). */
export function getCurrentStage(tasks: readonly Task[]): StageId | null {
  return STAGE_IDS.find((stage) => tasks.some((task) => task.stage === stage && task.status !== 'concluido')) ?? null;
}

/** Ordena por etapa, depois pela ordem de criação. */
export function sortTasks(tasks: readonly Task[]): Task[] {
  return [...tasks].sort((a, b) => a.stage - b.stage || a.createdAt.localeCompare(b.createdAt));
}
