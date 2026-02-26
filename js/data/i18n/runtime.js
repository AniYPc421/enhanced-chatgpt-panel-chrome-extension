(function () {
  'use strict';

  const root = typeof globalThis !== 'undefined' ? globalThis : self;
  if (root.__chatgptPanelI18n) {
    return;
  }

  const FALLBACK_LANGUAGE = 'en';
  const locales = root.__chatgptPanelI18nLocales || {};

  const normalizeLanguage = (value) => {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/_/g, '-');
  };

  const getUiLanguages = () => {
    const result = [];

    try {
      if (typeof chrome !== 'undefined' && chrome.i18n && typeof chrome.i18n.getUILanguage === 'function') {
        result.push(chrome.i18n.getUILanguage());
      }
    } catch (_error) {
      // Ignore i18n API errors and continue with navigator languages.
    }

    if (typeof navigator !== 'undefined') {
      if (Array.isArray(navigator.languages)) {
        result.push(...navigator.languages);
      }
      if (typeof navigator.language === 'string') {
        result.push(navigator.language);
      }
    }

    return result
      .map(normalizeLanguage)
      .filter(Boolean);
  };

  const resolveLanguage = () => {
    const supported = Object.keys(locales);
    if (supported.length === 0) {
      return FALLBACK_LANGUAGE;
    }

    const candidates = getUiLanguages();
    for (const candidate of candidates) {
      if (supported.includes(candidate)) {
        return candidate;
      }

      const base = candidate.split('-')[0];
      if (supported.includes(base)) {
        return base;
      }

      if (base === 'zh' && supported.includes('zh-cn')) {
        return 'zh-cn';
      }

      if (base === 'en' && supported.includes('en')) {
        return 'en';
      }
    }

    if (supported.includes(FALLBACK_LANGUAGE)) {
      return FALLBACK_LANGUAGE;
    }

    return supported[0];
  };

  const language = resolveLanguage();
  const fallbackCatalog = locales[FALLBACK_LANGUAGE] || {};
  const activeCatalog = locales[language] || fallbackCatalog;

  const readByPath = (catalog, path) => {
    if (!catalog || typeof path !== 'string' || !path) {
      return undefined;
    }

    const segments = path.split('.');
    let cursor = catalog;
    for (const segment of segments) {
      if (!cursor || typeof cursor !== 'object' || !(segment in cursor)) {
        return undefined;
      }
      cursor = cursor[segment];
    }
    return cursor;
  };

  const formatText = (template, params) => {
    if (typeof template !== 'string') {
      return template;
    }

    if (!params || typeof params !== 'object') {
      return template;
    }

    return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
      if (key in params) {
        return String(params[key]);
      }
      return match;
    });
  };

  const getLocalizedValue = (key) => {
    const value = readByPath(activeCatalog, key);
    if (typeof value !== 'undefined') {
      return value;
    }
    return readByPath(fallbackCatalog, key);
  };

  const t = (key, params) => {
    const value = getLocalizedValue(key);
    if (typeof value === 'undefined') {
      return key;
    }

    if (typeof value === 'string') {
      return formatText(value, params);
    }

    return value;
  };

  root.__chatgptPanelI18n = Object.freeze({
    language,
    t
  });
})();
