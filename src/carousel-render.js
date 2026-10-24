import { zipSync } from 'fflate';

export const FRAMES = {
  portrait: { width: 1080, height: 1350, ratio: '4:5', slug: '4x5' },
  square: { width: 1080, height: 1080, ratio: '1:1', slug: '1x1' },
  tall: { width: 1080, height: 1440, ratio: '3:4', slug: '3x4' }
};
export const MAX_PHOTOS = 20;
export const MAX_FILE_BYTES = 15_000_000;
export const MAX_SOURCE_PIXELS = 48_000_000;

export function containRect(sourceWidth, sourceHeight, width, height, inset = 0) {
  if (![sourceWidth, sourceHeight, width, height].every(n => Number.isFinite(n) && n > 0)) {
    throw new Error('Invalid image dimensions.');
  }
  if (!Number.isFinite(inset) || inset < 0 || inset > 12) throw new Error('Invalid inset.');
  const padding = Math.round(Math.min(width, height) * inset / 100);
  const scale = Math.min((width - padding * 2) / sourceWidth, (height - padding * 2) / sourceHeight);
  const w = Math.max(1, Math.floor(sourceWidth * scale));
  const h = Math.max(1, Math.floor(sourceHeight * scale));
  return { x: Math.floor((width - w) / 2), y: Math.floor((height - h) / 2), width: w, height: h };
}

export function renderCarouselFrame(canvas, image, { frame = 'portrait', background = 'white', inset = 2 } = {}, previewWidth) {
  const spec = FRAMES[frame];
  if (!spec || !['white', 'black', 'blur'].includes(background)) throw new Error('Invalid frame settings.');
  const width = previewWidth || spec.width;
  const height = Math.round(width * spec.height / spec.width);
  const rect = containRect(image.width, image.height, width, height, inset);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background === 'black' ? '#000000' : '#ffffff';
  ctx.fillRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  if (background === 'blur') {
    const radius = Math.max(8, width * .035);
    const scale = Math.max((width + radius * 4) / image.width, (height + radius * 4) / image.height);
    ctx.save();
    ctx.filter = `blur(${radius}px)`;
    ctx.drawImage(image, (width - image.width * scale) / 2, (height - image.height * scale) / 2, image.width * scale, image.height * scale);
    ctx.restore();
    ctx.fillStyle = '#00000022';
    ctx.fillRect(0, 0, width, height);
  }
  // The foreground always uses the complete source rectangle, never a crop.
  ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  return rect;
}

export function imageName(index, frame) {
  if (!Number.isInteger(index) || index < 0 || index >= MAX_PHOTOS || !FRAMES[frame]) throw new Error('Invalid image order.');
  return `${String(index + 1).padStart(2, '0')}-carousel-${FRAMES[frame].slug}.png`;
}

export function buildCarouselPackage(outputs, frame) {
  if (!Array.isArray(outputs) || !outputs.length || outputs.length > MAX_PHOTOS) throw new Error('Invalid photo count.');
  const files = {};
  outputs.forEach((bytes, index) => {
    if (!(bytes instanceof Uint8Array) || !bytes.length) throw new Error('Invalid image data.');
    files[imageName(index, frame)] = bytes;
  });
  return zipSync(files, { level: 0 });
}
