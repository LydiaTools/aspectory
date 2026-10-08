import { zipSync } from 'fflate';
import { PLATFORMS, STYLE_NAMES } from './render.js';

export function buildPngPackage(style, outputs) {
  if (!STYLE_NAMES[style]) throw new Error(`Unknown style: ${style}`);
  if (outputs.length !== Object.keys(PLATFORMS).length) throw new Error('The package needs all four platforms.');
  const files = {};
  for (const { platform, bytes } of outputs) {
    if (!PLATFORMS[platform] || !(bytes instanceof Uint8Array)) throw new Error('Invalid package image.');
    const name = `social-post-image-maker-${platform}-${style}.png`;
    if (files[name]) throw new Error(`Duplicate platform: ${platform}`);
    files[name] = bytes;
  }
  return zipSync(files, { level: 0 });
}
