import { useEffect, useState } from 'react';
import type { PhotoSlotKey } from '@/domain/types';
import { photoStorage } from '@/services/photo-storage';

/**
 * Carrega a foto do IndexedDB e expõe uma Blob URL (revogada ao trocar/desmontar).
 * `version` (updatedAt do metadado) força recarregar quando a foto é substituída.
 */
export function usePhotoUrl(key: PhotoSlotKey | null, version: string | undefined): string | null {
  const [loaded, setLoaded] = useState<{ id: string; url: string } | null>(null);
  const id = key && version ? `${key}@${version}` : null;

  useEffect(() => {
    if (!id || !key) return;
    let cancelled = false;
    let objectUrl: string | null = null;

    photoStorage
      .load(key)
      .then((blob) => {
        if (cancelled || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setLoaded({ id, url: objectUrl });
      })
      .catch((error: unknown) => {
        console.warn('[fox-oem-studio] Falha ao carregar foto.', error);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, key]);

  return loaded && loaded.id === id ? loaded.url : null;
}
