(function () {
  'use strict';

  if (window.top !== window.self) {
    return;
  }

  const i18n = window.__chatgptPanelI18n;
  const getI18nText = (key, fallbackText = '') => {
    const value = i18n && typeof i18n.t === 'function' ? i18n.t(key) : undefined;
    return typeof value === 'string' && value ? value : fallbackText;
  };

  const settingsApi = window.__chatgptPanelSettings;

  const REQUEST_EVENT = 'chatgpt-panel:page-snapshot:request-from-page-button';
  const RESULT_EVENT = 'chatgpt-panel:page-snapshot:result-to-page-button';
  const BUTTON_ID = 'chatgpt-panel-page-snapshot-button';
  const BUTTON_CLASS = 'chatgpt-panel-page-snapshot-button';
  const BUTTON_BUSY_CLASS = 'is-busy';
  const BUTTON_TEXT = getI18nText('pageSnapshot.pageButton.text');
  const BUTTON_BUSY_TEXT = getI18nText('pageSnapshot.pageButton.busyText');
  const TOAST_TIMEOUT_TEXT = getI18nText('pageSnapshot.pageButton.toastTimeout');
  const TOAST_SENT_TEXT = getI18nText('pageSnapshot.pageButton.toastSent');
  const TOAST_FAILED_TEXT = getI18nText('pageSnapshot.pageButton.toastFailed');
  const TOAST_ID = 'chatgpt-panel-page-snapshot-toast';
  const TOAST_CLASS = 'chatgpt-panel-page-snapshot-toast';
  const TOAST_VISIBLE_CLASS = 'is-visible';
  const REQUEST_TIMEOUT_MS = 10000;

  let pendingRequestId = null;
  let requestTimeoutTimer = null;
  let toastHideTimer = null;

  const findOrCreateToast = () => {
    const existing = document.getElementById(TOAST_ID);
    if (existing) {
      return existing;
    }

    const toast = document.createElement('div');
    toast.id = TOAST_ID;
    toast.className = TOAST_CLASS;
    document.body.appendChild(toast);
    return toast;
  };

  const showToast = (text) => {
    const toast = findOrCreateToast();
    toast.textContent = text;

    if (toastHideTimer) {
      window.clearTimeout(toastHideTimer);
    }

    toast.classList.add(TOAST_VISIBLE_CLASS);
    toastHideTimer = window.setTimeout(() => {
      toast.classList.remove(TOAST_VISIBLE_CLASS);
      toastHideTimer = null;
    }, 2500);
  };

  const setButtonBusyState = (button, isBusy) => {
    button.disabled = isBusy;
    button.textContent = isBusy ? BUTTON_BUSY_TEXT : BUTTON_TEXT;
    button.classList.toggle(BUTTON_BUSY_CLASS, isBusy);
  };

  const clearPendingState = (button) => {
    if (requestTimeoutTimer) {
      window.clearTimeout(requestTimeoutTimer);
      requestTimeoutTimer = null;
    }

    pendingRequestId = null;
    setButtonBusyState(button, false);
  };

  const handleSnapshotClick = (button) => {
    if (pendingRequestId) {
      return;
    }

    pendingRequestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setButtonBusyState(button, true);

    requestTimeoutTimer = window.setTimeout(() => {
      showToast(TOAST_TIMEOUT_TEXT);
      clearPendingState(button);
    }, REQUEST_TIMEOUT_MS);

    window.dispatchEvent(
      new CustomEvent(REQUEST_EVENT, {
        detail: {
          requestId: pendingRequestId,
          source: 'page-button'
        }
      })
    );
  };

  const handleSnapshotResult = (event, button) => {
    const requestId = event?.detail?.requestId || '';
    if (!pendingRequestId || requestId !== pendingRequestId) {
      return;
    }

    const ok = Boolean(event?.detail?.ok);
    if (ok) {
      showToast(TOAST_SENT_TEXT);
    } else {
      showToast(TOAST_FAILED_TEXT);
    }

    clearPendingState(button);
  };

  const createButton = () => {
    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.type = 'button';
    button.className = BUTTON_CLASS;
    button.textContent = BUTTON_TEXT;
    button.addEventListener('click', () => {
      handleSnapshotClick(button);
    });

    window.addEventListener(RESULT_EVENT, (event) => {
      handleSnapshotResult(event, button);
    });

    return button;
  };

  const initializeSnapshotButton = () => {
    if (!document.body || document.getElementById(BUTTON_ID)) {
      return;
    }
    document.body.appendChild(createButton());
  };

  const isSupportedPageProtocol = () => {
    return window.location.protocol === 'http:' || window.location.protocol === 'https:';
  };

  if (!isSupportedPageProtocol()) {
    return;
  }

  const initializeIfEnabled = async () => {
    if (settingsApi && typeof settingsApi.getSettings === 'function') {
      try {
        const settings = await settingsApi.getSettings();
        if (!settings.enablePageSnapshotPageButton) {
          return;
        }
      } catch (_error) {
        // Fall through to default behavior.
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeSnapshotButton, {
        once: true
      });
    } else {
      initializeSnapshotButton();
    }
  };

  void initializeIfEnabled();
})();
