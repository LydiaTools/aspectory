import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/space-grotesk/latin-600.css';
import './styles.css';
import './carousel.css';
import './analytics-consent.js';
import { initialLanguage } from './i18n.js';
import { FRAMES, MAX_PHOTOS, MAX_FILE_BYTES, MAX_SOURCE_PIXELS, renderCarouselFrame, imageName, buildCarouselPackage } from './carousel-render.js';

const COPY = {
  en: {
    product: 'Social Post Image Maker', composer: 'Create a graphic', carousel: 'Fit a photo carousel', heading: 'Fit a photo carousel',
    add: 'Add photos', formats: 'PNG, JPEG, WebP · up to 20', local: 'Photos stay in this tab until you close it.',
    frame: 'Frame', background: 'Background', white: 'White', black: 'Black', blur: 'Blurred photo', inset: 'Border',
    download: 'Download PNG ZIP', emptyCount: 'Your photos', count: '{n} photos', clear: 'Clear all', drop: 'Drop photos here', samples: 'Try a sample set',
    source: 'GitHub source', offline: 'Use offline', feedback: 'Feedback', png: 'PNG', remove: 'Remove', earlier: 'Move slide {n} earlier', later: 'Move slide {n} later',
    saveOne: 'Download slide {n}', removeOne: 'Remove slide {n}', slide: 'Slide {n}',
    importing: 'Reading photos…', ready: '{n} photos ready.', packaging: 'Exporting {n}…', saved: 'ZIP downloaded.', imageSaved: 'PNG downloaded.',
    failed: 'Export failed. Try fewer photos or another browser.', empty: 'Add photos before exporting.',
    badType: 'Use PNG, JPEG or WebP.', tooLarge: 'Use a photo no larger than 15 MB.', tooMany: 'The batch is full (20 photos).',
    badImage: 'Could not read this image.', tooManyPixels: 'Choose an image under 48 megapixels.', importFailed: 'No new photos added. Check the files below.',
    archiveTooLarge: 'ZIP exceeds 100 MB. Export fewer photos.', settingsLabel: 'Photo and frame settings', previewLabel: 'Photo order and previews', navLabel: 'Tools'
  },
  zh: {
    product: '出海社媒配图助手', composer: '制作配图', carousel: '批量保留整图', heading: '批量保留整图',
    add: '添加图片', formats: 'PNG、JPEG、WebP · 最多 20 张', local: '图片只保留在当前标签页，关闭后清除。',
    frame: '统一画幅', background: '背景', white: '白色', black: '黑色', blur: '图片模糊背景', inset: '留白',
    download: '下载 PNG 压缩包', emptyCount: '图片预览', count: '{n} 张图片', clear: '全部清除', drop: '把图片拖到这里', samples: '试用示例图片',
    source: 'GitHub 源码', offline: '离线使用', feedback: '反馈', png: 'PNG', remove: '移除', earlier: '将第 {n} 张前移', later: '将第 {n} 张后移',
    saveOne: '下载第 {n} 张', removeOne: '移除第 {n} 张', slide: '第 {n} 张',
    importing: '正在读取图片…', ready: '{n} 张图片已就绪。', packaging: '正在导出第 {n} 张…', saved: '压缩包已下载。', imageSaved: 'PNG 已下载。',
    failed: '导出失败，请减少图片或更换浏览器重试。', empty: '请先添加图片。',
    badType: '请使用 PNG、JPEG 或 WebP。', tooLarge: '请选择小于 15 MB 的图片。', tooMany: '已达到 20 张上限。',
    badImage: '无法读取这张图片。', tooManyPixels: '请选择小于 4800 万像素的图片。', importFailed: '未添加新图片，请检查下方文件。',
    archiveTooLarge: '压缩包超过 100 MB，请减少图片。', settingsLabel: '图片与画幅设置', previewLabel: '图片顺序与预览', navLabel: '工具'
  }
};
const $ = selector => document.querySelector(selector);
let savedLanguage;
try { savedLanguage = JSON.parse(localStorage.getItem('aspectory-draft') || '{}').lang; } catch { /* No saved preference. */ }
const state = {
  lang: initialLanguage(new URLSearchParams(location.search).get('lang'), savedLanguage, navigator.language),
  photos: [], frame: 'portrait', background: 'white', inset: 2, busy: false, errors: [], notice: null
};
let nextId = 1;
const text = (key, n) => COPY[state.lang][key].replace('{n}', n ?? '');
const tick = () => new Promise(resolve => requestAnimationFrame(resolve));

