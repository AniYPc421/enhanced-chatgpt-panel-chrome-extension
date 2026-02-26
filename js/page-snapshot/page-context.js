(function () {
  'use strict';

  if (window.top !== window.self) {
    return;
  }

  const REQUEST_EVENT = 'chatgpt-panel:page-snapshot:request-from-page-button';
  const RESULT_EVENT = 'chatgpt-panel:page-snapshot:result-to-page-button';
  const MESSAGE_TYPES = Object.freeze({
    PAGE_SNAPSHOT_TRIGGER: 'PAGE_SNAPSHOT_TRIGGER',
    PAGE_SNAPSHOT_COLLECT_FROM_PAGE: 'PAGE_SNAPSHOT_COLLECT_FROM_PAGE'
  });

  const isSupportedPageProtocol = () => {
    return window.location.protocol === 'http:' || window.location.protocol === 'https:';
  };

  const createDoctypeString = () => {
    const { doctype } = document;
    if (!doctype) {
      return '<!DOCTYPE html>';
    }

    let result = `<!DOCTYPE ${doctype.name}`;
    if (doctype.publicId) {
      result += ` PUBLIC "${doctype.publicId}"`;
    } else if (doctype.systemId) {
      result += ' SYSTEM';
    }

    if (doctype.systemId) {
      result += ` "${doctype.systemId}"`;
    }

    return `${result}>`;
  };

  const sanitizeFileName = (value) => {
    return value.replace(/[\\/:*?"<>|]/g, '_');
  };

  const createSnapshotFileName = () => {
    const host = window.location.hostname || 'page';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return sanitizeFileName(`${host}-${timestamp}.html`);
  };

  const buildSnapshotPayload = () => {
    return {
      featureId: 'page-snapshot',
      html: `${createDoctypeString()}\n${document.documentElement.outerHTML}`,
      pageUrl: window.location.href,
      pageTitle: document.title || '',
      fileName: createSnapshotFileName(),
      capturedAt: new Date().toISOString()
    };
  };

  const sendRuntimeMessage = (message) => {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });
  };

  const emitPageButtonResult = (detail) => {
    window.dispatchEvent(
      new CustomEvent(RESULT_EVENT, {
        detail
      })
    );
  };

  const triggerSnapshotToPanel = async (requestId) => {
    try {
      const payload = buildSnapshotPayload();
      const response = await sendRuntimeMessage({
        type: MESSAGE_TYPES.PAGE_SNAPSHOT_TRIGGER,
        payload
      });

      if (response && response.ok) {
        emitPageButtonResult({
          requestId,
          ok: true
        });
        return;
      }

      emitPageButtonResult({
        requestId,
        ok: false,
        reason: response?.reason || 'trigger_failed'
      });
    } catch (error) {
      emitPageButtonResult({
        requestId,
        ok: false,
        reason: error?.message || 'trigger_error'
      });
    }
  };

  const handlePageButtonRequest = (event) => {
    const requestId = event?.detail?.requestId || '';
    void triggerSnapshotToPanel(requestId);
  };

  const handleCollectSnapshotRequest = (message, _sender, sendResponse) => {
    if (!message || message.type !== MESSAGE_TYPES.PAGE_SNAPSHOT_COLLECT_FROM_PAGE) {
      return;
    }

    try {
      const payload = buildSnapshotPayload();
      sendResponse({
        ok: true,
        payload
      });
    } catch (error) {
      sendResponse({
        ok: false,
        reason: error?.message || 'collect_failed'
      });
    }

    return true;
  };

  if (!isSupportedPageProtocol()) {
    return;
  }

  window.addEventListener(REQUEST_EVENT, handlePageButtonRequest);
  chrome.runtime.onMessage.addListener(handleCollectSnapshotRequest);
})();
