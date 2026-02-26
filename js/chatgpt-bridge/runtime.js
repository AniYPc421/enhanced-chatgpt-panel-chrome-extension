(function () {
  'use strict';

  const context = window.__chatgptPanelBridgeContext;
  const bridge = window.__chatgptPanelBridgeCapabilities;
  if (!context || !bridge) {
    return;
  }

  if (!context.isInExtensionSidePanelFrame()) {
    return;
  }

  let reconnectTimer = null;

  const connectBridgePort = () => {
    if (reconnectTimer) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    try {
      const port = chrome.runtime.connect({ name: context.BRIDGE_PORT_NAME });
      port.onMessage.addListener((message) => {
        bridge.emitFeatureEvent(message);
      });
      port.onDisconnect.addListener(() => {
        reconnectTimer = window.setTimeout(() => {
          connectBridgePort();
        }, 500);
      });
    } catch (_error) {
      reconnectTimer = window.setTimeout(() => {
        connectBridgePort();
      }, 500);
    }
  };

  connectBridgePort();

  chrome.runtime.onMessage.addListener((message) => {
    bridge.emitFeatureEvent(message);
  });
})();