function notice(key, n, error = false) {
  state.notice = key ? { key, n, error } : null;
  $('#status').textContent = key ? text(key, n) : '';
  $('#status').style.color = error ? '#973a25' : '#235a46';
}
function setBusy(value) {
  state.busy = value;
  for (const button of document.querySelectorAll('button, #photos, #frame-settings input, #background')) button.disabled = value;
  $('#download-zip').disabled = value || !state.photos.length;
  if (!value) for (const button of document.querySelectorAll('[data-edge]')) button.disabled = button.dataset.edge === 'true';
}
function settings() { return { frame: state.frame, background: state.background, inset: state.inset }; }

function translate() {
  document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
  document.title = state.lang === 'zh' ? '批量保留整图｜出海社媒配图助手' : 'Carousel Fit | Social Post Image Maker';
  for (const element of document.querySelectorAll('[data-copy]')) element.textContent = text(element.dataset.copy);
  $('#language').textContent = state.lang === 'en' ? '中文' : 'English';
  $('#language').setAttribute('aria-label', state.lang === 'en' ? '切换到中文' : 'Switch to English');
  document.querySelector('.carousel-controls').setAttribute('aria-label', text('settingsLabel'));
  document.querySelector('.photo-workspace').setAttribute('aria-label', text('previewLabel'));
  document.querySelector('.tool-nav').setAttribute('aria-label', text('navLabel'));
  const home = state.lang === 'zh' ? './zh.html' : './';
  for (const id of ['home-link', 'composer-link', 'footer-composer']) $(`#${id}`).href = home;
  renderList();
  if (state.notice) notice(state.notice.key, state.notice.n, state.notice.error);
  renderErrors();
}
function renderErrors() {
  const list = $('#file-errors');
  list.replaceChildren();
  list.hidden = !state.errors.length;
  for (const { name, key } of state.errors) {
    const li = document.createElement('li');
    li.textContent = `${name}: ${text(key)}`;
    list.append(li);
  }
}
function button(label, aria, action, disabled = false) {
  const element = document.createElement('button');
  element.type = 'button'; element.textContent = label;
  element.setAttribute('aria-label', aria);
  element.dataset.action = action;
  element.disabled = disabled;
  element.dataset.edge = String(disabled);
  return element;
}
function renderList(focusId, focusAction) {
  const list = $('#photo-list');
  list.replaceChildren();
  $('#drop-zone').hidden = state.photos.length > 0;
  $('#clear').hidden = !state.photos.length;
  $('#count').textContent = state.photos.length ? text('count', state.photos.length) : text('emptyCount');
  $('#download-zip').disabled = state.busy || !state.photos.length;
  state.photos.forEach((photo, index) => {
    const li = document.createElement('li');
    li.className = 'photo-item'; li.dataset.id = photo.id; li.tabIndex = -1;
    const preview = document.createElement('div'); preview.className = 'slide-preview';
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', `${text('slide', index + 1)}: ${photo.name}`);
    renderCarouselFrame(canvas, photo.image, settings(), 320);
    preview.append(canvas);
    const caption = document.createElement('div'); caption.className = 'slide-caption';
    const number = document.createElement('span'); number.className = 'slide-number'; number.textContent = String(index + 1).padStart(2, '0');
    const name = document.createElement('span'); name.className = 'slide-name'; name.textContent = photo.name; name.title = photo.name;
    caption.append(number, name);
    const controls = document.createElement('div'); controls.className = 'slide-controls';
    const left = button('←', text('earlier', index + 1), 'earlier', index === 0);
    const right = button('→', text('later', index + 1), 'later', index === state.photos.length - 1);
    const remove = button(text('remove'), text('removeOne', index + 1), 'remove'); remove.className = 'remove';
    const save = button(text('png'), text('saveOne', index + 1), 'save'); save.className = 'save-one';
    left.addEventListener('click', () => move(index, -1));
    right.addEventListener('click', () => move(index, 1));
    remove.addEventListener('click', () => {
      if (state.busy) return;
      state.photos.splice(index, 1); photo.image.width = photo.image.height = 0;
      notice(); renderList(state.photos[Math.min(index, state.photos.length - 1)]?.id, 'remove');
    });
    save.addEventListener('click', () => exportOne(index));
    controls.append(left, right, remove, save);
    li.append(preview, caption, controls); list.append(li);
  });
  if (focusId) {
    const item = list.querySelector(`[data-id="${focusId}"]`);
    const control = item?.querySelector(`[data-action="${focusAction}"]:not(:disabled)`);
    (control || item)?.focus();
  }
}
function move(index, direction) {
  if (state.busy || index + direction < 0 || index + direction >= state.photos.length) return;
  const photo = state.photos[index];
  [state.photos[index], state.photos[index + direction]] = [state.photos[index + direction], photo];
  notice(); renderList(photo.id, direction < 0 ? 'earlier' : 'later');
}

