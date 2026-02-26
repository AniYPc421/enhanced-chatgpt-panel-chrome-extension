(function () {
  'use strict';

  const context = window.__chatgptPanelBridgeContext;
  const bridge = window.__chatgptPanelBridgeCapabilities;
  if (!context || !bridge || !context.isInExtensionSidePanelFrame()) {
    return;
  }

  const i18n = window.__chatgptPanelI18n;
  const getI18nText = (key, fallbackText = '') => {
    const value = i18n && typeof i18n.t === 'function' ? i18n.t(key) : undefined;
    return typeof value === 'string' && value ? value : fallbackText;
  };

  const BUTTON_WRAPPER_ID = 'chatgpt-panel-inline-snapshot-wrapper';
  const BUTTON_ID = 'chatgpt-panel-inline-snapshot-button';
  const STATUS_ID = 'chatgpt-panel-inline-snapshot-status';
  const BUTTON_WRAPPER_CLASS = 'chatgpt-panel-inline-snapshot-wrapper';
  const BUTTON_CLASS = 'chatgpt-panel-inline-snapshot-button';
  const STATUS_CLASS = 'chatgpt-panel-inline-snapshot-status';
  const VISIBLE_STATUS_CLASS = 'has-status';
  const BUTTON_BUSY_CLASS = 'is-busy';
  const BUTTON_TEXT = getI18nText('pageSnapshot.panelButton.text');
  const BUTTON_BUSY_TEXT = getI18nText('pageSnapshot.panelButton.busyText');
  const STATUS_REQUESTING_TEXT = getI18nText('pageSnapshot.panelButton.statusRequesting');
  const STATUS_TIMEOUT_TEXT = getI18nText('pageSnapshot.panelButton.statusTimeout');
  const STATUS_SENT_TEXT = getI18nText('pageSnapshot.panelButton.statusSent');
  const STATUS_FAILED_TEXT = getI18nText('pageSnapshot.panelButton.statusFailed');
  const REQUEST_TIMEOUT_MS = 12000;

  let pendingRequestId = null;
  let requestTimeoutTimer = null;

  const findAnchorNode = () => {
    return bridge.findPromptAnchor();
  };

  const findOrCreateStatus = (wrapper) => {
    const existing = wrapper.querySelector(`#${STATUS_ID}`);
    if (existing instanceof HTMLSpanElement) {
      return existing;
    }

    const status = document.createElement('span');
    status.id = STATUS_ID;
    status.className = STATUS_CLASS;
    wrapper.appendChild(status);
    return status;
  };

  const setStatusText = (wrapper, text) => {
    const status = findOrCreateStatus(wrapper);
    const normalizedText = typeof text === 'string' ? text : '';
    status.textContent = normalizedText;
    wrapper.classList.toggle(VISIBLE_STATUS_CLASS, Boolean(normalizedText));
  };

  const setButtonBusyState = (button, isBusy) => {
    button.disabled = isBusy;
    button.textContent = isBusy ? BUTTON_BUSY_TEXT : BUTTON_TEXT;
    button.classList.toggle(BUTTON_BUSY_CLASS, isBusy);
  };

  const clearPendingState = (button, wrapper) => {
    if (requestTimeoutTimer) {
      window.clearTimeout(requestTimeoutTimer);
      requestTimeoutTimer = null;
    }

    pendingRequestId = null;
    setButtonBusyState(button, false);

    window.setTimeout(() => {
      if (wrapper.isConnected) {
        setStatusText(wrapper, '');
      }
    }, 2500);
  };

  const handleButtonClick = (button, wrapper) => {
    if (pendingRequestId) {
      return;
    }

    pendingRequestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setButtonBusyState(button, true);
    setStatusText(wrapper, STATUS_REQUESTING_TEXT);

    requestTimeoutTimer = window.setTimeout(() => {
      if (!pendingRequestId) {
        return;
      }

      setStatusText(wrapper, STATUS_TIMEOUT_TEXT);
      clearPendingState(button, wrapper);
    }, REQUEST_TIMEOUT_MS);

    window.dispatchEvent(
      new CustomEvent(context.PANEL_SNAPSHOT_REQUEST_EVENT, {
        detail: {
          requestId: pendingRequestId,
          source: 'panel-button'
        }
      })
    );
  };

  const handlePanelSnapshotResult = (event) => {
    const requestId = event?.detail?.requestId || '';
    if (!pendingRequestId || requestId !== pendingRequestId) {
      return;
    }

    const wrapper = document.getElementById(BUTTON_WRAPPER_ID);
    const button = document.getElementById(BUTTON_ID);
    if (!(wrapper instanceof HTMLElement) || !(button instanceof HTMLButtonElement)) {
      pendingRequestId = null;
      return;
    }

    const ok = Boolean(event?.detail?.ok);
    if (ok) {
      setStatusText(wrapper, STATUS_SENT_TEXT);
    } else {
      setStatusText(wrapper, STATUS_FAILED_TEXT);
    }

    clearPendingState(button, wrapper);
  };

  const createWrapper = () => {
    const wrapper = document.createElement('div');
    wrapper.id = BUTTON_WRAPPER_ID;
    wrapper.className = BUTTON_WRAPPER_CLASS;

    const button = document.createElement('button');
    button.id = BUTTON_ID;
    button.type = 'button';
    button.className = BUTTON_CLASS;
    button.textContent = BUTTON_TEXT;
    button.addEventListener('click', () => {
      handleButtonClick(button, wrapper);
    });

    wrapper.appendChild(button);
    findOrCreateStatus(wrapper);
    return wrapper;
  };

  const ensureInjected = () => {
    if (document.getElementById(BUTTON_WRAPPER_ID)) {
      return;
    }

    const anchorNode = findAnchorNode();
    if (!(anchorNode instanceof HTMLElement) || !(anchorNode.parentElement instanceof HTMLElement)) {
      return;
    }

    const wrapper = createWrapper();
    anchorNode.parentElement.insertBefore(wrapper, anchorNode);
  };

  const initialize = () => {
    window.addEventListener(context.PANEL_SNAPSHOT_RESULT_EVENT, handlePanelSnapshotResult);
    ensureInjected();

    const observer = new MutationObserver(() => {
      ensureInjected();
    });

    if (document.body) {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
