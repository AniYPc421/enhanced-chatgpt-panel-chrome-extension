(function () {
  'use strict';

  const context = window.__chatgptPanelBridgeContext;
  const bridge = window.__chatgptPanelBridgeCapabilities;
  if (!context || !bridge || !context.isInExtensionSidePanelFrame()) {
    return;
  }

  const QUOTE_PREFIX = 'Quoted Text in File:';

  const truncateQuotedText = (text, maxLength = 4000) => {
    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength)}...`;
  };

  const handleQuoteReady = async (payload) => {
    try {
      const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
      if (!text) {
        return;
      }

      const promptText = `${QUOTE_PREFIX} ${truncateQuotedText(text)}\n`;
      await bridge.prependTextToPrompt(promptText);
    } catch (_error) {
      // Keep handler alive if ChatGPT DOM changes.
    }
  };

  bridge.onFeatureEvent((message) => {
    if (!message || message.type !== context.FEATURE_EVENT_TYPES.QUOTE_TEXT_READY) {
      return;
    }

    void handleQuoteReady(message.payload);
  });
})();