async function decodePhoto(file) {
  if (file.size > MAX_FILE_BYTES) throw new Error('tooLarge');
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) && !(file.type === '' && /\.(png|jpe?g|webp)$/i.test(file.name))) throw new Error('badType');
  let decoded;
  let objectUrl;
  try {
    if (typeof createImageBitmap === 'function') decoded = await createImageBitmap(file);
    else {
      objectUrl = URL.createObjectURL(file);
      decoded = new Image(); decoded.src = objectUrl;
      await decoded.decode();
    }
    const width = decoded.naturalWidth || decoded.width;
    const height = decoded.naturalHeight || decoded.height;
    if (!width || !height) throw new Error('badImage');
    if (width * height > MAX_SOURCE_PIXELS) throw new Error('tooManyPixels');
    const scale = Math.min(1, 2048 / Math.max(width, height));
    const image = document.createElement('canvas');
    image.width = Math.max(1, Math.round(width * scale)); image.height = Math.max(1, Math.round(height * scale));
    const ctx = image.getContext('2d'); ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(decoded, 0, 0, image.width, image.height);
    return { image, name: file.name, id: nextId++ };
  } catch (error) {
    throw new Error(error.message === 'tooManyPixels' ? 'tooManyPixels' : 'badImage');
  } finally {
    decoded?.close?.();
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}
async function addPhotos(files) {
  if (state.busy || !files.length) return;
  setBusy(true); state.errors = []; renderErrors(); notice('importing');
  let added = 0;
  const selected = files.slice(0, MAX_PHOTOS);
  if (files.length > MAX_PHOTOS) state.errors.push({ name: '20+', key: 'tooMany' });
  for (const file of selected) {
    if (state.photos.length >= MAX_PHOTOS) { state.errors.push({ name: file.name, key: 'tooMany' }); break; }
    try {
      state.photos.push(await decodePhoto(file)); added++;
    } catch (error) { state.errors.push({ name: file.name, key: error.message in COPY.en ? error.message : 'badImage' }); }
    await tick();
  }
  renderList(); renderErrors(); setBusy(false);
  notice(added ? 'ready' : 'importFailed', state.photos.length, !added);
}

