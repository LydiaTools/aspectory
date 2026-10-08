export const PLATFORMS = Object.freeze({
  pinterest: { label: 'Pinterest', width: 1000, height: 1500, ratio: '2:3' },
  instagram: { label: 'Instagram', width: 1080, height: 1350, ratio: '4:5' },
  lemon8: { label: 'Lemon8', width: 1080, height: 1440, ratio: '3:4' },
  facebook: { label: 'Facebook', width: 1080, height: 1080, ratio: '1:1' }
});

export const STYLE_NAMES = Object.freeze({ field: 'Field notes', photo: 'Photo story', data: 'Data sheet', poster: 'Bright poster' });

export function normalizeContent(raw) {
  const clean = (key, limit) => String(raw[key] ?? '').trim().slice(0, limit);
  return {
    brand: clean('brand', 42), eyebrow: clean('eyebrow', 50), title: clean('title', 110),
    body: clean('body', 190), figure: clean('figure', 24), figureLabel: clean('figureLabel', 55),
    cta: clean('cta', 85), url: clean('url', 90)
  };
}

function font(size, family = 'sans', weight = 400) {
  const face = family === 'serif' ? '"DM Serif Display", Georgia, "Noto Serif CJK SC", serif' :
    family === 'display' ? '"Space Grotesk", "Noto Sans CJK SC", Arial, sans-serif' :
    '"DM Sans", "Noto Sans CJK SC", Arial, sans-serif';
  return `${weight} ${size}px ${face}`;
}

export function wrapLines(ctx, text, maxWidth) {
  const tokens = String(text || '').match(/[\u3400-\u9fff]|[，。！？；：、（）【】《》]|[^\s\u3400-\u9fff，。！？；：、（）【】《》]+|\s+/g) || [];
  const lines = [];
  let line = '';
  let spaced = false;
  for (const word of tokens) {
    if (/^\s+$/.test(word)) { spaced = true; continue; }
    const next = line + (line && spaced ? ' ' : '') + word;
    if (line && ctx.measureText(next).width > maxWidth) {
      if (/^[，。！？；：、）】》]/.test(word)) line = next;
      else { lines.push(line); line = word; }
    }
    else line = next;
    spaced = false;
  }
  if (line) lines.push(line);
  return lines;
}

function textBlock(ctx, text, options, warnings) {
  const { x, y, width, size, minSize = Math.min(24, size), maxLines = 4, leading = 1.15,
    family = 'sans', weight = 400, color = '#111', align = 'left' } = options;
  if (!text) return y;
  let finalSize = size;
  let lines = [];
  while (finalSize >= minSize) {
    ctx.font = font(finalSize, family, weight);
    lines = wrapLines(ctx, text, width);
    if (lines.length <= maxLines && lines.every(line => ctx.measureText(line).width <= width)) break;
    finalSize -= 2;
  }
  if (finalSize < minSize) {
    finalSize = minSize;
    ctx.font = font(finalSize, family, weight);
    lines = wrapLines(ctx, text, width);
  }
  if (lines.length > maxLines || lines.some(line => ctx.measureText(line).width > width)) {
    warnings.push('Some text was shortened in the image. Edit the copy or choose a taller canvas.');
    lines = lines.slice(0, maxLines);
    let last = lines[lines.length - 1] || '';
    while (last && ctx.measureText(`${last}…`).width > width) last = last.slice(0, -1);
    lines[lines.length - 1] = `${last}…`;
  }
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'top';
  const lineHeight = finalSize * leading;
  lines.forEach((line, index) => ctx.fillText(line, x, y + index * lineHeight));
  return y + lines.length * lineHeight;
}

function rule(ctx, x1, y, x2, color, width = 2) {
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
}

