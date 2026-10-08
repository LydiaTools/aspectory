import test from 'node:test';
import assert from 'node:assert/strict';
import { EXAMPLES, initialLanguage, languageFromPath, translatedExample } from '../src/i18n.js';

test('explicit share language wins, then saved choice, then browser locale', () => {
  assert.equal(initialLanguage('zh', 'en', 'en-US'), 'zh');
  assert.equal(initialLanguage(null, 'en', 'zh-CN'), 'en');
  assert.equal(initialLanguage(null, null, 'zh-TW'), 'zh');
  assert.equal(initialLanguage(null, null, 'en-US'), 'en');
});

test('switching languages translates only the untouched sample', () => {
  assert.deepEqual(translatedExample(EXAMPLES.en, 'en', 'zh'), EXAMPLES.zh);
  assert.deepEqual(translatedExample(EXAMPLES.zh, 'zh', 'en'), EXAMPLES.en);
  assert.equal(translatedExample({ ...EXAMPLES.en, title: 'My own headline' }, 'en', 'zh'), null);
});

test('Chinese share page selects Chinese even after an English saved choice', () => {
  assert.equal(initialLanguage(languageFromPath('/aspectory/zh.html'), 'en', 'en-US'), 'zh');
  assert.equal(languageFromPath('/aspectory/'), null);
});
