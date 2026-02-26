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

  const settingsApi = self.__chatgptPanelSettings;

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

  const removeContextMenu = () => {
    chrome.contextMenus.remove(CONTEXT_MENU_ID, () => {
      void chrome.runtime.lastError;
    });
  };

  const applyContextMenuSetting = (settings) => {
    const enabled =
      typeof settings?.enableQuoteTextContextMenu === 'boolean' ? settings.enableQuoteTextContextMenu : true;

    if (enabled) {
      ensureContextMenu();
    } else {
      removeContextMenu();
    }
  };

  const syncContextMenuFromStorage = async () => {
    if (!settingsApi || typeof settingsApi.getSettings !== 'function') {
      ensureContextMenu();
      return;
    }

    try {
      const settings = await settingsApi.getSettings();
      applyContextMenuSetting(settings);
    } catch (_error) {
      applyContextMenuSetting(settingsApi.DEFAULT_SETTINGS);
    }
  };

  const normalizeSelectionText = (text) => {
    if (typeof text !== 'string') {
      return '';
    }
    return text.trim();
  };

  chrome.runtime.onInstalled.addListener(() => {
    void syncContextMenuFromStorage();
  });

  chrome.runtime.onStartup.addListener(() => {
    void syncContextMenuFromStorage();
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

  if (settingsApi && typeof settingsApi.onChanged === 'function') {
    settingsApi.onChanged((settings) => {
      applyContextMenuSetting(settings);
    });
  }

  void syncContextMenuFromStorage();
})();