function pill(ctx, text, x, y, options = {}) {
  const { bg = '#eee', fg = '#111', size = 23, padX = 22, height = 52, radius = 26 } = options;
  ctx.font = font(size, 'sans', 600);
  const width = Math.min(850, ctx.measureText(text).width + padX * 2);
  ctx.fillStyle = bg; ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); ctx.fill();
  ctx.fillStyle = fg; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText(text, x + padX, y + height / 2);
  return width;
}

function drawPhoto(ctx, image, x, y, width, height) {
  if (!image) {
    const g = ctx.createLinearGradient(x, y, x + width, y + height);
    g.addColorStop(0, '#9fba9b'); g.addColorStop(.58, '#607d70'); g.addColorStop(1, '#204b45');
    ctx.fillStyle = g; ctx.fillRect(x, y, width, height);
    ctx.fillStyle = 'rgba(244, 239, 222, .16)';
    for (let i = 0; i < 7; i++) {
      ctx.beginPath(); ctx.ellipse(x + width * (.18 + i * .11), y + height * (.18 + (i % 3) * .25), 190, 54, -.7, 0, Math.PI * 2); ctx.fill();
    }
    return;
  }
  const iw = image.naturalWidth || image.width, ih = image.naturalHeight || image.height;
  if (!iw || !ih) return;
  const scale = Math.max(width / iw, height / ih);
  const sw = width / scale, sh = height / scale;
  ctx.drawImage(image, (iw - sw) / 2, (ih - sh) / 2, sw, sh, x, y, width, height);
}

function field(ctx, c, H, warnings) {
  const compact = H < 1200, square = H <= 1050, left = 72, right = 928;
  ctx.fillStyle = '#153c32'; ctx.fillRect(0, 0, 1000, H);
  ctx.fillStyle = '#d9ad6f'; ctx.fillRect(left, 74, 54, 7);
  textBlock(ctx, c.brand.toUpperCase(), { x: left, y: 110, width: 800, size: 31, maxLines: 1, family: 'display', weight: 600, color: '#e9d5af' }, warnings);
  rule(ctx, left, 178, right, '#688579', 1.5);
  textBlock(ctx, c.eyebrow.toUpperCase(), { x: left, y: 222, width: 840, size: 24, maxLines: 1, color: '#aec4ba' }, warnings);
  const titleBottom = textBlock(ctx, c.title, { x: left, y: square ? 258 : 284, width: 856, size: square ? 62 : compact ? 72 : 82, minSize: square ? 45 : compact ? 50 : 58, maxLines: compact ? 3 : 4, leading: 1.06, family: 'serif', color: '#f5f0e6' }, warnings);
  const metricY = Math.max(titleBottom + (square ? 23 : 55), square ? 506 : compact ? 600 : 650);
  const metricH = square ? 166 : compact ? 220 : 268;
  ctx.fillStyle = '#efece1'; ctx.beginPath(); ctx.roundRect(left, metricY, 856, metricH, 16); ctx.fill();
  textBlock(ctx, c.figure || '—', { x: left + 42, y: metricY + (square ? 16 : 28), width: 780, size: square ? 76 : compact ? 94 : 116, minSize: 56, maxLines: 1, family: 'serif', color: '#aa793e' }, warnings);
  textBlock(ctx, c.figureLabel, { x: left + 46, y: metricY + (square ? 110 : compact ? 151 : 182), width: 760, size: square ? 22 : 26, maxLines: 1, weight: 600, color: '#193d34' }, warnings);
  const bodyY = metricY + metricH + (square ? 24 : 37);
  const bodySize = square ? 23 : 27;
  const bodyLines = Math.max(1, Math.min(square ? 3 : 4, Math.floor((H - 165 - bodyY) / (bodySize * 1.26))));
  textBlock(ctx, c.body, { x: left, y: bodyY, width: 856, size: bodySize, minSize: 20, maxLines: bodyLines, leading: 1.26, color: '#d8e1da' }, warnings);
  rule(ctx, left, H - 146, right, '#688579', 1.5);
  textBlock(ctx, c.cta, { x: left, y: H - 119, width: 620, size: 27, maxLines: 1, weight: 600, color: '#f5f0e6' }, warnings);
  textBlock(ctx, c.url, { x: right, y: H - 72, width: 800, size: 22, maxLines: 1, align: 'right', color: '#d9ad6f' }, warnings);
}

