(function () {
  'use strict';

  const context = window.__chatgptPanelBridgeContext;
  const bridge = window.__chatgptPanelBridgeCapabilities;
  if (!context || !bridge || !context.isInExtensionSidePanelFrame()) {
    return;
  }

  const SOURCE_PREFIX = 'File Source URL:';

  const emitPanelSnapshotResult = (detail) => {
    window.dispatchEvent(
      new CustomEvent(context.PANEL_SNAPSHOT_RESULT_EVENT, {
        detail
      })
    );
  };

  const handlePageSnapshotReady = async (payload) => {
    const sourceUrl = typeof payload?.pageUrl === 'string' ? payload.pageUrl : '';
    if (sourceUrl) {
      try {
        await bridge.prependTextToPrompt(`${SOURCE_PREFIX} ${sourceUrl}\n`);
      } catch (_error) {
        // Do not block snapshot upload when prompt prepend fails.
      }
    }

    try {
      await bridge.uploadSnapshotFile(payload);
    } catch (_error) {
      // Keep handler alive if ChatGPT DOM changes.
    }
  };

  const handlePanelSnapshotRequest = async (event) => {
    const requestId = event?.detail?.requestId || '';

    try {
      const response = await bridge.sendRuntimeMessage({
        type: context.MESSAGE_TYPES.PAGE_SNAPSHOT_CAPTURE_ACTIVE_TAB
      });

      emitPanelSnapshotResult({
        requestId,
        ok: Boolean(response?.ok),
        reason: response?.reason || ''
      });
    } catch (error) {
      emitPanelSnapshotResult({
        requestId,
        ok: false,
        reason: error?.message || 'capture_request_failed'
      });
    }
  };

  const handleFeatureEvent = (message) => {
    if (!message || message.type !== context.FEATURE_EVENT_TYPES.PAGE_SNAPSHOT_READY) {
      return;
    }

    void handlePageSnapshotReady(message.payload);
  };

  bridge.onFeatureEvent(handleFeatureEvent);
  window.addEventListener(context.PANEL_SNAPSHOT_REQUEST_EVENT, (event) => {
    void handlePanelSnapshotRequest(event);
  });
})();
