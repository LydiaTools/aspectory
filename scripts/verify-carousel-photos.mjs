import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { unzipSync } from 'fflate';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = resolve(root, 'dist');
const output = join(root, 'runs/photo-demo');
const sources = JSON.parse(await readFile(join(root, 'public/examples/carousel-photos/sources.json'), 'utf8'));
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const commit = process.env.GITHUB_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
assert.match(commit, /^[a-f0-9]{40}$/);
assert.equal(sources.length, 3);
await mkdir(output, { recursive: true });
for (const source of sources) {
  assert.equal(source.license, 'CC0');
  assert.equal(source.file, source.file.split('/').at(-1));
  assert.equal(sha256(await readFile(join(root, 'public/examples/carousel-photos', source.file))), source.sha256);
}
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    const file = resolve(dist, '.' + (pathname === '/' ? '/index.html' : pathname));
    assert.ok(file.startsWith(dist + sep));
    const bytes = await readFile(file);
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream' });
    response.end(bytes);
  } catch { response.writeHead(404); response.end(); }
});
await new Promise((resolve, reject) => {
  server.once('error', reject); server.listen(0, '127.0.0.1', resolve);
});
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1040 }, locale: 'en-US', acceptDownloads: true });
  await context.addInitScript(() => {
    if (location.protocol === 'http:' || location.protocol === 'https:')
      localStorage.setItem('lydiatools.analytics-consent.v1', 'rejected');
  });
  const page = await context.newPage();
  const errors = [], processingRequests = [];
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto(`http://127.0.0.1:${server.address().port}/carousel.html?lang=en`, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200);
  await page.evaluate(() => document.fonts.ready.then(() => true));
  page.on('request', request => {
    if (/^https?:/.test(request.url())) processingRequests.push({ method: request.method(), url: request.url() });
  });
  await page.locator('#photos').setInputFiles(sources.map(source => join(root, 'public/examples/carousel-photos', source.file)));
  await page.waitForFunction(() => !document.querySelector('#photos').disabled && document.querySelectorAll('.photo-item').length === 3);
  assert.equal(await page.locator('input[name=frame]:checked').inputValue(), 'portrait');
  assert.equal(await page.locator('#background').inputValue(), 'white');
  assert.equal(await page.locator('#inset').inputValue(), '2');
  assert.equal(await page.locator('h1').innerText(), 'Fit a photo carousel');
  await page.screenshot({ path: join(output, 'carousel-photos-en.jpg'), fullPage: true, type: 'jpeg', quality: 92 });
  await page.locator('#language').click();
  await page.evaluate(() => document.fonts.ready.then(() => true));
  assert.equal(await page.locator('.photo-item').count(), 3);
  assert.equal(await page.locator('h1').innerText(), '批量保留整图');
  await page.screenshot({ path: join(output, 'carousel-photos-zh.jpg'), fullPage: true, type: 'jpeg', quality: 92 });
  const pending = page.waitForEvent('download');
  await page.locator('#download-zip').click();
  const download = await pending;
  assert.equal(await download.failure(), null);
  await download.saveAs(join(output, 'actual-photo-exports.zip'));
  const archive = unzipSync(await readFile(join(output, 'actual-photo-exports.zip')));
  assert.deepEqual(Object.keys(archive), ['01-carousel-4x5.png', '02-carousel-4x5.png', '03-carousel-4x5.png']);
  const results = [], previews = [];
  for (const [index, name] of Object.keys(archive).entries()) {
    const bytes = Buffer.from(archive[name]);
    await writeFile(join(output, name), bytes);
    const sourceBytes = await readFile(join(root, 'public/examples/carousel-photos', sources[index].file));
    const compared = await page.evaluate(async ({ source, png }) => {
      const decode = (base64, type) => createImageBitmap(new Blob([Uint8Array.from(atob(base64), x => x.charCodeAt(0))], { type }));
      const original = await decode(source, 'image/jpeg'), exported = await decode(png, 'image/png');
      const width = exported.width, height = exported.height, border = 22;
      const scale = Math.min((width - border * 2) / original.width, (height - border * 2) / original.height);
      const w = Math.floor(original.width * scale), h = Math.floor(original.height * scale);
      const x = Math.floor((width - w) / 2), y = Math.floor((height - h) / 2);
      const expected = document.createElement('canvas'); expected.width = w; expected.height = h;
      const e = expected.getContext('2d'); e.imageSmoothingQuality = 'high'; e.drawImage(original, 0, 0, w, h);
      const actual = document.createElement('canvas'); actual.width = width; actual.height = height;
      const a = actual.getContext('2d'); a.drawImage(exported, 0, 0);
      const before = e.getImageData(0, 0, w, h).data, after = a.getImageData(x, y, w, h).data;
      let total = 0;
      for (let i = 0; i < before.length; i++) if (i % 4 !== 3) total += Math.abs(before[i] - after[i]);
      const result = { source: [original.width, original.height], exported: [width, height],
        rectangle: [x, y, w, h], meanRGBError: total / (w * h * 3), outerPixel: Array.from(a.getImageData(2, 2, 1, 1).data) };
      original.close(); exported.close(); return result;
    }, { source: sourceBytes.toString('base64'), png: bytes.toString('base64') });
    assert.deepEqual(compared.source, sources[index].dimensions);
    assert.deepEqual(compared.exported, [1080, 1350]);
    assert.ok(compared.meanRGBError <= 1, JSON.stringify(compared));
    assert.deepEqual(compared.outerPixel, [255, 255, 255, 255]);
    const preview = await context.newPage();
    await preview.setViewportSize({ width: 520, height: 650 });
    await preview.setContent(`<html><body style="margin:0"><img style="display:block;width:520px;height:650px" src="data:image/png;base64,${bytes.toString('base64')}"></body></html>`);
    await preview.locator('img').evaluate(image => image.decode());
    const previewBytes = await preview.locator('img').screenshot({ path: join(output, `preview-${index + 1}.jpg`), type: 'jpeg', quality: 92 });
    previews.push(previewBytes);
    await preview.close();
    results.push({ sourceFile: sources[index].file, sourceSHA256: sources[index].sha256,
      file: name, bytes: bytes.length, sha256: sha256(bytes), ...compared });
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(processingRequests, []);
  let card = await readFile(join(root, 'docs/carousel-photo-card.html'), 'utf8');
  previews.forEach((bytes, index) => { card = card.replace(`examples/photo-carousel/preview-${index + 1}.jpg`, 'data:image/jpeg;base64,' + bytes.toString('base64')); });
  const cardPage = await context.newPage();
  await cardPage.setViewportSize({ width: 1200, height: 630 });
  await cardPage.setContent(card);
  await cardPage.locator('img').evaluateAll(images => Promise.all(images.map(image => image.decode())));
  await cardPage.evaluate(() => document.fonts.ready.then(() => true));
  const size = await cardPage.evaluate(() => ({ width: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight }));
  assert.deepEqual(size, { width: 1200, height: 630 });
  await cardPage.screenshot({ path: join(output, 'carousel-photo-preview.jpg'), type: 'jpeg', quality: 94 });
  const files = {};
  for (const name of ['carousel-photos-en.jpg', 'carousel-photos-zh.jpg', 'preview-1.jpg', 'preview-2.jpg', 'preview-3.jpg', 'carousel-photo-preview.jpg']) {
    const bytes = await readFile(join(output, name)); files[name] = { bytes: bytes.length, sha256: sha256(bytes) };
  }
  const report = { capturedAt: new Date().toISOString(), status: 'passed', sourceCommit: commit,
    source: 'Production dist preview on CI loopback; no signed-in browser or user photos.',
    browser: await browser.version(), platform: process.platform, settings: { frame: '4:5', background: 'white', inset: '2%' },
    outputs: results, files, pageErrors: errors, imageProcessingHTTPRequests: processingRequests,
    note: 'Actual application exports and UI captures of credited CC0 inputs. Preview JPEGs and promotional montage are derived from those PNGs. Not outside adoption, platform posting or campaign results.' };
  await writeFile(join(output, 'photo-demo-results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  await writeFile(join(output, 'failure.json'), JSON.stringify({ capturedAt: new Date().toISOString(), sourceCommit: commit, status: 'failed', message: error.message }, null, 2) + '\n');
  throw error;
} finally {
  if (browser) await browser.close();
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
