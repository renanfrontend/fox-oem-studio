import { z } from 'zod';
import type { GoogleGenAI } from '@google/genai';

/**
 * Integração opcional com o Gemini.
 * O SDK é carregado sob demanda (import dinâmico) para não pesar no bundle inicial.
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim() ?? '';
export const GEMINI_MODEL = import.meta.env.VITE_GEMINI_MODEL?.trim() || 'gemini-3.8-flash';
export const isGeminiConfigured = API_KEY.length > 0;

export class GeminiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeminiError';
  }
}

let clientPromise: Promise<GoogleGenAI> | null = null;

function getClient(): Promise<GoogleGenAI> {
  if (!isGeminiConfigured) {
    return Promise.reject(new GeminiError('Configure VITE_GEMINI_API_KEY no .env.local para usar a IA.'));
  }
  clientPromise ??= import('@google/genai').then(({ GoogleGenAI: Client }) => new Client({ apiKey: API_KEY }));
  return clientPromise;
}

function toFriendlyError(error: unknown): GeminiError {
  if (error instanceof GeminiError) return error;
  const message = error instanceof Error ? error.message : String(error);
  if (/API key not valid|API_KEY_INVALID|PERMISSION_DENIED|\b40[13]\b/i.test(message)) {
    return new GeminiError('Chave do Gemini inválida ou sem permissão. Confira VITE_GEMINI_API_KEY.');
  }
  if (/\b429\b|RESOURCE_EXHAUSTED|quota/i.test(message)) {
    return new GeminiError('Limite de uso do Gemini atingido. Tente de novo em alguns minutos.');
  }
  if (/\b404\b|NOT_FOUND|is not found|not supported/i.test(message)) {
    return new GeminiError(`O modelo "${GEMINI_MODEL}" não está disponível para esta chave. Ajuste VITE_GEMINI_MODEL.`);
  }
  if (/Failed to fetch|NetworkError|network|ERR_/i.test(message)) {
    return new GeminiError('Sem conexão com a API do Gemini. Verifique a internet e tente de novo.');
  }
  return new GeminiError(`Falha na chamada ao Gemini: ${message}`);
}

/* ------------------------------------------------------------------ */
/* Refino de prompts de render                                         */
/* ------------------------------------------------------------------ */

export type PromptTarget = 'gemini-imagem' | 'midjourney' | 'stable-diffusion';

export const PROMPT_TARGETS: readonly { id: PromptTarget; label: string }[] = [
  { id: 'gemini-imagem', label: 'Gemini (edição da sua foto)' },
  { id: 'midjourney', label: 'Midjourney' },
  { id: 'stable-diffusion', label: 'Stable Diffusion / SDXL' },
];

const REFINE_SYSTEM_INSTRUCTION = [
  'You are a senior automotive CGI and photo-retouching prompt engineer.',
  'Rewrite the user prompt into the best possible prompt for the requested tool.',
  'Preserve the car identity exactly: a silver 2011/2012 Volkswagen Fox 1.6 compact hatchback, Brazilian market.',
  'Follow the OEM+ philosophy: upgrades must look like genuine factory parts, subtle and clean, never aftermarket body kits, stickers or neon.',
  'For "gemini-imagem": an image-editing instruction that keeps the original photo identical except for the listed upgrades.',
  'For "midjourney": a single paragraph ending with --ar 4:3 --style raw.',
  'For "stable-diffusion": two lines starting with "Prompt:" and "Negative prompt:".',
  'Answer only with the final prompt in English, without explanations or markdown.',
].join(' ');

export interface RefinePromptInput {
  target: PromptTarget;
  basePrompt: string;
  negativePrompt: string;
  upgradeLabels: readonly string[];
}

export async function refineRenderPrompt(input: RefinePromptInput): Promise<string> {
  try {
    const ai = await getClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: [
                `Target tool: ${input.target}`,
                `Requested upgrades (Portuguese labels): ${input.upgradeLabels.join(', ') || 'none'}`,
                `Base prompt: ${input.basePrompt}`,
                `Negative prompt: ${input.negativePrompt}`,
              ].join('\n'),
            },
          ],
        },
      ],
      config: { systemInstruction: REFINE_SYSTEM_INSTRUCTION, temperature: 0.6 },
    });
    const text = response.text?.trim();
    if (!text) throw new GeminiError('O Gemini não devolveu texto. Tente novamente.');
    return text;
  } catch (error) {
    throw toFriendlyError(error);
  }
}

