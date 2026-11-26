import { useState } from 'react';
import {
  FileText,
  Info,
  LoaderCircle,
  OctagonExclamationPoint,
  Paperclip,
  Plus,
  ScanText,
  Sparkles,
  TriangleExclamationPoint,
  X,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import type { AppTab } from '@/app/navigation';
import { CopyButton } from '@/components/shared/copy-button';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { getStage, isStageId } from '@/domain/tasks';
import type { StageId, TaskCategory } from '@/domain/types';
import { formatBytes, formatCurrency } from '@/lib/format';
import { blobToBase64 } from '@/services/image-processing';
import {
  GeminiError,
  analyzeReport,
  isGeminiConfigured,
  type ReportAnalysis,
  type ReportMode,
} from '@/services/gemini';
import { scanReport, type ScanResult, type ScanSeverity } from '@/services/report-scanner';
import { useAppStore } from '@/store/app-store';

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

const SEVERITY_VISUAL: Record<ScanSeverity, { icon: LucideIcon; label: string; color: string }> = {
  critico: { icon: OctagonExclamationPoint, label: 'Crítico', color: 'var(--status-critical)' },
  atencao: { icon: TriangleExclamationPoint, label: 'Atenção', color: 'var(--status-warning)' },
  info: { icon: Info, label: 'Informação', color: 'var(--muted-foreground)' },
};

const RISK_LABEL: Record<ReportAnalysis['risco'], { label: string; severity: ScanSeverity }> = {
  baixo: { label: 'Risco baixo', severity: 'info' },
  medio: { label: 'Risco médio', severity: 'atencao' },
  alto: { label: 'Risco alto', severity: 'critico' },
};

const STAGE_CATEGORY: Record<StageId, TaskCategory> = {
  0: 'mecanica',
  1: 'estetica',
  2: 'rodas-suspensao',
  3: 'interior',
};

const PLACEHOLDER: Record<ReportMode, string> = {
  laudo: 'Cole aqui o texto do laudo cautelar, ou anexe a foto ou o PDF do documento.',
  orcamento: 'Cole o orçamento com um item por linha, por exemplo:\nKit correia dentada + tensor - R$ 389,90',
};

function SeverityBadge({ severity }: { severity: ScanSeverity }) {
  const visual = SEVERITY_VISUAL[severity];
  const Icon = visual.icon;
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border bg-background/40 px-2 py-0.5 text-xs font-medium">
      <Icon aria-hidden className="size-3.5" style={{ color: visual.color }} />
      {visual.label}
    </span>
  );
}

interface FindingCardProps {
  title: string;
  severity: ScanSeverity;
  explanation: string;
  action: string;
  extra?: string;
  stage: StageId;
  cost: number;
  onAdd: () => void;
}