function photo(ctx, c, H, image, warnings) {
  const compact = H < 1200, photoH = compact ? H * .49 : H * .55;
  ctx.fillStyle = '#f4f0e6'; ctx.fillRect(0, 0, 1000, H);
  drawPhoto(ctx, image, 0, 0, 1000, photoH);
  ctx.fillStyle = 'rgba(13, 51, 41, .75)'; ctx.fillRect(0, 0, 1000, 114);
  textBlock(ctx, c.brand, { x: 64, y: 39, width: 860, size: 29, maxLines: 1, weight: 700, color: '#fff' }, warnings);
  pill(ctx, c.eyebrow || 'Story', 64, photoH - 82, { bg: '#f5f0e6', fg: '#294b3d', size: 21 });
  const titleY = photoH + 40;
  const titleBottom = textBlock(ctx, c.title, { x: 64, y: titleY, width: 872, size: compact ? 68 : 74, minSize: 48, maxLines: compact ? 2 : 3, leading: 1.02, family: 'serif', color: '#223f37' }, warnings);
  const bodyY = titleBottom + 25;
  textBlock(ctx, c.body, { x: 64, y: bodyY, width: 872, size: 25, minSize: 21, maxLines: compact ? 2 : 3, leading: 1.26, color: '#43574b' }, warnings);
  rule(ctx, 64, H - 138, 936, '#b5bea9', 2);
  textBlock(ctx, c.figure, { x: 64, y: H - 118, width: 560, size: 52, minSize: 36, maxLines: 1, family: 'serif', color: '#b0693e' }, warnings);
  textBlock(ctx, c.cta, { x: 936, y: H - 116, width: 410, size: 20, minSize: 17, maxLines: 1, align: 'right', weight: 600, color: '#43574b' }, warnings);
  textBlock(ctx, c.url || c.cta, { x: 936, y: H - 68, width: 460, size: 21, maxLines: 1, align: 'right', color: '#43574b' }, warnings);
}

function data(ctx, c, H, warnings) {
  const compact = H < 1200, square = H <= 1050;
  ctx.fillStyle = '#f3f5f1'; ctx.fillRect(0, 0, 1000, H);
  ctx.fillStyle = '#184d66'; ctx.fillRect(0, 0, 26, H);
  textBlock(ctx, c.brand, { x: 76, y: 70, width: 800, size: 28, maxLines: 1, weight: 700, color: '#184d66' }, warnings);
  textBlock(ctx, c.eyebrow.toUpperCase(), { x: 76, y: 152, width: 840, size: 23, maxLines: 1, weight: 600, color: '#607c83' }, warnings);
  rule(ctx, 76, 216, 922, '#aac0bc', 2);
  textBlock(ctx, c.title, { x: 76, y: 264, width: 846, size: square ? 58 : compact ? 68 : 74, minSize: square ? 43 : 50, maxLines: compact ? 3 : 4, leading: 1.04, family: 'display', weight: 600, color: '#133d51' }, warnings);
  const boxY = square ? 488 : compact ? 572 : 644, boxH = square ? 206 : compact ? 260 : 330;
  ctx.fillStyle = '#dbe9df'; ctx.fillRect(76, boxY, 846, boxH);
  ctx.fillStyle = '#8caea2'; ctx.fillRect(76, boxY, 14, boxH);
  textBlock(ctx, c.figure || '—', { x: 120, y: boxY + (square ? 19 : 32), width: 760, size: square ? 89 : compact ? 112 : 144, minSize: 60, maxLines: 1, family: 'display', weight: 700, color: '#124b52' }, warnings);
  textBlock(ctx, c.figureLabel, { x: 124, y: boxY + (square ? 151 : compact ? 190 : 245), width: 720, size: square ? 22 : 26, maxLines: 1, color: '#265961' }, warnings);
  const bodyY = boxY + boxH + (square ? 24 : 48), bodySize = square ? 23 : 29;
  const bodyLines = Math.max(1, Math.min(square ? 3 : 4, Math.floor((H - 165 - bodyY) / (bodySize * 1.26))));
  textBlock(ctx, c.body, { x: 76, y: bodyY, width: 846, size: bodySize, minSize: 20, maxLines: bodyLines, leading: 1.26, color: '#32535c' }, warnings);
  rule(ctx, 76, H - 138, 922, '#aac0bc', 2);
  textBlock(ctx, c.cta, { x: 76, y: H - 113, width: 700, size: 24, maxLines: 1, weight: 700, color: '#184d66' }, warnings);
  textBlock(ctx, c.url, { x: 922, y: H - 65, width: 550, size: 20, maxLines: 1, align: 'right', color: '#607c83' }, warnings);
}

