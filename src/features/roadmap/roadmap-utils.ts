import type { Task } from '@/domain/types';

/** Valor de referência do card: pago (se concluída) ou previsto. */
export function finalTaskCost(task: Task): number {
  return task.status === 'concluido' ? (task.actualCost ?? task.estimatedCost) : task.estimatedCost;
}
