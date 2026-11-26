import { z } from 'zod';
import { isPhotoSlotKey } from './photos';
import type { AppData, PhotoIndex, PhotoMeta } from './types';

/**
 * Validação em runtime dos dados persistidos e dos backups importados.
 * A anotação `z.ZodType<AppData>` garante em compilação que o schema
 * continua compatível com os tipos do domínio.
 */

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato aaaa-mm-dd');
const money = z.number().min(0);

const stageSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);

const taskSchema = z.object({
  id: z.string().min(1),
  stage: stageSchema,
  title: z.string(),
  category: z.enum(['documentacao', 'mecanica', 'estetica', 'rodas-suspensao', 'interior', 'eletrica']),
  status: z.enum(['pendente', 'cotando', 'agendado', 'concluido']),
  estimatedCost: money,
  actualCost: money.nullable(),
  supplier: z.string(),
  date: isoDate.nullable(),
  notes: z.string(),
  oemReference: z.string(),
  maintenanceKeys: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().nullable(),
});

const vehicleSchema = z.object({
  nickname: z.string(),
  model: z.string(),
  modelYear: z.string(),
  color: z.string(),
  engine: z.string(),
  transmission: z.string(),
  plate: z.string(),
  acquisitionStatus: z.enum(['pesquisando', 'negociando', 'comprado']),
  purchaseDate: isoDate.nullable(),
});

const financeSchema = z.object({
  baseValue: money,
  vehicleCost: money,
  reserveTarget: money,
  cdiAnnualRate: z.number().min(0).max(100),
  cdiPercentage: z.number().min(0).max(300),
  contributions: z.array(
    z.object({
      id: z.string().min(1),
      date: isoDate,
      amount: z.number(),
      note: z.string(),
    }),
  ),
});

const odometerSchema = z.object({
  id: z.string().min(1),
  km: z.number().min(0),
  date: isoDate,
  note: z.string(),
});

const serviceRecordSchema = z.object({
  id: z.string().min(1),
  km: z.number().min(0),
  date: isoDate,
  cost: money.nullable(),
  note: z.string(),
  taskId: z.string().nullable(),
});

const maintenanceItemSchema = z.object({
  key: z.string().min(1),
  label: z.string(),
  spec: z.string(),
  intervalKm: z.number().positive().nullable(),
  intervalMonths: z.number().positive().nullable(),
  notes: z.string(),
  history: z.array(serviceRecordSchema),
});

const photoMetaSchema = z.object({
  key: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  bytes: z.number().int().min(0),
  mimeType: z.string(),
  updatedAt: z.string(),
});

/** Descarta entradas com chave inválida em vez de rejeitar o backup inteiro. */
const photoIndexSchema = z.record(z.string(), photoMetaSchema).transform((record): PhotoIndex => {
  const index: PhotoIndex = {};
  for (const [key, meta] of Object.entries(record)) {
    if (isPhotoSlotKey(key) && meta.key === key) {
      const typed: PhotoMeta = { ...meta, key };
      index[key] = typed;
    }
  }
  return index;
});

export const appDataSchema: z.ZodType<AppData> = z.object({
  schemaVersion: z.literal(1),
  vehicle: vehicleSchema,
  finance: financeSchema,
  tasks: z.array(taskSchema),
  odometer: z.array(odometerSchema),
  maintenance: z.array(maintenanceItemSchema),
  photos: photoIndexSchema,
  guideChecks: z.record(z.string(), z.boolean()),
});

export function formatSchemaError(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'Estrutura de dados inválida.';
  const path = issue.path.length > 0 ? issue.path.join('.') : 'raiz';
  return `Campo "${path}": ${issue.message}`;
}