/* ------------------------------------------------------------------ */
/* Análise de laudo cautelar / orçamento                               */
/* ------------------------------------------------------------------ */

export type ReportMode = 'laudo' | 'orcamento';

const analysisSchema = z.object({
  resumo: z.string(),
  risco: z.enum(['baixo', 'medio', 'alto']),
  itens: z.array(
    z.object({
      titulo: z.string(),
      severidade: z.enum(['info', 'atencao', 'critico']),
      explicacao: z.string(),
      acao: z.string(),
      custoEstimado: z.number().min(0),
      etapaSugerida: z.number().int().min(0).max(3),
    }),
  ),
  perguntas: z.array(z.string()),
});

export type ReportAnalysis = z.infer<typeof analysisSchema>;
export type ReportAnalysisItem = ReportAnalysis['itens'][number];

const ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  properties: {
    resumo: { type: 'string', description: 'Resumo objetivo em 2 ou 3 frases.' },
    risco: { type: 'string', enum: ['baixo', 'medio', 'alto'] },
    itens: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          titulo: { type: 'string' },
          severidade: { type: 'string', enum: ['info', 'atencao', 'critico'] },
          explicacao: { type: 'string' },
          acao: { type: 'string', description: 'Próximo passo prático para o comprador.' },
          custoEstimado: {
            type: 'number',
            description: 'Custo estimado em reais para resolver em São Paulo; 0 quando não se aplica ou é desconhecido.',
          },
          etapaSugerida: { type: 'integer', minimum: 0, maximum: 3 },
        },
        required: ['titulo', 'severidade', 'explicacao', 'acao', 'custoEstimado', 'etapaSugerida'],
      },
    },
    perguntas: {
      type: 'array',
      items: { type: 'string' },
      description: 'Perguntas para fazer ao vendedor ou à oficina.',
    },
  },
  required: ['resumo', 'risco', 'itens', 'perguntas'],
} as const;

const ANALYSIS_SYSTEM_INSTRUCTION = [
  'Você é um inspetor automotivo sênior no Brasil, especialista em VW Fox 1.6 com motor EA111 e câmbio automatizado I-Motion (ASG).',
  'Analise o documento para um comprador que segue a filosofia OEM+ (peças originais, visual de fábrica).',
  'Em laudos cautelares: priorize estrutura (longarinas, colunas, assoalho), sinistro, leilão, remarcação de chassi ou motor, alagamento, hodômetro, airbag, repintura e recall.',
  'Em orçamentos: compare com preços médios de São Paulo, aponte itens desnecessários ou faltantes (ex.: tensor e bomba d’água junto da correia), peças paralelas versus originais e mão de obra.',
  'Óleo do projeto: 5W-40 com norma VW 502.00. Fluido do I-Motion: o especificado pela VW, com adaptação no scanner após a troca.',
  'Etapas do projeto: 0 = aquisição e base mecânica; 1 = estética de fábrica; 2 = rodas, pneus e suspensão; 3 = interior e tecnologia.',
  'Não invente informações ausentes no documento; quando faltar dado, diga isso no item. Responda em português do Brasil.',
].join(' ');

export interface AnalyzeReportInput {
  mode: ReportMode;
  text: string;
  attachment?: { mimeType: string; base64: string } | null;
}

export async function analyzeReport(input: AnalyzeReportInput): Promise<ReportAnalysis> {
  const documentLabel = input.mode === 'laudo' ? 'Laudo cautelar de compra' : 'Orçamento de peças e serviços';
  const parts: { text?: string; inlineData?: { mimeType: string; data: string } }[] = [
    {
      text: `Tipo de documento: ${documentLabel}.\n\nConteúdo:\n${input.text.trim() || '(veja o arquivo anexo)'}`,
    },
  ];
  if (input.attachment) {
    parts.push({ inlineData: { mimeType: input.attachment.mimeType, data: input.attachment.base64 } });
  }

  try {
    const ai = await getClient();
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseJsonSchema: ANALYSIS_JSON_SCHEMA,
        temperature: 0.2,
      },
    });

    const raw = response.text?.trim();
    if (!raw) throw new GeminiError('O Gemini não devolveu uma análise. Tente novamente.');

    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      throw new GeminiError('A resposta da IA não veio em JSON válido. Tente novamente.');
    }
    const parsed = analysisSchema.safeParse(json);
    if (!parsed.success) throw new GeminiError('A resposta da IA veio em formato inesperado. Tente novamente.');
    return parsed.data;
  } catch (error) {
    throw toFriendlyError(error);
  }
}
