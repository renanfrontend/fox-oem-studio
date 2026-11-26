import { SectionHeader } from '@/components/shared/page-header';
import { getStage } from '@/domain/tasks';
import type { Task } from '@/domain/types';
import { formatCurrency, formatDate } from '@/lib/format';

export function RecentPayments({ tasks }: { tasks: Task[] }) {
  const payments = tasks
    .filter((task) => task.status === 'concluido')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
    .slice(0, 5);

  return (
    <section aria-labelledby="payments-heading" className="space-y-4">
      <SectionHeader id="payments-heading" title="Últimos pagamentos" />
      {payments.length === 0 ? (
        <p className="rounded-2xl border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
          Nenhum pagamento lançado. Quando você concluir uma tarefa no roadmap, o valor pago aparece aqui e sai da verba.
        </p>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {payments.map((task) => (
            <li key={task.id} className="flex items-start justify-between gap-4 p-4">
              <div className="min-w-0 space-y-0.5">
                <p className="text-sm font-medium">{task.title}</p>
                <p className="text-xs text-muted-foreground">
                  {getStage(task.stage).label}, {formatDate(task.date)}
                  {task.supplier ? `, ${task.supplier}` : ''}
                </p>
              </div>
              <p className="tabular shrink-0 text-sm font-medium">{formatCurrency(task.actualCost ?? task.estimatedCost)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
