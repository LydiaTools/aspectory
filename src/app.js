import '@fontsource/dm-sans/latin-400.css';
import '@fontsource/dm-sans/latin-500.css';
import '@fontsource/dm-sans/latin-600.css';
import '@fontsource/dm-sans/latin-700.css';
import '@fontsource/dm-serif-display/latin-400.css';
import '@fontsource/dm-serif-display/latin-400-italic.css';
import '@fontsource/space-grotesk/latin-400.css';
import '@fontsource/space-grotesk/latin-500.css';
import '@fontsource/space-grotesk/latin-600.css';
import '@fontsource/space-grotesk/latin-700.css';
import './styles.css';
import { PLATFORMS, STYLE_NAMES, renderPost } from './render.js';
import { buildPngPackage } from './export-package.js';
import { EXAMPLES, initialLanguage, translatedExample } from './i18n.js';

const STRINGS = {
  en: {
    productName: 'Social Post Image Maker', pageTitle: 'Social Post Image Maker | Pinterest, Instagram, Lemon8 & Facebook',
    homeLabel: 'Social Post Image Maker home', styleGroup: 'Visual style', targetGroup: 'Export target', previewRegion: 'Live preview', canvasLabel: 'Generated post preview',
    local: 'Made on your device. No account.', overline: 'Images for the feeds where you post',
    heading: 'One useful idea.<br><em>Four social-ready images.</em>',
    intro: 'Turn a fact, lesson, or product insight into a visual post. Choose a style, check each platform, and download the set.',
    contentHeading: 'The message', brand: 'Brand / byline', eyebrow: 'Category', title: 'Headline',
    body: 'Supporting insight', figure: 'Key figure', figureLabel: 'Figure label', cta: 'Footer / next step',
    url: 'Source / website', artHeading: 'Art direction', field: 'Field notes',
    fieldDesc: 'quiet, editorial, precise', photo: 'Photo story', photoDesc: 'image-led, warm, human',
    data: 'Data sheet', dataDesc: 'clear numbers and context', poster: 'Bright poster',
    posterDesc: 'big type, strong contrast', upload: 'Add your own photo',
    uploadHelp: 'Optional. Used by Photo story; stays in this browser.', destination: 'Destination',
    formatNote: "Canvas sizes are export presets, not promises of reach. Check each platform's preview before posting.",
    live: 'Live canvas', downloadPng: 'Download PNG', downloadJpeg: 'JPEG', downloadAll: 'All 4 PNGs · ZIP',
    privacy: 'No uploads, no tracking, no automatic posting. Your image and text remain in the browser.',
    sourceLink: 'Source on GitHub', feedbackLink: 'Share feedback',
    addTitle: 'Add a headline before exporting.', uploaded: 'Photo ready', tooLarge: 'Choose an image under 10 MB.',
    badImage: 'Could not read this image. Try PNG, JPEG or WebP.', saved: 'Image downloaded.',
    packaging: 'Building four images on your device…', packageSaved: 'Four platform images downloaded as a ZIP.',
    failed: 'Export failed. Try another browser.', shortened: 'Some text was shortened in the image. Edit the copy or choose a taller canvas.'
  },
  zh: {
    productName: '海外社媒配图工坊', pageTitle: '海外社媒配图工坊｜Pinterest、Instagram、Lemon8、Facebook',
    homeLabel: '海外社媒配图工坊首页', styleGroup: '视觉风格', targetGroup: '导出平台', previewRegion: '实时预览', canvasLabel: '生成的帖子图片预览',
    local: '本机制作，无需账号', overline: 'Pinterest · Instagram · Lemon8 · Facebook',
    heading: '一份内容，<br><em>四套社媒配图。</em>',
    intro: '为 Pinterest、Instagram、Lemon8、Facebook 分别排版。中文界面也能做英文配图：请用目标读者的语言填写内容，逐平台预览后下载；工具不会自动翻译。',
    contentHeading: '内容', brand: '品牌／署名', eyebrow: '栏目分类', title: '标题',
    body: '补充说明', figure: '核心数字', figureLabel: '数字说明', cta: '底部引导语',
    url: '来源／网站', artHeading: '视觉风格', field: '田野笔记',
    fieldDesc: '安静、编辑感、准确', photo: '照片叙事', photoDesc: '图片主导、温暖自然',
    data: '数据手册', dataDesc: '数字和背景一目了然', poster: '醒目海报',
    posterDesc: '大字与鲜明对比', upload: '添加自己的照片',
    uploadHelp: '可选，仅照片叙事使用；图片留在浏览器里。', destination: '发布平台',
    formatNote: '这些是导出尺寸预设，不保证流量。发布前请在平台预览。',
    live: '实时画布', downloadPng: '下载 PNG', downloadJpeg: 'JPEG', downloadAll: '四平台 PNG 打包下载',
    privacy: '不上传、不跟踪、不自动发布。文字与照片保留在本机浏览器中。',
    sourceLink: 'GitHub 源码', feedbackLink: '反馈使用体验',
    addTitle: '请先填写标题，再导出。', uploaded: '照片已载入', tooLarge: '请选择小于 10 MB 的图片。',
    badImage: '无法读取图片，请换用 PNG、JPEG 或 WebP。', saved: '图片已下载。',
    packaging: '正在本机生成四张图片…', packageSaved: '四个平台的图片已打包下载。',
    failed: '导出失败，请更换浏览器重试。', shortened: '图片中有文字被缩短，请精简文案或选择更高的画布。'
  }
};

