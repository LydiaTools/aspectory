import test from 'node:test';
import assert from 'node:assert/strict';
import { PLATFORMS, STYLE_NAMES, normalizeContent, wrapLines } from '../src/render.js';
import { unzipSync } from 'fflate';
import { buildPngPackage } from '../src/export-package.js';

test('platform presets use distinct, exact pixel sizes', () => {
  assert.deepEqual(Object.fromEntries(Object.entries(PLATFORMS).map(([key, value]) => [key, [value.width, value.height]])), {
    pinterest: [1000, 1500], instagram: [1080, 1350], lemon8: [1080, 1440], facebook: [1080, 1080]
  });
  assert.equal(Object.keys(STYLE_NAMES).length, 4);
});

test('source URLs remain intact as one unspaced word', () => {
  const ctx = { measureText: value => ({ width: value.length * 10 }) };
  assert.deepEqual(wrapLines(ctx, 'covercalcpro.com', 400), ['covercalcpro.com']);
  assert.deepEqual(wrapLines(ctx, 'How many bags do you need?', 90), ['How many', 'bags do', 'you need?']);
});

test('continuous Chinese copy can wrap without inserted spaces', () => {
  const ctx = { measureText: value => ({ width: value.length * 10 }) };
  assert.deepEqual(wrapLines(ctx, '花园需要多少袋覆盖物', 40), ['花园需要', '多少袋覆', '盖物']);
  assert.deepEqual(wrapLines(ctx, '10×10 英尺的花坛需要多少袋', 80), ['10×10 英尺', '的花坛需要多少袋']);
  assert.ok(wrapLines(ctx, '花坛长宽各10英尺，12.5袋要向上取整。', 90).every(line => !/^[，。！？；：、]/.test(line)));
});

test('content normalization caps input and preserves factual characters', () => {
  const result = normalizeContent({ title: `  ${'a'.repeat(150)}  `, body: '  25 ft³ ÷ 2 ft³ = 12.5  ', figure: '13 bags' });
  assert.equal(result.title.length, 110);
  assert.equal(result.body, '25 ft³ ÷ 2 ft³ = 12.5');
  assert.equal(result.figure, '13 bags');
});

test('four-platform package contains one independently named image per destination', () => {
  const outputs = Object.keys(PLATFORMS).map((platform, index) => ({ platform, bytes: new Uint8Array([137, 80, 78, 71, index]) }));
  const archive = unzipSync(buildPngPackage('field', outputs));
  assert.deepEqual(Object.keys(archive).sort(), Object.keys(PLATFORMS).map(platform => `aspectory-${platform}-field.png`).sort());
  outputs.forEach(({ platform, bytes }) => assert.deepEqual(archive[`aspectory-${platform}-field.png`], bytes));
  assert.throws(() => buildPngPackage('field', outputs.slice(0, 3)), /four platforms/);
});
