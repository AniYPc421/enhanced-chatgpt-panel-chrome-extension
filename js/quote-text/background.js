(function () {
  'use strict';

  if (!self.extensionFeatureBus) {
    return;
  }

  const i18n = self.__chatgptPanelI18n;
  const getI18nText = (key, fallbackText = '') => {
    const value = i18n && typeof i18n.t === 'function' ? i18n.t(key) : undefined;
    return typeof value === 'string' && value ? value : fallbackText;
  };

  const CONTEXT_MENU_ID = 'quote-text';
  const CONTEXT_MENU_TITLE = getI18nText('quoteText.contextMenuTitle');
  const { FEATURE_EVENT_TYPES, dispatchFeatureEvent, openSidePanelForWindow } = self.extensionFeatureBus;

  const createContextMenu = () => {
    chrome.contextMenus.create(
      {
        id: CONTEXT_MENU_ID,
        title: CONTEXT_MENU_TITLE,
        contexts: ['selection']
      },
      () => {
        void chrome.runtime.lastError;
      }
    );
  };

  const ensureContextMenu = () => {
    chrome.contextMenus.remove(CONTEXT_MENU_ID, () => {
      void chrome.runtime.lastError;
      createContextMenu();
    });
  };

  const normalizeSelectionText = (text) => {
    if (typeof text !== 'string') {
      return '';
    }
    return text.trim();
  };

  chrome.runtime.onInstalled.addListener(() => {
    ensureContextMenu();
  });

  chrome.runtime.onStartup.addListener(() => {
    ensureContextMenu();
  });

  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== CONTEXT_MENU_ID) {
      return;
    }

    const selectedText = normalizeSelectionText(info.selectionText);
    if (!selectedText) {
      return;
    }

    openSidePanelForWindow(tab?.windowId);

    dispatchFeatureEvent({
      type: FEATURE_EVENT_TYPES.QUOTE_TEXT_READY,
      payload: {
        featureId: 'quote-text',
        text: selectedText,
        pageUrl: typeof info.pageUrl === 'string' ? info.pageUrl : tab?.url || ''
      }
    });
  });

  ensureContextMenu();
})();
