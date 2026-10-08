export const EXAMPLES = Object.freeze({
  en: {
    brand: 'CoverCalc Pro', eyebrow: 'Garden math, made clear',
    title: 'How many bags of mulch do you actually need?',
    body: 'A 10 × 10 ft bed at 3 in deep needs 25 ft³ of mulch. With 2 ft³ bags, round 12.5 up to 13 whole bags.',
    figure: '13 bags', figureLabel: 'for a 10 × 10 ft bed',
    cta: 'Calculate for your own garden', url: 'covercalcpro.com'
  },
  zh: {
    brand: 'CoverCalc Pro', eyebrow: '园艺用量小算例',
    title: '覆盖物要买多少袋？',
    body: '花坛长宽各 10 英尺，铺 3 英寸厚，需要 25 立方英尺覆盖物。每袋 2 立方英尺，12.5 袋要向上取整。',
    figure: '13 袋', figureLabel: '每袋 2 立方英尺',
    cta: '测量面积，再算购买量', url: 'covercalcpro.com'
  }
});

export function initialLanguage(urlLang, savedLang, browserLang) {
  if (urlLang === 'zh' || urlLang === 'en') return urlLang;
  if (savedLang === 'zh' || savedLang === 'en') return savedLang;
  return /^zh(?:-|$)/i.test(browserLang || '') ? 'zh' : 'en';
}

export function translatedExample(current, from, to) {
  if (!EXAMPLES[from] || !EXAMPLES[to]) return null;
  return Object.keys(EXAMPLES[from]).every(key => current[key] === EXAMPLES[from][key]) ? EXAMPLES[to] : null;
}