const fields = ['brand', 'eyebrow', 'title', 'body', 'figure', 'figureLabel', 'cta', 'url'];
const canvas = document.querySelector('#preview');
const status = document.querySelector('#status');
const state = { platform: 'pinterest', style: 'field', image: null, lang: 'en' };
const saved = (() => { try { return JSON.parse(localStorage.getItem('aspectory-draft') || '{}'); } catch { return {}; } })();
for (const id of fields) if (typeof saved[id] === 'string') document.getElementById(id).value = saved[id];
if (saved.platform && PLATFORMS[saved.platform]) state.platform = saved.platform;
if (saved.style && STYLE_NAMES[saved.style]) state.style = saved.style;
state.lang = initialLanguage(new URLSearchParams(location.search).get('lang'), saved.lang, navigator.language);
for (const from of ['en', 'zh']) {
  const current = Object.fromEntries(fields.map(id => [id, document.getElementById(id).value]));
  const example = translatedExample(current, from, state.lang);
  if (example) { for (const id of fields) document.getElementById(id).value = example[id]; break; }
}

function content() { return Object.fromEntries(fields.map(id => [id, document.getElementById(id).value])); }
function save() {
  try { localStorage.setItem('aspectory-draft', JSON.stringify({ ...content(), platform: state.platform, style: state.style, lang: state.lang })); }
  catch { /* Preview and exports still work when storage is unavailable. */ }
}
function setStatus(message = '', isError = false) {
  status.textContent = message;
  status.style.color = isError ? '#a4472b' : '#2a6550';
}
function translate() {
  document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
  document.title = STRINGS[state.lang].pageTitle;
  for (const node of document.querySelectorAll('[data-i18n]')) {
    const value = STRINGS[state.lang][node.dataset.i18n];
    if (node.dataset.i18n === 'heading') node.innerHTML = value;
    else node.textContent = value;
  }
  document.querySelector('#language').textContent = state.lang === 'en' ? '中文' : 'English';
  document.querySelector('#language').setAttribute('aria-label', state.lang === 'en' ? '切换到中文' : 'Switch to English');
  document.querySelector('#home-link').setAttribute('aria-label', STRINGS[state.lang].homeLabel);
  document.querySelector('.style-grid').setAttribute('aria-label', STRINGS[state.lang].styleGroup);
  document.querySelector('.platforms').setAttribute('aria-label', STRINGS[state.lang].targetGroup);
  document.querySelector('.preview-column').setAttribute('aria-label', STRINGS[state.lang].previewRegion);
  canvas.setAttribute('aria-label', STRINGS[state.lang].canvasLabel);
  paint();
}
function select(kind, value) {
  state[kind] = value;
  const selector = kind === 'platform' ? '.platform' : '.style-option';
  for (const button of document.querySelectorAll(selector)) {
    const selected = button.dataset[kind] === value;
    button.classList.toggle('is-selected', selected);
    button.setAttribute(kind === 'platform' ? 'aria-pressed' : 'aria-checked', String(selected));
  }
  paint(); save();
}
let frame = 0;
function paint() {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    const spec = PLATFORMS[state.platform];
    const result = renderPost(canvas, { content: content(), platform: state.platform, style: state.style, image: state.image });
    document.querySelector('#size').textContent = `${result.width} × ${result.height} px`;
    const styleLabel = state.lang === 'en' ? STYLE_NAMES[state.style] : STRINGS.zh[state.style];
    document.querySelector('#preview-name').textContent = `${spec.label} · ${styleLabel}`;
    setStatus(result.warnings.length ? STRINGS[state.lang][result.warnings[0].startsWith('Add') ? 'addTitle' : 'shortened'] : '', result.warnings.length > 0);
  });
}
async function download(mime) {
  if (!document.querySelector('#title').value.trim()) return setStatus(STRINGS[state.lang].addTitle, true);
  const result = renderPost(canvas, { content: content(), platform: state.platform, style: state.style, image: state.image });
  if (result.warnings.length) setStatus(STRINGS[state.lang].shortened, true);
  try {
    const blob = await new Promise((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Canvas export failed')), mime, .92));
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `social-post-image-maker-${state.platform}-${state.style}.${mime === 'image/png' ? 'png' : 'jpg'}`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
    if (!result.warnings.length) setStatus(STRINGS[state.lang].saved);
  } catch { setStatus(STRINGS[state.lang].failed, true); }
}

async function downloadAll() {
  if (!document.querySelector('#title').value.trim()) return setStatus(STRINGS[state.lang].addTitle, true);
  const button = document.querySelector('#all');
  button.disabled = true;
  setStatus(STRINGS[state.lang].packaging);
  try {
    const outputs = [];
    let shortened = false;
    for (const platform of Object.keys(PLATFORMS)) {
      const exportCanvas = document.createElement('canvas');
      const result = renderPost(exportCanvas, { content: content(), platform, style: state.style, image: state.image });
      shortened ||= result.warnings.length > 0;
      const blob = await new Promise((resolve, reject) => exportCanvas.toBlob(value => value ? resolve(value) : reject(new Error('Canvas export failed')), 'image/png'));
      outputs.push({ platform, bytes: new Uint8Array(await blob.arrayBuffer()) });
    }
    const archive = new Blob([buildPngPackage(state.style, outputs)], { type: 'application/zip' });
    const objectUrl = URL.createObjectURL(archive);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `social-post-image-maker-${state.style}-four-platforms.zip`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
    setStatus(STRINGS[state.lang][shortened ? 'shortened' : 'packageSaved'], shortened);
  } catch { setStatus(STRINGS[state.lang].failed, true); }
  finally { button.disabled = false; }
}

for (const id of fields) document.getElementById(id).addEventListener('input', () => { paint(); save(); });
for (const button of document.querySelectorAll('.platform')) button.addEventListener('click', () => select('platform', button.dataset.platform));
for (const button of document.querySelectorAll('.style-option')) button.addEventListener('click', () => select('style', button.dataset.style));
document.querySelector('#language').addEventListener('click', () => {
  const previous = state.lang;
  state.lang = previous === 'en' ? 'zh' : 'en';
  const example = translatedExample(content(), previous, state.lang);
  if (example) for (const id of fields) document.getElementById(id).value = example[id];
  const url = new URL(location.href);
  url.searchParams.set('lang', state.lang);
  history.replaceState(null, '', url);
  translate(); save();
});
document.querySelector('#png').addEventListener('click', () => download('image/png'));
document.querySelector('#jpeg').addEventListener('click', () => download('image/jpeg'));
document.querySelector('#all').addEventListener('click', downloadAll);
document.querySelector('#image').addEventListener('change', event => {
  const file = event.target.files?.[0];
  if (!file) return;
  if (file.size > 10_000_000) return setStatus(STRINGS[state.lang].tooLarge, true);
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) return setStatus(STRINGS[state.lang].badImage, true);
  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(objectUrl);
    state.image = image;
    document.querySelector('#image-status').textContent = file.name;
    setStatus(STRINGS[state.lang].uploaded);
    paint();
  };
  image.onerror = () => { URL.revokeObjectURL(objectUrl); setStatus(STRINGS[state.lang].badImage, true); };
  image.src = objectUrl;
});
select('platform', state.platform);
select('style', state.style);
translate();
document.fonts?.ready.then(paint);
