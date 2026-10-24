import test from 'node:test';
import assert from 'node:assert/strict';
import { unzipSync } from 'fflate';
import { FRAMES, containRect, imageName, buildCarouselPackage } from '../src/carousel-render.js';

test('mixed source ratios fit inside every frame and retain the source ratio', () => {
  for (const [sw, sh] of [[1200, 720], [800, 800], [640, 1040], [1, 12000], [12000, 1]]) {
    for (const { width, height } of Object.values(FRAMES)) {
      for (const inset of [0, 2, 12]) {
        const r = containRect(sw, sh, width, height, inset);
        const border = Math.round(Math.min(width, height) * inset / 100);
        assert.ok(r.x >= border && r.y >= border);
        assert.ok(r.x + r.width <= width - border && r.y + r.height <= height - border);
        assert.ok(Math.abs(r.width - sw * Math.min((width - 2 * border) / sw, (height - 2 * border) / sh)) <= 1);
        assert.ok(Math.abs(r.height - sh * Math.min((width - 2 * border) / sw, (height - 2 * border) / sh)) <= 1);
      }
    }
  }
});

test('invalid dimensions or inset cannot produce an export rectangle', () => {
  for (const bad of [0, -1, NaN, Infinity]) assert.throws(() => containRect(bad, 800, 1080, 1350));
  for (const bad of [-1, 13, NaN]) assert.throws(() => containRect(800, 800, 1080, 1350, bad));
});

test('ZIP numbering preserves supplied order and does not expose input filenames', () => {
  const first = new Uint8Array([1, 2, 3]);
  const second = new Uint8Array([4, 5, 6]);
  const files = unzipSync(buildCarouselPackage([second, first], 'portrait'));
  assert.deepEqual(Object.keys(files), ['01-carousel-4x5.png', '02-carousel-4x5.png']);
  assert.deepEqual(files['01-carousel-4x5.png'], second);
  assert.deepEqual(files['02-carousel-4x5.png'], first);
  assert.equal(imageName(19, 'tall'), '20-carousel-3x4.png');
});

test('empty, unbounded or invalid archives fail before download', () => {
  assert.throws(() => buildCarouselPackage([], 'portrait'));
  assert.throws(() => buildCarouselPackage(Array(21).fill(new Uint8Array([1])), 'portrait'));
  assert.throws(() => buildCarouselPackage([new Uint8Array()], 'square'));
  assert.throws(() => buildCarouselPackage([new Uint8Array([1])], 'unknown'));
});
