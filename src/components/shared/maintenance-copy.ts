import type { MaintenanceEvaluation } from '@/domain/maintenance';
import { formatDate, formatInteger, formatKm } from '@/lib/format';

function plural(value: number, singular: string, pluralForm: string): string {
  return `${formatInteger(value)} ${value === 1 ? singular : pluralForm}`;
}

/** Frase curta com o prazo da próxima troca, em linguagem de oficina. */
export function describeDue(evaluation: MaintenanceEvaluation): string {
  if (evaluation.status === 'sem-historico') return 'Sem registro da última troca: faça na Etapa 0.';

  const parts: string[] = [];
  if (evaluation.kmRemaining !== null) {
    parts.push(
      evaluation.kmRemaining > 0
        ? `faltam ${formatKm(evaluation.kmRemaining)}`
        : `passou ${formatKm(Math.abs(evaluation.kmRemaining))}`,
    );
  }
  if (evaluation.daysRemaining !== null) {
    const days = evaluation.daysRemaining;
    if (days > 0) {
      parts.push(days > 60 ? `vence em ${formatDate(evaluation.dueDate)}` : `vence em ${plural(days, 'dia', 'dias')}`);
    } else {
      parts.push(`venceu em ${formatDate(evaluation.dueDate)}`);
    }
  }

  if (parts.length === 0) return 'Informe a quilometragem atual para calcular o prazo.';
  const sentence = parts.join(' ou ');
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
}
