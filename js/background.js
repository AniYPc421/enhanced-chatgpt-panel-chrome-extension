importScripts('data/i18n/en/strings.js', 'data/i18n/zh-cn/strings.js', 'data/i18n/runtime.js', 'storage/storage.js');

const FEATURE_EVENT_TYPES = Object.freeze({
  PAGE_SNAPSHOT_TRIGGER: 'PAGE_SNAPSHOT_TRIGGER',
  PAGE_SNAPSHOT_CAPTURE_ACTIVE_TAB: 'PAGE_SNAPSHOT_CAPTURE_ACTIVE_TAB',
  PAGE_SNAPSHOT_READY: 'PAGE_SNAPSHOT_READY',
  QUOTE_TEXT_READY: 'QUOTE_TEXT_READY'
});

const BRIDGE_PORT_NAME = 'chatgpt-panel-bridge';
const bridgePorts = new Set();
const pendingFeatureEvents = new Map();
const PENDING_EVENT_TTL_MS = 60 * 1000;
const i18n = self.__chatgptPanelI18n;

const getI18nText = (key, fallbackText = '') => {
  const value = i18n && typeof i18n.t === 'function' ? i18n.t(key) : undefined;
  return typeof value === 'string' && value ? value : fallbackText;
};

const sendMessageToTab = (tabId, message) => {
  chrome.tabs.sendMessage(tabId, message, () => {
    void chrome.runtime.lastError;
  });
};

const broadcastToAllTabs = (message) => {
  chrome.tabs.query({}, (tabs) => {
    if (chrome.runtime.lastError) {
      return;
    }

    tabs.forEach((tab) => {
      if (typeof tab.id === 'number') {
        sendMessageToTab(tab.id, message);
      }
    });
  });
};

const postMessageToBridgePorts = (message) => {
  bridgePorts.forEach((port) => {
    try {
      port.postMessage(message);
    } catch (_error) {
      bridgePorts.delete(port);
    }
  });
};

const storePendingFeatureEvent = (message) => {
  if (!message || typeof message.type !== 'string') {
    return;
  }

  pendingFeatureEvents.set(message.type, {
    message,
    expiresAt: Date.now() + PENDING_EVENT_TTL_MS
  });
};

const postPendingEventsToPort = (port) => {
  pendingFeatureEvents.forEach((entry, eventType) => {
    if (!entry || typeof entry.expiresAt !== 'number') {
      pendingFeatureEvents.delete(eventType);
      return;
    }

    if (entry.expiresAt < Date.now()) {
      pendingFeatureEvents.delete(eventType);
      return;
    }

    try {
      port.postMessage(entry.message);
    } catch (_error) {
      return;
    }

    pendingFeatureEvents.delete(eventType);
  });
};

const dispatchFeatureEvent = (message, options = {}) => {
  const { persistForLatePanel = true } = options;

  if (persistForLatePanel) {
    storePendingFeatureEvent(message);
  }

  postMessageToBridgePorts(message);
  broadcastToAllTabs(message);
};

const openSidePanelForWindow = (windowId) => {
  if (typeof windowId !== 'number') {
    return;
  }

  chrome.sidePanel.open({ windowId }, () => {
    if (chrome.runtime.lastError) {
      return;
    }
  });
};

chrome.runtime.onConnect.addListener((port) => {
  if (!port || port.name !== BRIDGE_PORT_NAME) {
    return;
  }

  bridgePorts.add(port);
  postPendingEventsToPort(port);

  port.onDisconnect.addListener(() => {
    bridgePorts.delete(port);
  });
});

self.extensionFeatureBus = {
  dispatchFeatureEvent,
  openSidePanelForWindow,
  FEATURE_EVENT_TYPES
};

importScripts('page-snapshot/background.js', 'quote-text/background.js');

chrome.runtime.onInstalled.addListener(() => {
  chrome.declarativeNetRequest.updateDynamicRules({
    addRules: [
      {
        id: 1,
        priority: 1,
        action: {
          type: 'modifyHeaders',
          responseHeaders: [
            { header: 'content-security-policy', operation: 'remove' },
            { header: 'x-frame-options', operation: 'remove' }
          ]
        },
        condition: {
          urlFilter: 'https://chatgpt.com/*',
          resourceTypes: ['main_frame', 'sub_frame']
        }
      }
    ],
    removeRuleIds: [1]
  });
});

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

if (chrome.action && typeof chrome.action.setTitle === 'function') {
  chrome.action.setTitle({
    title: getI18nText('extension.actionTitle')
  });
}
 
