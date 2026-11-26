import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { createSeedData } from '@/data/seed';
import { getCurrentKm } from '@/domain/maintenance';
import { appDataSchema } from '@/domain/schema';
import type {
  AppData,
  Contribution,
  FinanceSettings,
  MaintenanceItemDraft,
  OdometerReading,
  PhotoMeta,
  PhotoSlotKey,
  ServiceRecord,
  Task,
  TaskCompletion,
  TaskDraft,
  TaskStatus,
  VehicleProfile,
} from '@/domain/types';
import { createId } from '@/lib/id';

export interface AppActions {
  updateVehicle: (patch: Partial<VehicleProfile>) => void;
  updateFinance: (patch: Partial<Omit<FinanceSettings, 'contributions'>>) => void;
  addContribution: (input: Omit<Contribution, 'id'>) => void;
  removeContribution: (id: string) => void;

  addTask: (draft: TaskDraft) => string;
  updateTask: (id: string, patch: Partial<TaskDraft>) => void;
  removeTask: (id: string) => void;
  /** Para status diferentes de concluído. Reabrir uma tarefa remove os registros de manutenção gerados por ela. */
  setTaskStatus: (id: string, status: Exclude<TaskStatus, 'concluido'>) => void;
  completeTask: (id: string, completion: TaskCompletion) => void;

  addOdometerReading: (input: Omit<OdometerReading, 'id'>) => void;
  removeOdometerReading: (id: string) => void;
  registerService: (key: string, record: Omit<ServiceRecord, 'id'>) => void;
  removeServiceRecord: (key: string, recordId: string) => void;
  saveMaintenanceItem: (draft: MaintenanceItemDraft, key?: string) => void;
  removeMaintenanceItem: (key: string) => void;

  setPhotoMeta: (meta: PhotoMeta) => void;
  removePhotoMeta: (key: PhotoSlotKey) => void;

  toggleGuideCheck: (id: string) => void;
  resetGuideChecks: () => void;

  replaceData: (data: AppData) => void;
  resetData: () => void;
}

export type AppState = AppData & AppActions;

export const STORAGE_KEY = 'fox-oem-plus-studio';

/** localStorage pode lançar (modo privado, cota, iframe sandbox): o app segue em memória. */
const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(name, value);
    } catch (error) {
      console.warn('[fox-oem-studio] Não foi possível salvar no localStorage.', error);
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(name);
    } catch {
      // Ignorado: nada a remover.
    }
  },
};

export function pickAppData(state: AppData): AppData {
  return {
    schemaVersion: state.schemaVersion,
    vehicle: state.vehicle,
    finance: state.finance,
    tasks: state.tasks,
    odometer: state.odometer,
    maintenance: state.maintenance,
    photos: state.photos,
    guideChecks: state.guideChecks,
  };
}

