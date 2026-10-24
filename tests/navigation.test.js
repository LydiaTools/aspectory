import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('both composer entry points provide the carousel navigation required by their shared script', async () => {
  for (const [file, language] of [['index.html', 'en'], ['zh.html', 'zh']]) {
    const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
    const anchor = html.match(/<a\b[^>]*\bid="carousel-link"[^>]*>/)?.[0];
    assert.ok(anchor, `${file} is missing the shared navigation element`);
    assert.match(anchor, new RegExp(`href="\\./carousel\\.html\\?lang=${language}"`));
  }
});
