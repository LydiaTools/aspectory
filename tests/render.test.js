import test from 'node:test';
import assert from 'node:assert/strict';
import { PLATFORMS, STYLE_NAMES, normalizeContent, wrapLines } from '../src/render.js';

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
});

test('content normalization caps input and preserves factual characters', () => {
  const result = normalizeContent({ title: `  ${'a'.repeat(150)}  `, body: '  25 ft³ ÷ 2 ft³ = 12.5  ', figure: '13 bags' });
  assert.equal(result.title.length, 110);
  assert.equal(result.body, '25 ft³ ÷ 2 ft³ = 12.5');
  assert.equal(result.figure, '13 bags');
});
