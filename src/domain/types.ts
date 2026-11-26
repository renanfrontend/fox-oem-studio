/**
 * Entidades do domínio. Datas de negócio: "yyyy-mm-dd". Timestamps: ISO completo.
 * Valores monetários em reais (number com 2 casas).
 */

export type StageId = 0 | 1 | 2 | 3;

export type TaskStatus = 'pendente' | 'cotando' | 'agendado' | 'concluido';

export type TaskCategory =
  | 'documentacao'
  | 'mecanica'
  | 'estetica'
  | 'rodas-suspensao'
  | 'interior'
  | 'eletrica';

export interface Task {
  id: string;
  stage: StageId;
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  estimatedCost: number;
  /** Valor efetivamente pago. Só abate da verba quando a tarefa está concluída. */
  actualCost: number | null;
  supplier: string;
  /** Data agendada ou de conclusão. */
  date: string | null;
  notes: string;
  /** Código/referência da peça original (OEM). */
  oemReference: string;
  /** Itens de manutenção preventiva que esta tarefa atualiza ao ser concluída. */
  maintenanceKeys: string[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export type TaskDraft = Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt'>;

export interface TaskCompletion {
  actualCost: number;
  date: string;
  supplier: string;
  /** Km no momento do serviço (registra no histórico de manutenção vinculado). */
  serviceKm: number | null;
}

export type AcquisitionStatus = 'pesquisando' | 'negociando' | 'comprado';

export interface VehicleProfile {
  nickname: string;
  model: string;
  modelYear: string;
  color: string;
  engine: string;
  transmission: string;
  plate: string;
  acquisitionStatus: AcquisitionStatus;
  purchaseDate: string | null;
}

export interface Contribution {
  id: string;
  date: string;
  amount: number;
  note: string;
}

export interface FinanceSettings {
  /** Valor no Cofrinho antes da compra. */
  baseValue: number;
  vehicleCost: number;
  /** Meta mínima que não deve ser tocada. */
  reserveTarget: number;
  /** CDI anual em % (ex.: 13.65). */
  cdiAnnualRate: number;
  /** Percentual do CDI que a aplicação rende (ex.: 100). */
  cdiPercentage: number;
  contributions: Contribution[];
}

export interface OdometerReading {
  id: string;
  km: number;
  date: string;
  note: string;
}

export interface ServiceRecord {
  id: string;
  km: number;
  date: string;
  cost: number | null;
  note: string;
  /** Preenchido quando o registro veio da conclusão de uma tarefa do roadmap. */
  taskId: string | null;
}

export interface MaintenanceItem {
  key: string;
  label: string;
  spec: string;
  intervalKm: number | null;
  intervalMonths: number | null;
  notes: string;
  history: ServiceRecord[];
}

export type MaintenanceItemDraft = Omit<MaintenanceItem, 'key' | 'history'>;

export type PhotoView = 'frente' | 'traseira' | 'lateral' | 'interior';

export type PhotoPhase = 'antes' | 'etapa-0' | 'etapa-1' | 'etapa-2' | 'etapa-3' | 'meta';

export type PhotoSlotKey = `${PhotoView}:${PhotoPhase}`;

export interface PhotoMeta {
  key: PhotoSlotKey;
  width: number;
  height: number;
  bytes: number;
  mimeType: string;
  updatedAt: string;
}

export type PhotoIndex = Partial<Record<PhotoSlotKey, PhotoMeta>>;

export interface AppData {
  schemaVersion: 1;
  vehicle: VehicleProfile;
  finance: FinanceSettings;
  tasks: Task[];
  odometer: OdometerReading[];
  maintenance: MaintenanceItem[];
  photos: PhotoIndex;
  guideChecks: Record<string, boolean>;
}