function nowTimestamp(): string {
  return new Date().toISOString();
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function stripTaskRecords(maintenance: AppData['maintenance'], taskId: string): AppData['maintenance'] {
  return maintenance.map((item) =>
    item.history.some((record) => record.taskId === taskId)
      ? { ...item, history: item.history.filter((record) => record.taskId !== taskId) }
      : item,
  );
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...createSeedData(),

      updateVehicle: (patch) => set((state) => ({ vehicle: { ...state.vehicle, ...patch } })),

      updateFinance: (patch) => set((state) => ({ finance: { ...state.finance, ...patch } })),

      addContribution: (input) =>
        set((state) => ({
          finance: {
            ...state.finance,
            contributions: [...state.finance.contributions, { ...input, id: createId('aporte') }],
          },
        })),

      removeContribution: (id) =>
        set((state) => ({
          finance: {
            ...state.finance,
            contributions: state.finance.contributions.filter((item) => item.id !== id),
          },
        })),

      addTask: (draft) => {
        const id = createId('tarefa');
        const timestamp = nowTimestamp();
        const task: Task = {
          ...draft,
          id,
          createdAt: timestamp,
          updatedAt: timestamp,
          completedAt: draft.status === 'concluido' ? timestamp : null,
        };
        set((state) => ({ tasks: [...state.tasks, task] }));
        return id;
      },

      updateTask: (id, patch) =>
        set((state) => {
          const current = state.tasks.find((task) => task.id === id);
          if (!current) return {};
          const reopened = current.status === 'concluido' && patch.status !== undefined && patch.status !== 'concluido';
          const timestamp = nowTimestamp();
          return {
            tasks: state.tasks.map((task) => {
              if (task.id !== id) return task;
              const next: Task = { ...task, ...patch, updatedAt: timestamp };
              if (next.status === 'concluido' && !task.completedAt) next.completedAt = timestamp;
              if (next.status !== 'concluido') next.completedAt = null;
              return next;
            }),
            maintenance: reopened ? stripTaskRecords(state.maintenance, id) : state.maintenance,
          };
        }),

      removeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
          maintenance: stripTaskRecords(state.maintenance, id),
        })),

      setTaskStatus: (id, status) => get().updateTask(id, { status }),

      completeTask: (id, completion) =>
        set((state) => {
          const task = state.tasks.find((item) => item.id === id);
          if (!task) return {};
          const timestamp = nowTimestamp();
          const tasks = state.tasks.map((item) =>
            item.id === id
              ? {
                  ...item,
                  status: 'concluido' as const,
                  actualCost: Math.max(0, completion.actualCost),
                  date: completion.date,
                  supplier: completion.supplier.trim() || item.supplier,
                  updatedAt: timestamp,
                  completedAt: timestamp,
                }
              : item,
          );

          const serviceKm = completion.serviceKm;
          if (serviceKm === null || task.maintenanceKeys.length === 0) return { tasks };

          // Conclusão de serviço vinculado: alimenta o histórico preventivo.
          const linkedKeys = new Set(task.maintenanceKeys);
          const singleLink = task.maintenanceKeys.length === 1;
          const maintenance = stripTaskRecords(state.maintenance, id).map((item) =>
            linkedKeys.has(item.key)
              ? {
                  ...item,
                  history: [
                    ...item.history,
                    {
                      id: createId('servico'),
                      km: serviceKm,
                      date: completion.date,
                      cost: singleLink ? Math.max(0, completion.actualCost) : null,
                      note: `Registrado pelo roadmap: ${task.title}`,
                      taskId: id,
                    },
                  ],
                }
              : item,
          );

          const currentKm = getCurrentKm(state.odometer);
          const odometer =
            currentKm === null || serviceKm > currentKm
              ? [
                  ...state.odometer,
                  {
                    id: createId('odo'),
                    km: serviceKm,
                    date: completion.date,
                    note: `Registrado na conclusão de: ${task.title}`,
                  },
                ]
              : state.odometer;

          return { tasks, maintenance, odometer };
        }),

      addOdometerReading: (input) =>
        set((state) => ({ odometer: [...state.odometer, { ...input, id: createId('odo') }] })),

      removeOdometerReading: (id) =>
        set((state) => ({ odometer: state.odometer.filter((reading) => reading.id !== id) })),

      registerService: (key, record) =>
        set((state) => ({
          maintenance: state.maintenance.map((item) =>
            item.key === key ? { ...item, history: [...item.history, { ...record, id: createId('servico') }] } : item,
          ),
        })),

      removeServiceRecord: (key, recordId) =>
        set((state) => ({
          maintenance: state.maintenance.map((item) =>
            item.key === key ? { ...item, history: item.history.filter((record) => record.id !== recordId) } : item,
          ),
        })),

      saveMaintenanceItem: (draft, key) =>
        set((state) => {
          if (key) {
            return {
              maintenance: state.maintenance.map((item) => (item.key === key ? { ...item, ...draft } : item)),
            };
          }
          const base = slugify(draft.label) || 'item';
          const taken = new Set(state.maintenance.map((item) => item.key));
          let newKey = base;
          let suffix = 2;
          while (taken.has(newKey)) newKey = `${base}-${suffix++}`;
          return { maintenance: [...state.maintenance, { ...draft, key: newKey, history: [] }] };
        }),

      removeMaintenanceItem: (key) =>
        set((state) => ({
          maintenance: state.maintenance.filter((item) => item.key !== key),
          tasks: state.tasks.map((task) =>
            task.maintenanceKeys.includes(key)
              ? { ...task, maintenanceKeys: task.maintenanceKeys.filter((linked) => linked !== key) }
              : task,
          ),
        })),

      setPhotoMeta: (meta) => set((state) => ({ photos: { ...state.photos, [meta.key]: meta } })),

      removePhotoMeta: (key) =>
        set((state) => {
          const photos = { ...state.photos };
          delete photos[key];
          return { photos };
        }),

      toggleGuideCheck: (id) =>
        set((state) => ({ guideChecks: { ...state.guideChecks, [id]: !state.guideChecks[id] } })),

      resetGuideChecks: () => set({ guideChecks: {} }),

      replaceData: (data) => set(pickAppData(data)),

      resetData: () => set(createSeedData()),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => safeLocalStorage),
      partialize: (state) => pickAppData(state),
      // Dados corrompidos ou de outra versão nunca derrubam o app: volta para o seed.
      merge: (persisted, current) => {
        const parsed = appDataSchema.safeParse(persisted);
        if (!parsed.success) {
          if (persisted !== undefined && persisted !== null) {
            console.warn('[fox-oem-studio] Dados salvos inválidos; carregando dados iniciais.', parsed.error);
          }
          return current;
        }
        return { ...current, ...parsed.data };
      },
      migrate: (persisted) => persisted as AppData,
    },
  ),
);
