/**
 * Redimensiona e comprime fotos no navegador antes de salvar.
 * Foto de celular (3–8 MB) vira ~200–400 KB em WebP/JPEG com 1920 px no lado maior.
 */

export class ImageProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImageProcessingError';
  }
}

export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
  mimeType: string;
}

export interface ProcessImageOptions {
  maxDimension?: number;
  quality?: number;
}

const DEFAULT_MAX_DIMENSION = 1920;
const DEFAULT_QUALITY = 0.85;
const MAX_INPUT_BYTES = 40 * 1024 * 1024;

export function readAsDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new ImageProcessingError('Não foi possível ler o arquivo.'));
    };
    reader.onerror = () => reject(new ImageProcessingError('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(blob);
  });
}

export function dataURLToBlob(dataUrl: string): Blob {
  const match = /^data:([^;,]+)(;base64)?,(.*)$/s.exec(dataUrl);
  if (!match) throw new ImageProcessingError('Imagem do backup em formato inválido.');
  const mimeType = match[1] ?? 'application/octet-stream';
  const isBase64 = Boolean(match[2]);
  const payload = match[3] ?? '';
  if (!isBase64) return new Blob([decodeURIComponent(payload)], { type: mimeType });
  const binary = atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new Blob([bytes], { type: mimeType });
}

/** Base64 puro (sem o prefixo data:), usado no envio para o Gemini. */
export async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl = await readAsDataURL(blob);
  return dataUrl.slice(dataUrl.indexOf(',') + 1);
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new ImageProcessingError('Formato de imagem não suportado por este navegador. Tente JPG ou PNG.'));
    image.src = src;
  });
}

type DecodedImage = { source: CanvasImageSource; width: number; height: number; release: () => void };

async function decodeImage(file: Blob): Promise<DecodedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
    } catch {
      // Alguns navegadores não decodificam certos formatos via bitmap: tenta <img>.
    }
  }
  const dataUrl = await readAsDataURL(file);
  const image = await loadImageElement(dataUrl);
  return { source: image, width: image.naturalWidth, height: image.naturalHeight, release: () => undefined };
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

export function fitWithin(width: number, height: number, maxDimension: number): { width: number; height: number } {
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export async function processImageFile(file: File, options: ProcessImageOptions = {}): Promise<ProcessedImage> {
  if (!file.type.startsWith('image/')) {
    throw new ImageProcessingError('Envie um arquivo de imagem (JPG, PNG ou WebP).');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageProcessingError('Imagem acima de 40 MB. Exporte uma versão menor e tente de novo.');
  }

  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const quality = options.quality ?? DEFAULT_QUALITY;
  const decoded = await decodeImage(file);

  try {
    if (decoded.width === 0 || decoded.height === 0) {
      throw new ImageProcessingError('A imagem parece estar vazia ou corrompida.');
    }
    const target = fitWithin(decoded.width, decoded.height, maxDimension);
    const canvas = document.createElement('canvas');
    canvas.width = target.width;
    canvas.height = target.height;
    const context = canvas.getContext('2d');
    if (!context) throw new ImageProcessingError('O navegador bloqueou o processamento da imagem.');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(decoded.source, 0, 0, target.width, target.height);

    // WebP quando suportado (Safari antigo devolve PNG: aí usamos JPEG).
    let blob = await canvasToBlob(canvas, 'image/webp', quality);
    if (!blob || blob.type !== 'image/webp') blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    if (!blob) throw new ImageProcessingError('Não foi possível comprimir a imagem.');

    return { blob, width: target.width, height: target.height, mimeType: blob.type };
  } finally {
    decoded.release();
  }
}
