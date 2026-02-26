(function () {
  'use strict';

  if (!self.extensionFeatureBus) {
    return;
  }

  const { FEATURE_EVENT_TYPES, dispatchFeatureEvent, openSidePanelForWindow } = self.extensionFeatureBus;
  const MESSAGE_TYPES = Object.freeze({
    PAGE_SNAPSHOT_COLLECT_FROM_PAGE: 'PAGE_SNAPSHOT_COLLECT_FROM_PAGE'
  });

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

  const isSupportedActiveTabUrl = (url) => {
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
      if (!isSupportedActiveTabUrl(activeTab.url)) {
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
})();
