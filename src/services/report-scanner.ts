import type { StageId } from '@/domain/types';
import { parseLocaleNumber } from '@/lib/format';
import type { ReportMode } from './gemini';

/**
 * Varredura offline por palavras-chave de laudos cautelares e orçamentos.
 * Não substitui o laudo: serve como triagem rápida sem depender de IA.
 */

export type ScanSeverity = 'info' | 'atencao' | 'critico';

export interface ScanFinding {
  id: string;
  titulo: string;
  severidade: ScanSeverity;
  explicacao: string;
  acao: string;
  trecho: string;
  etapaSugerida: StageId;
}

export interface PriceLine {
  descricao: string;
  valor: number;
}

export interface ScanResult {
  findings: ScanFinding[];
  prices: PriceLine[];
  statedTotal: number | null;
  computedTotal: number;
}

interface ScanRule {
  id: string;
  pattern: RegExp;
  modes: readonly ReportMode[];
  titulo: string;
  severidade: ScanSeverity;
  explicacao: string;
  acao: string;
  etapa: StageId;
}

const BOTH: readonly ReportMode[] = ['laudo', 'orcamento'];
const LAUDO: readonly ReportMode[] = ['laudo'];
const ORCAMENTO: readonly ReportMode[] = ['orcamento'];

const RULES: readonly ScanRule[] = [
  {
    id: 'reprovado',
    pattern: /\breprovad[oa]\b/,
    modes: LAUDO,
    titulo: 'Laudo reprovado',
    severidade: 'critico',
    explicacao: 'O próprio laudo recomenda não seguir com a compra.',
    acao: 'Não feche negócio sem entender cada motivo da reprovação.',
    etapa: 0,
  },
  {
    id: 'leilao',
    pattern: /\bleil(ao|oad[oa])\b/,
    modes: LAUDO,
    titulo: 'Passagem por leilão',
    severidade: 'critico',
    explicacao: 'Derruba o valor de revenda, dificulta o seguro e pode esconder sinistro ou recuperação.',
    acao: 'Peça o histórico do leilão e renegocie o preço, ou desista.',
    etapa: 0,
  },
  {
    id: 'sinistro',
    pattern: /sinistr|media monta|grande monta|perda total/,
    modes: LAUDO,
    titulo: 'Indício de sinistro',
    severidade: 'critico',
    explicacao: 'Batida com dano relevante: risco estrutural e de recusa da seguradora.',
    acao: 'Peça fotos das áreas reparadas e a avaliação de um funileiro de confiança.',
    etapa: 0,
  },
  {
    id: 'estrutura',
    pattern: /longarin|\bcolunas?\b|assoalho|caixa de ar|torre (do|de|dos) amortecedor|corta[- ]fogo/,
    modes: LAUDO,
    titulo: 'Estrutura citada no laudo',
    severidade: 'critico',
    explicacao: 'Reparos em longarinas, colunas ou assoalho comprometem a segurança em colisões.',
    acao: 'Só siga com a parte estrutural aprovada e um preço compatível.',
    etapa: 0,
  },
  {
    id: 'remarcacao',
    pattern: /remarcad|adulterad|(chassi|motor|numeracao).{0,25}(divergen|irregular|ilegivel)/,
    modes: LAUDO,
    titulo: 'Numeração de chassi ou motor irregular',
    severidade: 'critico',
    explicacao: 'Pode travar a transferência e a vistoria do Detran.',
    acao: 'Não feche negócio antes da regularização documental.',
    etapa: 0,
  },
  {
    id: 'roubo',
    pattern: /\broubo\b|\bfurto\b|recuperad[oa] de/,
    modes: LAUDO,
    titulo: 'Histórico de roubo ou furto',
    severidade: 'critico',
    explicacao: 'Veículos recuperados costumam ter peças trocadas e restrições de seguro.',
    acao: 'Confirme a baixa do registro e a originalidade das peças.',
    etapa: 0,
  },
  {
    id: 'alagamento',
    pattern: /alagad|alagamento|enchente|submers/,
    modes: LAUDO,
    titulo: 'Indício de alagamento',
    severidade: 'critico',
    explicacao: 'Água danifica módulos eletrônicos, inclusive o do I-Motion, e acelera a corrosão.',
    acao: 'Evite a compra ou exija inspeção elétrica completa.',
    etapa: 0,
  },
  {
    id: 'hodometro',
    pattern: /(hodometro|quilometragem).{0,30}(adulterad|divergen|inconsisten)/,
    modes: LAUDO,
    titulo: 'Quilometragem inconsistente',
    severidade: 'critico',
    explicacao: 'Km adulterado esconde desgaste real de motor, câmbio e suspensão.',
    acao: 'Cruze com notas de revisão e registros do Detran antes de seguir.',
    etapa: 0,
  },
  {
    id: 'airbag',
    pattern: /airbag.{0,30}(acionad|luz|falha|inoperan)|luz (do|de) airbag/,
    modes: LAUDO,
    titulo: 'Airbag com apontamento',
    severidade: 'critico',
    explicacao: 'Airbag acionado ou com falha indica colisão e exige reparo certificado.',
    acao: 'Peça o diagnóstico do módulo e o orçamento do reparo antes de negociar.',
    etapa: 0,
  },
  {
    id: 'apontamento',
    pattern: /aprovad[oa] com (apontamento|ressalva|restricao)/,
    modes: LAUDO,
    titulo: 'Aprovado com apontamento',
    severidade: 'atencao',
    explicacao: 'Compra possível, mas há itens que pesam no preço.',
    acao: 'Liste os apontamentos e use cada um na negociação.',
    etapa: 0,
  },
  {
    id: 'repintura',
    pattern: /repintur|repintad|retoque de pintura|massa plastica|\bmassa\b|verniz.{0,15}(diferen|divergen)/,
    modes: LAUDO,
    titulo: 'Repintura ou massa',
    severidade: 'atencao',
    explicacao: 'Retoques leves são comuns em um carro de 15 anos; muita massa indica batida maior.',
    acao: 'Peça a medição de espessura da pintura peça a peça.',
    etapa: 1,
  },
  {
    id: 'recall',
    pattern: /\brecall\b/,
    modes: LAUDO,
    titulo: 'Recall pendente ou citado',
    severidade: 'atencao',
    explicacao: 'Recall é gratuito na concessionária, mas precisa ter sido executado.',
    acao: 'Consulte pelo chassi no site da VW e agende se estiver aberto.',
    etapa: 0,
  },
  {
    id: 'gnv',
    pattern: /\bgnv\b|kit gas/,
    modes: LAUDO,
    titulo: 'Kit GNV',
    severidade: 'atencao',
    explicacao: 'Exige documentação específica e muda a rotina de manutenção.',
    acao: 'Confira o registro no documento e o certificado de inspeção.',
    etapa: 0,
  },
  {
    id: 'imotion',
    pattern: /i-?motion|cambio automatizado|\basg\b|atuador|embreagem.{0,30}(patin|desgast|trepid)|\btranco/,
    modes: BOTH,
    titulo: 'Câmbio I-Motion citado',
    severidade: 'atencao',
    explicacao: 'O atuador e a embreagem são os itens mais caros do I-Motion.',
    acao: 'Peça a leitura do desgaste da embreagem e das adaptações no scanner.',
    etapa: 0,
  },
  {
    id: 'vazamento',
    pattern: /vazament|vazando|exsudac|junta.{0,20}(tampa|cabecote)/,
    modes: BOTH,
    titulo: 'Vazamento',
    severidade: 'atencao',
    explicacao: 'Vazamentos de óleo ou arrefecimento pioram rápido e sujam o cofre.',
    acao: 'Identifique a origem e inclua o reparo na Etapa 0.',
    etapa: 0,
  },
  {
    id: 'suspensao',
    pattern: /amortecedor.{0,20}(vazand|vencid|fraco|estourad)|\bbuchas?\b|\bbandejas?\b|\bpivo/,
    modes: BOTH,
    titulo: 'Suspensão com desgaste',
    severidade: 'atencao',
    explicacao: 'Itens de suspensão gastos comprometem estabilidade e desgastam pneus.',
    acao: 'Some ao orçamento da Etapa 2 e confirme peças de primeira linha.',
    etapa: 2,
  },
  {
    id: 'pneus',
    pattern: /pneus?.{0,20}(desgast|careca|ressecad|vencid)/,
    modes: BOTH,
    titulo: 'Pneus gastos',
    severidade: 'atencao',
    explicacao: 'Pneu gasto ou ressecado é item de segurança, não só estética.',
    acao: 'Antecipe o jogo de pneus ou negocie o valor no preço do carro.',
    etapa: 2,
  },
  {
    id: 'freios',
    pattern: /pastilh.{0,20}(gast|fim|baixa)|disco.{0,20}(empenad|gast)/,
    modes: BOTH,
    titulo: 'Freios gastos',
    severidade: 'atencao',
    explicacao: 'Pastilhas e discos no fim exigem troca imediata.',
    acao: 'Inclua no pacote de revisão da Etapa 0.',
    etapa: 0,
  },
  {
    id: 'correia',
    pattern: /correia dentada/,
    modes: ORCAMENTO,
    titulo: 'Correia dentada no orçamento',
    severidade: 'info',
    explicacao: 'O serviço deve incluir tensor; a bomba d’água costuma ser trocada junto.',
    acao: 'Confirme o kit completo e a marca das peças.',
    etapa: 0,
  },
  {
    id: 'viscosidade',
    pattern: /\b(5w-?30|10w-?40|15w-?40|20w-?50)\b/,
    modes: ORCAMENTO,
    titulo: 'Óleo fora da especificação do projeto',
    severidade: 'atencao',
    explicacao: 'O projeto usa 5W-40 com norma VW 502.00.',
    acao: 'Peça a troca pela especificação correta antes de aprovar.',
    etapa: 0,
  },
  {
    id: 'paralela',
    pattern: /paralel|similar|alternativ[ao]|primeira linha|\b1a linha/,
    modes: ORCAMENTO,
    titulo: 'Peça paralela ou similar',
    severidade: 'info',
    explicacao: 'No OEM+, prefira peça original ou de fornecedor que equipa a montadora.',
    acao: 'Peça o preço da original para comparar.',
    etapa: 0,
  },
];

