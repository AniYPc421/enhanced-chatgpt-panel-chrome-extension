(function () {
  'use strict';

  if (window.__chatgptPanelBridgeContext) {
    return;
  }

  const BRIDGE_PORT_NAME = 'chatgpt-panel-bridge';
  const FEATURE_EVENT_NAME = 'chatgpt-panel:bridge:feature-event';
  const PANEL_FRAME_NAME = 'chatgpt-panel-frame';
  const PANEL_SNAPSHOT_REQUEST_EVENT = 'chatgpt-panel:panel-snapshot:request';
  const PANEL_SNAPSHOT_RESULT_EVENT = 'chatgpt-panel:panel-snapshot:result';

  const FEATURE_EVENT_TYPES = Object.freeze({
    PAGE_SNAPSHOT_READY: 'PAGE_SNAPSHOT_READY',
    QUOTE_TEXT_READY: 'QUOTE_TEXT_READY'
  });

  const MESSAGE_TYPES = Object.freeze({
    PAGE_SNAPSHOT_CAPTURE_ACTIVE_TAB: 'PAGE_SNAPSHOT_CAPTURE_ACTIVE_TAB'
  });

  const isInExtensionSidePanelFrame = () => {
    if (window.top === window.self) {
      return false;
    }

    if (window.name === PANEL_FRAME_NAME) {
      return true;
    }

    const expectedReferrerPrefix = `chrome-extension://${chrome.runtime.id}/`;
    if (typeof document.referrer === 'string' && document.referrer.startsWith(expectedReferrerPrefix)) {
      return true;
    }

    if (window.location.search.includes('chatgpt_panel=1')) {
      return true;
    }

    try {
      const { ancestorOrigins } = window.location;
      if (ancestorOrigins && ancestorOrigins.length > 0) {
        const topAncestor = ancestorOrigins[ancestorOrigins.length - 1];
        return typeof topAncestor === 'string' && topAncestor.startsWith(expectedReferrerPrefix);
      }
    } catch (_error) {
      return false;
    }

    return false;
  };

  window.__chatgptPanelBridgeContext = {
    BRIDGE_PORT_NAME,
    FEATURE_EVENT_NAME,
    PANEL_FRAME_NAME,
    PANEL_SNAPSHOT_REQUEST_EVENT,
    PANEL_SNAPSHOT_RESULT_EVENT,
    FEATURE_EVENT_TYPES,
    MESSAGE_TYPES,
    isInExtensionSidePanelFrame
  };
})();