function FindingCard({ title, severity, explanation, action, extra, stage, cost, onAdd }: FindingCardProps) {
  return (
    <li className="space-y-2.5 rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold">{title}</h4>
        <SeverityBadge severity={severity} />
      </div>
      <p className="text-sm leading-relaxed">{explanation}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">Próximo passo: {action}</p>
      {extra && <p className="rounded-lg bg-muted/60 p-2.5 text-xs leading-relaxed text-muted-foreground">{extra}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <p className="text-xs text-muted-foreground">
          {getStage(stage).label}
          {cost > 0 ? `, estimativa de ${formatCurrency(cost)}` : ''}
        </p>
        <Button size="sm" variant="secondary" onClick={onAdd}>
          <Plus />
          Adicionar ao roadmap
        </Button>
      </div>
    </li>
  );
}

export function ReportAnalyzer({ onNavigate }: { onNavigate: (tab: AppTab) => void }) {
  const addTask = useAppStore((state) => state.addTask);
  const [mode, setMode] = useState<ReportMode>('laudo');
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [analysis, setAnalysis] = useState<ReportAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  function addToRoadmap(input: { title: string; stage: StageId; cost: number; notes: string }) {
    addTask({
      title: input.title,
      stage: input.stage,
      category: STAGE_CATEGORY[input.stage],
      status: 'pendente',
      estimatedCost: Math.max(0, Math.round(input.cost * 100) / 100),
      actualCost: null,
      supplier: '',
      date: null,
      notes: input.notes,
      oemReference: '',
      maintenanceKeys: [],
    });
    toast.success('Adicionada ao roadmap', {
      description: `${input.title} (${getStage(input.stage).label})`,
      action: { label: 'Ver', onClick: () => onNavigate('roadmap') },
    });
  }

  function handleScan() {
    if (!text.trim()) {
      toast.error('Cole o texto do documento para a varredura rápida.');
      return;
    }
    setScan(scanReport(text, mode));
  }

  async function handleAnalyze() {
    if (!text.trim() && !attachment) {
      toast.error('Cole o texto ou anexe o documento para analisar.');
      return;
    }
    setLoading(true);
    try {
      const attachmentPayload = attachment
        ? { mimeType: attachment.type || 'application/octet-stream', base64: await blobToBase64(attachment) }
        : null;
      setAnalysis(await analyzeReport({ mode, text, attachment: attachmentPayload }));
    } catch (error) {
      toast.error(error instanceof GeminiError ? error.message : 'Não foi possível analisar o documento.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5">
        <ToggleGroup
          type="single"
          variant="outline"
          value={mode}
          onValueChange={(value) => {
            if (value === 'laudo' || value === 'orcamento') {
              setMode(value);
              setScan(null);
              setAnalysis(null);
            }
          }}
          className="grid w-full grid-cols-2 sm:w-fit"
          aria-label="Tipo de documento"
        >
          <ToggleGroupItem value="laudo">Laudo cautelar</ToggleGroupItem>
          <ToggleGroupItem value="orcamento">Orçamento de peças</ToggleGroupItem>
        </ToggleGroup>

        <div className="grid gap-2">
          <Label htmlFor="report-text">Conteúdo do documento</Label>
          <Textarea
            id="report-text"
            rows={8}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={PLACEHOLDER[mode]}
            className="min-h-40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {attachment ? (
            <span className="inline-flex max-w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm">
              <FileText aria-hidden className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{attachment.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(attachment.size)}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remover anexo"
                onClick={() => setAttachment(null)}
              >
                <X />
              </Button>
            </span>
          ) : (
            <label
              htmlFor="report-file"
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-input px-3 text-sm font-medium transition-colors focus-within:ring-[3px] focus-within:ring-ring/50 hover:bg-accent"
            >
              <Paperclip aria-hidden className="size-4" />
              Anexar foto ou PDF
              <input
                id="report-file"
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (!file) return;
                  if (file.size > MAX_ATTACHMENT_BYTES) {
                    toast.error('Anexo acima de 15 MB. Envie uma versão menor.');
                    return;
                  }
                  setAttachment(file);
                }}
              />
            </label>
          )}
          <p className="text-xs text-muted-foreground">O anexo só é lido pelo Gemini.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" onClick={handleScan}>
            <ScanText />
            Varredura rápida (offline)
          </Button>
          <Button onClick={() => void handleAnalyze()} disabled={!isGeminiConfigured || loading}>
            {loading ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
            {loading ? 'Analisando' : 'Analisar com Gemini'}
          </Button>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Triagem de apoio: confirme sempre com o documento original e com um mecânico de confiança.
        </p>
      </div>

      {analysis && (
        <section aria-labelledby="ai-result-heading" className="space-y-4">
          <div className="space-y-3 rounded-2xl border bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 id="ai-result-heading" className="type-semi-expanded text-base font-semibold">
                Análise do Gemini
              </h3>
              <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
                {(() => {
                  const risk = RISK_LABEL[analysis.risco];
                  const Icon = SEVERITY_VISUAL[risk.severity].icon;
                  return (
                    <>
                      <Icon aria-hidden className="size-3.5" style={{ color: SEVERITY_VISUAL[risk.severity].color }} />
                      {risk.label}
                    </>
                  );
                })()}
              </span>
            </div>
            <p className="text-sm leading-relaxed">{analysis.resumo}</p>
          </div>

          <ul className="space-y-3">
            {analysis.itens.map((item, index) => {
              const stage: StageId = isStageId(item.etapaSugerida) ? item.etapaSugerida : 0;
              return (
                <FindingCard
                  key={`${item.titulo}-${index}`}
                  title={item.titulo}
                  severity={item.severidade}
                  explanation={item.explicacao}
                  action={item.acao}
                  stage={stage}
                  cost={item.custoEstimado}
                  onAdd={() =>
                    addToRoadmap({
                      title: item.titulo,
                      stage,
                      cost: item.custoEstimado,
                      notes: `${item.explicacao}\nPróximo passo: ${item.acao}`,
                    })
                  }
                />
              );
            })}
          </ul>

          {analysis.perguntas.length > 0 && (
            <div className="space-y-3 rounded-2xl border bg-card p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-semibold">Perguntas para o vendedor ou a oficina</h4>
                <CopyButton text={analysis.perguntas.map((question) => `- ${question}`).join('\n')} label="Copiar todas" />
              </div>
              <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
                {analysis.perguntas.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {scan && (
        <section aria-labelledby="scan-heading" className="space-y-4">
          <h3 id="scan-heading" className="type-semi-expanded text-base font-semibold">
            Varredura rápida
          </h3>
          {scan.findings.length === 0 ? (
            <p className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
              Nenhum termo de risco encontrado no texto. Isso não substitui a leitura completa do documento.
            </p>
          ) : (
            <ul className="space-y-3">
              {scan.findings.map((finding) => (
                <FindingCard
                  key={finding.id}
                  title={finding.titulo}
                  severity={finding.severidade}
                  explanation={finding.explicacao}
                  action={finding.acao}
                  extra={`Trecho: ${finding.trecho}`}
                  stage={finding.etapaSugerida}
                  cost={0}
                  onAdd={() =>
                    addToRoadmap({
                      title: finding.titulo,
                      stage: finding.etapaSugerida,
                      cost: 0,
                      notes: `${finding.explicacao}\nPróximo passo: ${finding.acao}\n${finding.trecho}`,
                    })
                  }
                />
              ))}
            </ul>
          )}

          {mode === 'orcamento' && scan.prices.length > 0 && (
            <div className="overflow-hidden rounded-2xl border bg-card">
              <table className="w-full text-sm">
                <caption className="px-4 pt-4 text-left text-sm font-semibold">Itens com preço</caption>
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th scope="col" className="px-4 py-2 font-medium">
                      Item
                    </th>
                    <th scope="col" className="px-4 py-2 text-right font-medium">
                      Valor
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {scan.prices.map((line, index) => (
                    <tr key={`${line.descricao}-${index}`}>
                      <td className="px-4 py-2.5">{line.descricao}</td>
                      <td className="tabular px-4 py-2.5 text-right">{formatCurrency(line.valor)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t">
                  <tr>
                    <th scope="row" className="px-4 py-2.5 text-left font-medium">
                      Soma dos itens
                    </th>
                    <td className="tabular px-4 py-2.5 text-right font-semibold">{formatCurrency(scan.computedTotal)}</td>
                  </tr>
                  {scan.statedTotal !== null && Math.abs(scan.statedTotal - scan.computedTotal) > 0.009 && (
                    <tr>
                      <td colSpan={2} className="px-4 pb-3 text-xs" style={{ color: 'var(--status-warning)' }}>
                        O total informado ({formatCurrency(scan.statedTotal)}) não bate com a soma dos itens.
                      </td>
                    </tr>
                  )}
                </tfoot>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