/** Remove acentos mantendo o mesmo comprimento (índices batem com o texto original). */
function normalizeKeepingLength(text: string): string {
  let output = '';
  for (const char of text) {
    const base = char.normalize('NFD').charAt(0) || char;
    output += base.length === char.length ? base.toLowerCase() : char.toLowerCase();
  }
  return output;
}

function snippetAround(text: string, index: number, length: number): string {
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + length + 40);
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return `${prefix}${text.slice(start, end).replace(/\s+/g, ' ').trim()}${suffix}`;
}

const PRICE_PATTERN = /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})+,\d{2}|\d+,\d{2}|\d{1,3}(?:\.\d{3})+|\d+)(?=\s*$)/;
const CURRENCY_PATTERN = /R\$\s*(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:,\d{2})?)/;

function extractPrices(text: string): { prices: PriceLine[]; statedTotal: number | null } {
  const prices: PriceLine[] = [];
  let statedTotal: number | null = null;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const match = CURRENCY_PATTERN.exec(line) ?? (/,\d{2}\s*$/.test(line) ? PRICE_PATTERN.exec(line) : null);
    if (!match?.[1]) continue;
    const value = parseLocaleNumber(match[1]);
    if (value === null || value <= 0) continue;

    const description = line
      .replace(match[0], '')
      .replace(/[-–—:|.\s]+$/g, '')
      .replace(/^[-–—:|.\s]+/g, '')
      .trim();

    if (/\btotal\b/i.test(description)) {
      statedTotal = value;
      continue;
    }
    prices.push({ descricao: description || 'Item sem descrição', valor: value });
  }

  return { prices, statedTotal };
}

