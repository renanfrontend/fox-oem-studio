import { RotateCcw, TriangleExclamationPoint } from 'lucide-react';
import { SectionHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { IMOTION_GUIDE } from '@/domain/imotion-guide';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/app-store';

export function ImotionGuide() {
  const checks = useAppStore((state) => state.guideChecks);
  const toggleGuideCheck = useAppStore((state) => state.toggleGuideCheck);
  const resetGuideChecks = useAppStore((state) => state.resetGuideChecks);
  const reviewed = IMOTION_GUIDE.filter((item) => checks[item.id]).length;

  return (
    <section aria-labelledby="guide-heading" className="space-y-4">
      <SectionHeader
        id="guide-heading"
        title="Guia de bolso do I-Motion"
        description={`Câmbio automatizado sem posição P. ${reviewed} de ${IMOTION_GUIDE.length} situações revisadas.`}
        action={
          reviewed > 0 ? (
            <Button variant="ghost" size="sm" onClick={resetGuideChecks}>
              <RotateCcw />
              Zerar
            </Button>
          ) : undefined
        }
      />

      <ul className="grid gap-3 lg:grid-cols-2">
        {IMOTION_GUIDE.map((item) => {
          const checked = Boolean(checks[item.id]);
          const checkboxId = `guide-${item.id}`;
          return (
            <li
              key={item.id}
              className={cn('flex flex-col gap-3 rounded-2xl border bg-card p-4 transition-opacity', checked && 'opacity-70')}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold">{item.title}</h3>
                <label htmlFor={checkboxId} className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox id={checkboxId} checked={checked} onCheckedChange={() => toggleGuideCheck(item.id)} />
                  Revisado
                </label>
              </div>
              <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed marker:text-muted-foreground">
                {item.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="flex items-start gap-2 rounded-lg bg-muted/60 p-2.5 text-xs leading-relaxed">
                <TriangleExclamationPoint
                  aria-hidden
                  className="mt-0.5 size-3.5 shrink-0"
                  style={{ color: 'var(--status-warning)' }}
                />
                {item.avoid}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Baseado no manual de instruções VW do Fox com câmbio automatizado. A nomenclatura da alavanca pode variar por
        ano-modelo: confira o manual do seu carro.
      </p>
    </section>
  );
}
