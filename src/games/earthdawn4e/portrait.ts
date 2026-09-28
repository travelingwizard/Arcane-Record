export const EARTHDAWN_PORTRAIT_MAX_BYTES = 5 * 1024 * 1024;
export const EARTHDAWN_PORTRAIT_MAX_DIMENSION = 1024;

const acceptedTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

export type ProcessedEarthdawnPortrait = {
  dataUrl: string;
  mimeType: 'image/webp';
  width: number;
  height: number;
  source: 'file' | 'url';
};

export async function processEarthdawnPortrait(
  blob: Blob,
  source: ProcessedEarthdawnPortrait['source'],
): Promise<ProcessedEarthdawnPortrait> {
  if (!acceptedTypes.has(blob.type))
    throw new Error('Choose a PNG, JPEG, or WebP image.');
  if (blob.size > EARTHDAWN_PORTRAIT_MAX_BYTES)
    throw new Error('Portrait images may not exceed 5 MB.');

  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = 'async';
    image.src = objectUrl;
    await image.decode();
    const scale = Math.min(
      1,
      EARTHDAWN_PORTRAIT_MAX_DIMENSION /
        Math.max(image.naturalWidth, image.naturalHeight),
    );
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser cannot process portraits.');
    context.drawImage(image, 0, 0, width, height);
    return {
      dataUrl: canvas.toDataURL('image/webp', 0.85),
      mimeType: 'image/webp',
      width,
      height,
      source,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function downloadEarthdawnPortrait(url: string) {
  let response: Response;
  try {
    response = await fetch(url, { mode: 'cors', credentials: 'omit' });
  } catch {
    throw new Error(
      'The portrait could not be downloaded. The image host may block browser downloads.',
    );
  }
  if (!response.ok)
    throw new Error(`The portrait download failed (${response.status}).`);
  const blob = await response.blob();
  return processEarthdawnPortrait(blob, 'url');
}