/** Laudos costumam listar itens verificados sem problema ("sem avarias", "nada consta"). */
const NEGATION_PATTERN =
  /sem (avaria|dano|indicio|sinal|apontamento|registro|alteracao|irregularidade|restricao)|nada consta|nao consta|nao (ha|apresenta|identificad|constatad|encontrad)|ausencia de|\bok\b|intact|integr[ao]s?\b|\bconforme\b|\boriginal\b/;

function isNegated(normalized: string, index: number, length: number): boolean {
  const before = normalized.slice(Math.max(0, index - 28), index);
  const after = normalized.slice(index + length, index + length + 45);
  return NEGATION_PATTERN.test(before) || NEGATION_PATTERN.test(after.split(/[.;\n]/)[0] ?? '');
}

export function scanReport(text: string, mode: ReportMode): ScanResult {
  const normalized = normalizeKeepingLength(text);
  const findings: ScanFinding[] = [];

  for (const rule of RULES) {
    if (!rule.modes.includes(mode)) continue;
    const match = rule.pattern.exec(normalized);
    if (!match) continue;
    const negated = mode === 'laudo' && isNegated(normalized, match.index, match[0].length);
    findings.push({
      id: rule.id,
      titulo: negated ? `${rule.titulo}: sem apontamento` : rule.titulo,
      severidade: negated ? 'info' : rule.severidade,
      explicacao: negated
        ? 'O documento cita o item, mas sem indicar problema. Confirme no laudo original.'
        : rule.explicacao,
      acao: negated ? 'Guarde o laudo: ele também vale como histórico na revenda.' : rule.acao,
      trecho: snippetAround(text, match.index, match[0].length),
      etapaSugerida: rule.etapa,
    });
  }

  const order: Record<ScanSeverity, number> = { critico: 0, atencao: 1, info: 2 };
  findings.sort((a, b) => order[a.severidade] - order[b.severidade]);

  const { prices, statedTotal } = mode === 'orcamento' ? extractPrices(text) : { prices: [], statedTotal: null };
  const computedTotal = Math.round(prices.reduce((sum, line) => sum + line.valor, 0) * 100) / 100;

  return { findings, prices, statedTotal, computedTotal };
}