function png(canvas) {
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('failed')), 'image/png'));
}
function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename;
  document.body.append(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
async function exportOne(index) {
  if (state.busy) return;
  setBusy(true);
  const canvas = document.createElement('canvas');
  try {
    renderCarouselFrame(canvas, state.photos[index].image, settings());
    saveBlob(await png(canvas), imageName(index, state.frame));
    notice('imageSaved');
  } catch { notice('failed', null, true); }
  finally { canvas.width = canvas.height = 0; setBusy(false); }
}
async function exportZip() {
  if (state.busy) return;
  if (!state.photos.length) return notice('empty', null, true);
  setBusy(true);
  const outputs = [];
  let bytes = 0;
  const canvas = document.createElement('canvas');
  try {
    for (let index = 0; index < state.photos.length; index++) {
      notice('packaging', index + 1); await tick();
      renderCarouselFrame(canvas, state.photos[index].image, settings());
      const blob = await png(canvas); bytes += blob.size;
      if (bytes > 100_000_000) throw new Error('archiveTooLarge');
      outputs.push(new Uint8Array(await blob.arrayBuffer()));
    }
    saveBlob(new Blob([buildCarouselPackage(outputs, state.frame)], { type: 'application/zip' }), `carousel-${FRAMES[state.frame].slug}.zip`);
    notice('saved');
  } catch (error) { notice(error.message === 'archiveTooLarge' ? 'archiveTooLarge' : 'failed', null, true); }
  finally { canvas.width = canvas.height = 0; setBusy(false); }
}

function sample(width, height, title, base, accent) {
  const image = document.createElement('canvas'); image.width = width; image.height = height;
  const ctx = image.getContext('2d');
  ctx.fillStyle = base; ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(width * .5, height * .47, Math.min(width, height) * .24, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.font = `600 ${Math.round(Math.min(width, height) * .075)}px Arial`; ctx.textAlign = 'center';
  ctx.fillText(title, width / 2, height * .48);
  const side = Math.min(width, height) * .15;
  ['#e44c4c', '#24a269', '#397ce0', '#e8aa2e'].forEach((color, index) => {
    const x = index % 2 ? width - side : 0; const y = index < 2 ? 0 : height - side;
    ctx.fillStyle = color; ctx.fillRect(x, y, side, side);
    ctx.fillStyle = '#ffffff'; ctx.font = `700 ${side * .5}px Arial`; ctx.fillText(String(index + 1), x + side / 2, y + side * .67);
  });
  return { id: nextId++, image, name: `${title.toLowerCase()}-sample.png` };
}

$('#photos').addEventListener('change', async event => {
  const files = Array.from(event.target.files || []); event.target.value = ''; await addPhotos(files);
});
const workspace = document.querySelector('.carousel-workspace');
workspace.addEventListener('dragover', event => { event.preventDefault(); document.querySelector('.photo-workspace').classList.add('is-over'); });
workspace.addEventListener('dragleave', event => { if (!workspace.contains(event.relatedTarget)) document.querySelector('.photo-workspace').classList.remove('is-over'); });
workspace.addEventListener('drop', event => {
  event.preventDefault(); document.querySelector('.photo-workspace').classList.remove('is-over');
  addPhotos(Array.from(event.dataTransfer.files));
});
for (const name of ['dragover', 'drop']) document.addEventListener(name, event => event.preventDefault());
for (const input of document.querySelectorAll('[name="frame"]')) input.addEventListener('change', event => { state.frame = event.target.value; notice(); renderList(); });
$('#background').addEventListener('change', event => { state.background = event.target.value; notice(); renderList(); });
$('#inset').addEventListener('input', event => { state.inset = Number(event.target.value); $('#inset-value').textContent = `${state.inset}%`; notice(); renderList(); });
$('#clear').addEventListener('click', () => {
  if (state.busy) return;
  for (const photo of state.photos) photo.image.width = photo.image.height = 0;
  state.photos = []; state.errors = []; notice(); renderErrors(); renderList(); $('#photos').focus();
});
$('#samples').addEventListener('click', () => {
  if (state.busy || state.photos.length) return;
  state.photos = [sample(1200, 720, 'Landscape', '#e5ece2', '#42694f'), sample(800, 800, 'Square', '#f2dfd6', '#a95b48'), sample(640, 1040, 'Portrait', '#dae5ef', '#386089')];
  notice('ready', state.photos.length); renderList();
});
$('#download-zip').addEventListener('click', exportZip);
$('#language').addEventListener('click', () => {
  state.lang = state.lang === 'en' ? 'zh' : 'en';
  const url = new URL(location.href); url.searchParams.set('lang', state.lang);
  try { history.replaceState(null, '', url); } catch { /* Language switching also works from local files. */ }
  translate();
});
translate();
