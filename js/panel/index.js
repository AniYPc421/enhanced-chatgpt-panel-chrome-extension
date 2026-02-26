(function () {
  'use strict';

  const auth = window.__chatgptPanelPanelAuth;
  const ui = window.__chatgptPanelPanelUi;
  if (!auth || !ui) {
    return;
  }

  const addressPrefix = 'https://chatgpt.com';
  const panelFrameName = 'chatgpt-panel-frame';

  const i18n = window.__chatgptPanelI18n;
  const getI18nText = (key, params, fallbackText = '') => {
    const value = i18n && typeof i18n.t === 'function' ? i18n.t(key, params) : undefined;
    return typeof value === 'string' && value ? value : fallbackText;
  };

  const initializePanel = async () => {
    document.title = getI18nText('popup.documentTitle', null, 'ChatGPT Panel');
    const container = document.getElementById('iframe');
    if (!(container instanceof HTMLElement)) {
      return;
    }

    const authStatus = await auth.fetchAuthSession({ addressPrefix, getI18nText });
    if (authStatus?.state === 'authorized') {
      ui.renderChatFrame({ container, addressPrefix, frameName: panelFrameName });
      return;
    }

    ui.renderMessage({ container, message: authStatus?.message || '' });
  };

  void initializePanel();
})();

