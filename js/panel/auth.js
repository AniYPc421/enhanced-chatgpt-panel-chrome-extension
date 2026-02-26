(function () {
  'use strict';

  if (window.__chatgptPanelPanelAuth) {
    return;
  }

  const fetchAuthSession = async ({ addressPrefix, getI18nText }) => {
    const baseUrl = typeof addressPrefix === 'string' && addressPrefix ? addressPrefix : 'https://chatgpt.com';
    const t = typeof getI18nText === 'function' ? getI18nText : (_key, _params, fallback) => fallback || '';

    try {
      const response = await fetch(baseUrl + '/api/auth/session');

      if (response.status === 403) {
        return {
          state: 'cloudflare',
          message: t('popup.cloudflareLoginMessage', { url: baseUrl }, '')
        };
      }

      const data = await response.json();
      if (!response.ok || !data?.accessToken) {
        return {
          state: 'unauthorized',
          message: t('popup.loginFirstMessage', { url: baseUrl }, '')
        };
      }

      return { state: 'authorized' };
    } catch (error) {
      console.error('Error fetching session:', error);
      return {
        state: 'error',
        message: t('popup.fetchSessionError', null, '')
      };
    }
  };

  window.__chatgptPanelPanelAuth = Object.freeze({
    fetchAuthSession
  });
})();

