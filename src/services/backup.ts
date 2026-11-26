import { z } from 'zod';
import { isPhotoSlotKey } from '@/domain/photos';
import { appDataSchema, formatSchemaError } from '@/domain/schema';
import type { AppData, PhotoIndex, PhotoSlotKey } from '@/domain/types';
import { todayISO } from '@/lib/dates';
import { dataURLToBlob, readAsDataURL } from './image-processing';
import { photoStorage } from './photo-storage';

export const BACKUP_APP_ID = 'fox-oem-plus-studio';
const MAX_BACKUP_BYTES = 150 * 1024 * 1024;

export class BackupError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupError';
  }
}

export interface BackupPayload {
  app: typeof BACKUP_APP_ID;
  schemaVersion: 1;
  exportedAt: string;
  data: AppData;
  /** Fotos em data URL (Base64), indexadas pela chave do slot. */
  photos: Partial<Record<PhotoSlotKey, string>>;
}

const backupSchema = z.object({
  app: z.literal(BACKUP_APP_ID),
  schemaVersion: z.literal(1),
  exportedAt: z.string(),
  data: appDataSchema,
  photos: z.record(z.string(), z.string().startsWith('data:image/')),
});

export function backupFileName(): string {
  return `fox-oem-studio-backup-${todayISO()}.json`;
}

export async function buildBackup(data: AppData, includePhotos: boolean): Promise<BackupPayload> {
  const photos: Partial<Record<PhotoSlotKey, string>> = {};
  const exportedIndex: PhotoIndex = {};

  if (includePhotos) {
    for (const meta of Object.values(data.photos)) {
      if (!meta) continue;
      const blob = await photoStorage.load(meta.key);
      if (!blob) continue;
      photos[meta.key] = await readAsDataURL(blob);
      exportedIndex[meta.key] = meta;
    }
  }

  return {
    app: BACKUP_APP_ID,
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    data: { ...data, photos: exportedIndex },
    photos,
  };
}

export function serializeBackup(payload: BackupPayload): Blob {
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
}

export async function readBackupFile(file: File): Promise<BackupPayload> {
  if (file.size > MAX_BACKUP_BYTES) throw new BackupError('Arquivo acima de 150 MB: não parece um backup do app.');

  let json: unknown;
  try {
    json = JSON.parse(await file.text());
  } catch {
    throw new BackupError('O arquivo não é um JSON válido.');
  }

  if (typeof json === 'object' && json !== null && 'app' in json && json.app !== BACKUP_APP_ID) {
    throw new BackupError('Este JSON não foi exportado pelo Fox OEM+ Studio.');
  }

  const parsed = backupSchema.safeParse(json);
  if (!parsed.success) throw new BackupError(`Backup inválido. ${formatSchemaError(parsed.error)}`);

  const photos: Partial<Record<PhotoSlotKey, string>> = {};
  for (const [key, dataUrl] of Object.entries(parsed.data.photos)) {
    if (isPhotoSlotKey(key)) photos[key] = dataUrl;
  }

  return { ...parsed.data, photos };
}

export function countBackupPhotos(payload: BackupPayload): number {
  return Object.keys(payload.photos).length;
}

/**
 * Grava as fotos do backup no IndexedDB e devolve os dados prontos para o store.
 * Backup sem fotos preserva as fotos atuais do aparelho.
 */
export async function restoreBackup(payload: BackupPayload, currentPhotos: PhotoIndex): Promise<AppData> {
  const entries = Object.entries(payload.photos) as [PhotoSlotKey, string][];

  if (entries.length === 0) {
    return { ...payload.data, photos: currentPhotos };
  }

  await photoStorage.clearAll();
  const restoredIndex: PhotoIndex = {};
  for (const [key, dataUrl] of entries) {
    const meta = payload.data.photos[key];
    if (!meta) continue;
    await photoStorage.save(key, dataURLToBlob(dataUrl));
    restoredIndex[key] = meta;
  }
  return { ...payload.data, photos: restoredIndex };
}
