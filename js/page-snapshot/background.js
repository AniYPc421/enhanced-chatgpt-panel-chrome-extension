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

  const { FEATURE_EVENT_TYPES, dispatchFeatureEvent, openSidePanelForWindow } = self.extensionFeatureBus;
  const MESSAGE_TYPES = Object.freeze({
    PAGE_SNAPSHOT_COLLECT_FROM_PAGE: 'PAGE_SNAPSHOT_COLLECT_FROM_PAGE'
  });

  const CONTEXT_MENU_ID = 'page-snapshot-upload';
  const CONTEXT_MENU_TITLE = getI18nText(
    'pageSnapshot.contextMenuTitle',
    'Upload Page Snapshot to Enhanced ChatGPT Panel'
  );
  const CONTEXT_MENU_CONTEXTS = Object.freeze(['page']);

  const isSnapshotTriggerMessage = (message) => {
    return message && message.type === FEATURE_EVENT_TYPES.PAGE_SNAPSHOT_TRIGGER;
  };

  const isSnapshotCaptureActiveTabMessage = (message) => {
    return message && message.type === FEATURE_EVENT_TYPES.PAGE_SNAPSHOT_CAPTURE_ACTIVE_TAB;
  };

  const normalizeSnapshotPayload = (payload) => {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    if (typeof payload.html !== 'string' || !payload.html.trim()) {
      return null;
    }

    return {
      featureId: 'page-snapshot',
      html: payload.html,
      pageUrl: typeof payload.pageUrl === 'string' ? payload.pageUrl : '',
      pageTitle: typeof payload.pageTitle === 'string' ? payload.pageTitle : '',
      fileName: typeof payload.fileName === 'string' ? payload.fileName : '',
      capturedAt: typeof payload.capturedAt === 'string' ? payload.capturedAt : ''
    };
  };

  const queryActiveTab = () => {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        const activeTab = tabs.find((tab) => typeof tab.id === 'number');
        if (!activeTab) {
          reject(new Error('active_tab_not_found'));
          return;
        }

        resolve(activeTab);
      });
    });
  };

  const requestSnapshotFromTab = (tabId) => {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(
        tabId,
        {
          type: MESSAGE_TYPES.PAGE_SNAPSHOT_COLLECT_FROM_PAGE
        },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          resolve(response);
        }
      );
    });
  };

  const isSupportedPageUrl = (url) => {
    if (typeof url !== 'string') {
      return false;
    }

    if (!/^https?:\/\//i.test(url)) {
      return false;
    }

    return !url.startsWith('https://chatgpt.com/');
  };

  const dispatchSnapshotPayload = (payload, windowId) => {
    if (typeof windowId === 'number') {
      openSidePanelForWindow(windowId);
    }

    dispatchFeatureEvent({
      type: FEATURE_EVENT_TYPES.PAGE_SNAPSHOT_READY,
      payload
    });
  };

  const handlePageSnapshotTrigger = (message, sender, sendResponse) => {
    const payload = normalizeSnapshotPayload(message.payload);
    if (!payload) {
      sendResponse({ ok: false, reason: 'invalid_payload' });
      return;
    }

    dispatchSnapshotPayload(payload, sender?.tab?.windowId);
    sendResponse({ ok: true });
  };

  const handleCaptureActiveTabRequest = async (sendResponse) => {
    try {
      const activeTab = await queryActiveTab();
      if (!isSupportedPageUrl(activeTab.url)) {
        sendResponse({ ok: false, reason: 'unsupported_active_tab_url' });
        return;
      }

      const snapshotResponse = await requestSnapshotFromTab(activeTab.id);
      if (!snapshotResponse || !snapshotResponse.ok) {
        sendResponse({
          ok: false,
          reason: snapshotResponse?.reason || 'snapshot_collect_failed'
        });
        return;
      }

      const payload = normalizeSnapshotPayload(snapshotResponse.payload);
      if (!payload) {
        sendResponse({ ok: false, reason: 'invalid_snapshot_payload' });
        return;
      }

      dispatchSnapshotPayload(payload, activeTab.windowId);
      sendResponse({ ok: true });
    } catch (error) {
      sendResponse({
        ok: false,
        reason: error?.message || 'capture_active_tab_failed'
      });
    }
  };

  const createContextMenu = () => {
    chrome.contextMenus.create(
      {
        id: CONTEXT_MENU_ID,
        title: CONTEXT_MENU_TITLE,
        contexts: CONTEXT_MENU_CONTEXTS,
        documentUrlPatterns: ['http://*/*', 'https://*/*']
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
      typeof settings?.enablePageSnapshotContextMenu === 'boolean' ? settings.enablePageSnapshotContextMenu : true;

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

  const handleContextMenuClick = async (info, tab) => {
    const selectionText = typeof info?.selectionText === 'string' ? info.selectionText.trim() : '';
    if (selectionText) {
      return;
    }

    const tabId = tab?.id;
    if (typeof tabId !== 'number') {
      return;
    }

    const pageUrl = typeof info?.pageUrl === 'string' ? info.pageUrl : tab?.url || '';
    if (!isSupportedPageUrl(pageUrl)) {
      return;
    }

    try {
      const snapshotResponse = await requestSnapshotFromTab(tabId);
      if (!snapshotResponse || !snapshotResponse.ok) {
        return;
      }

      const payload = normalizeSnapshotPayload(snapshotResponse.payload);
      if (!payload) {
        return;
      }

      dispatchSnapshotPayload(payload, tab?.windowId);
    } catch (_error) {
      // No UI feedback for context menu failures.
    }
  };

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (isSnapshotTriggerMessage(message)) {
      handlePageSnapshotTrigger(message, sender, sendResponse);
      return;
    }

    if (isSnapshotCaptureActiveTabMessage(message)) {
      void handleCaptureActiveTabRequest(sendResponse);
      return true;
    }
  });

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

    void handleContextMenuClick(info, tab);
  });

  if (chrome.contextMenus.onShown) {
    chrome.contextMenus.onShown.addListener((info) => {
      const selectionText = typeof info?.selectionText === 'string' ? info.selectionText.trim() : '';
      const visible = !selectionText;

      chrome.contextMenus.update(
        CONTEXT_MENU_ID,
        {
          visible
        },
        () => {
          void chrome.runtime.lastError;
          chrome.contextMenus.refresh(() => {
            void chrome.runtime.lastError;
          });
        }
      );
    });
  }

  if (settingsApi && typeof settingsApi.onChanged === 'function') {
    settingsApi.onChanged((settings) => {
      applyContextMenuSetting(settings);
    });
  }

  void syncContextMenuFromStorage();
})();