function poster(ctx, c, H, warnings) {
  const compact = H < 1200, square = H <= 1050;
  ctx.fillStyle = '#213ac2'; ctx.fillRect(0, 0, 1000, H);
  ctx.fillStyle = '#f3bb7a'; ctx.beginPath(); ctx.arc(880, 90, 170, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ef7657'; ctx.fillRect(0, H - 230, 1000, 230);
  textBlock(ctx, c.brand, { x: 68, y: 68, width: 700, size: 29, maxLines: 1, weight: 700, color: '#fff2dd' }, warnings);
  textBlock(ctx, c.eyebrow.toUpperCase(), { x: 68, y: 167, width: 780, size: 24, maxLines: 1, weight: 700, color: '#f3bb7a' }, warnings);
  textBlock(ctx, c.title, { x: 68, y: 272, width: 860, size: compact ? 82 : 98, minSize: compact ? 58 : 68, maxLines: compact ? 3 : 4, leading: .99, family: 'display', weight: 700, color: '#fff2dd' }, warnings);
  const figY = square ? 565 : compact ? 617 : 732;
  textBlock(ctx, c.figure || '—', { x: 68, y: figY, width: 860, size: compact ? 122 : 155, minSize: 76, maxLines: 1, family: 'display', weight: 700, color: '#f3bb7a' }, warnings);
  textBlock(ctx, c.figureLabel, { x: 74, y: figY + (square ? 143 : compact ? 145 : 180), width: 820, size: 26, maxLines: 1, weight: 600, color: '#fff2dd' }, warnings);
  textBlock(ctx, c.body, { x: 68, y: H - 198, width: 864, size: compact ? 25 : 29, minSize: 21, maxLines: 3, leading: 1.18, weight: 500, color: '#2c2b5a' }, warnings);
  textBlock(ctx, [c.cta, c.url].filter(Boolean).join('  /  '), { x: 932, y: H - 54, width: 830, size: 21, minSize: 18, maxLines: 1, align: 'right', weight: 700, color: '#2c2b5a' }, warnings);
}

export function renderPost(canvas, { content, platform = 'pinterest', style = 'field', image = null }) {
  const spec = PLATFORMS[platform];
  if (!spec) throw new Error(`Unknown platform: ${platform}`);
  if (!STYLE_NAMES[style]) throw new Error(`Unknown style: ${style}`);
  const c = normalizeContent(content);
  const warnings = [];
  if (!c.title) warnings.push('Add a headline before exporting.');
  canvas.width = spec.width; canvas.height = spec.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is unavailable.');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const scale = spec.width / 1000;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const H = spec.height / scale;
  if (style === 'field') field(ctx, c, H, warnings);
  else if (style === 'photo') photo(ctx, c, H, image, warnings);
  else if (style === 'data') data(ctx, c, H, warnings);
  else poster(ctx, c, H, warnings);
  return { width: spec.width, height: spec.height, warnings: [...new Set(warnings)] };
}
