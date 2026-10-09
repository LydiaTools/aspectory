(() => {
  if (window.location.hostname !== 'lydiatools.github.io') return;

  const measurementId = 'G-M5XZDV1PE7';
  const consentKey = 'lydiatools.analytics-consent.v1';
  const denied = {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  };
  const granted = { ...denied, analytics_storage: 'granted' };
  const copy = {
    en: {
      settings: 'Privacy settings', title: 'Optional visit analytics',
      body: 'On LydiaTools hosted demos only, Google Analytics can record basic visit/referral metrics and clicks to LydiaTools GitHub pages after you allow it. Google may receive the page URL, referrer, campaign tags, the GitHub destination path, and standard browser or device data. This demo’s analytics code does not send your draft text, source fields, or images.',
      note: 'You can change this choice later. Changes apply to future collection; data already sent cannot be recalled here.',
      none: 'No choice saved. Analytics stays off until you allow it.',
      accepted: 'Current choice: analytics allowed.', rejected: 'Current choice: analytics rejected.',
      allow: 'Allow analytics', reject: 'Reject', later: 'Not now',
      label: 'Optional analytics consent'
    },
    zh: {
      settings: '隐私设置', title: '可选访问统计',
      body: '仅在 LydiaTools 托管演示页中，Google Analytics 会在你允许后记录基础访问、来源及前往 LydiaTools GitHub 页面的点击。Google 可能收到页面地址、来源、活动标记、GitHub 目标路径及常规浏览器或设备信息。本演示页的统计代码不会发送你填写的草稿、来源字段或图片。',
      note: '以后可更改选择；更改作用于后续采集，已发送的数据无法从此处撤回。',
      none: '尚未保存选择；在你允许前不会启用统计。',
      accepted: '当前选择：允许统计。', rejected: '当前选择：拒绝统计。',
      allow: '允许统计', reject: '拒绝', later: '暂不选择',
      label: '可选访问统计授权'
    }
  };

  const text = () => {
    const queryLanguage = new URLSearchParams(window.location.search).get('lang');
    const documentLanguage = document.documentElement.lang.toLowerCase();
    return queryLanguage === 'zh' || documentLanguage.startsWith('zh') ? 'zh' : 'en';
  };
  const readChoice = () => {
    try {
      const value = window.localStorage.getItem(consentKey);
      return value === 'accepted' || value === 'rejected' ? value : '';
    } catch {
      return '';
    }
  };
  let choice = readChoice();
  let language = text();
  let banner;
  let title;
  let description;
  let note;
  let status;
  let allowButton;
  let rejectButton;
  let laterButton;

  const style = document.createElement('style');
  style.textContent = `
    #lydia-analytics-consent{position:fixed;z-index:99999;left:16px;right:16px;bottom:16px;max-width:760px;margin:0 auto;padding:16px 18px;background:#f7f5ec;color:#173845;border:1px solid #17404c;box-shadow:0 12px 34px #102c3333;font:14px/1.55 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    #lydia-analytics-consent[hidden]{display:none}
    #lydia-analytics-consent h2{margin:0 0 6px;color:#17404c;font:600 18px/1.3 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    #lydia-analytics-consent p{margin:6px 0;color:#3b5558}
    #lydia-analytics-consent .lt-consent-status{font-size:12px;color:#607579}
    #lydia-analytics-consent .lt-consent-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
    #lydia-analytics-consent button,#lydia-analytics-settings{font:inherit;cursor:pointer}
    #lydia-analytics-consent button{min-height:38px;padding:7px 13px;border:1px solid #17404c;background:transparent;color:#17404c}
    #lydia-analytics-consent .lt-consent-allow{background:#17404c;color:#fff}
    .lt-privacy-footer{flex-wrap:wrap;gap:10px;align-items:center}
    #lydia-analytics-consent button:focus-visible,#lydia-analytics-settings:focus-visible{outline:3px solid #d36b4d;outline-offset:3px}
    #lydia-analytics-settings{margin:0;padding:0;border:0;background:transparent;color:inherit;text-decoration:underline;text-underline-offset:3px;font-size:inherit}
    @media(max-width:600px){#lydia-analytics-consent{left:10px;right:10px;bottom:10px;padding:13px;font-size:13px}#lydia-analytics-consent h2{font-size:16px}#lydia-analytics-consent button{flex:1}}
  `;
  document.head.append(style);

  const settingsButton = document.createElement('button');
  settingsButton.type = 'button';
  settingsButton.id = 'lydia-analytics-settings';
  const footerTarget = document.querySelector('.footer-links') || document.querySelector('footer');
  if (footerTarget) {
    footerTarget.classList.add('lt-privacy-footer');
    footerTarget.append(settingsButton);
  }

  banner = document.createElement('section');
  banner.id = 'lydia-analytics-consent';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-labelledby', 'lydia-analytics-title');
  title = document.createElement('h2');
  title.id = 'lydia-analytics-title';
  description = document.createElement('p');
  note = document.createElement('p');
  note.className = 'lt-consent-note';
  status = document.createElement('p');
  status.className = 'lt-consent-status';
  const actions = document.createElement('div');
  actions.className = 'lt-consent-actions';
  allowButton = document.createElement('button');
  allowButton.type = 'button';
  allowButton.className = 'lt-consent-allow';
  rejectButton = document.createElement('button');
  rejectButton.type = 'button';
  laterButton = document.createElement('button');
  laterButton.type = 'button';
  actions.append(allowButton, rejectButton, laterButton);
  banner.append(title, description, note, status, actions);
  document.body.append(banner);

  function updateGoogleConsent(nextChoice) {
    if (nextChoice === 'accepted') {
      if (!window.__lydiaAnalyticsTagLoaded) {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function gtag() { window.dataLayer.push(arguments); };
        window.gtag('consent', 'default', denied);
        window.gtag('consent', 'update', granted);
        window.gtag('js', new Date());
        window.gtag('config', measurementId, {
          send_page_view: false,
          allow_google_signals: false,
          allow_ad_personalization_signals: false
        });
        const script = document.createElement('script');
        script.async = true;
        script.referrerPolicy = 'strict-origin-when-cross-origin';
        script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
        document.head.append(script);
        window.__lydiaAnalyticsTagLoaded = true;
      } else window.gtag('consent', 'update', granted);
      if (!window.__lydiaAnalyticsActive) window.gtag('event', 'page_view', {
        page_location: window.location.href,
        page_title: document.title,
        page_referrer: document.referrer
      });
      window.__lydiaAnalyticsActive = true;
    } else if (window.__lydiaAnalyticsTagLoaded) {
      window.gtag('consent', 'update', denied);
      window.__lydiaAnalyticsActive = false;
    }
  }

  function saveChoice(nextChoice) {
    choice = nextChoice;
    try { window.localStorage.setItem(consentKey, choice); } catch { /* Choice remains active for this page session. */ }
    updateGoogleConsent(choice);
    banner.hidden = true;
  }

  function render() {
    const strings = copy[language];
    settingsButton.textContent = strings.settings;
    settingsButton.setAttribute('aria-label', strings.settings);
    banner.setAttribute('aria-label', strings.label);
    title.textContent = strings.title;
    description.textContent = strings.body;
    note.textContent = strings.note;
    status.textContent = choice ? strings[choice] : strings.none;
    allowButton.textContent = strings.allow;
    rejectButton.textContent = strings.reject;
    laterButton.textContent = strings.later;
  }

  function openSettings() {
    render();
    banner.hidden = false;
  }

  settingsButton.addEventListener('click', openSettings);
  allowButton.addEventListener('click', () => saveChoice('accepted'));
  rejectButton.addEventListener('click', () => saveChoice('rejected'));
  laterButton.addEventListener('click', () => { banner.hidden = true; });
  document.addEventListener('click', (event) => {
    if (!window.__lydiaAnalyticsActive || typeof window.gtag !== 'function') return;
    const anchor = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!anchor) return;
    const destination = new URL(anchor.href, window.location.href);
    if (destination.hostname !== 'github.com' || !/^\/lydiatools(?:\/|$)/i.test(destination.pathname)) return;
    window.gtag('event', 'github_outbound_click', { github_path: destination.pathname });
  });
  new MutationObserver(() => {
    const nextLanguage = text();
    if (nextLanguage !== language) {
      language = nextLanguage;
      render();
    }
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  render();
  if (choice === 'accepted') updateGoogleConsent(choice);
  else if (!choice) banner.hidden = false;
})();
