(function () {
  'use strict';

  if (window.__chatgptPanelOptionsUi) {
    return;
  }

  const CHECKBOX_IDS = Object.freeze([
    'enablePageSnapshotPageButton',
    'enablePageSnapshotPanelButton',
    'enablePageSnapshotContextMenu',
    'enableQuoteTextContextMenu'
  ]);

  const getDom = () => {
    const statusNode = document.getElementById('options-status');

    const checkboxNodes = CHECKBOX_IDS.reduce((acc, id) => {
      const node = document.getElementById(id);
      if (node instanceof HTMLInputElement) {
        acc[id] = node;
      }
      return acc;
    }, {});

    return {
      statusNode: statusNode instanceof HTMLElement ? statusNode : null,
      titleNode: document.getElementById('options-title'),
      injectionTitleNode: document.getElementById('options-injection-title'),
      contextMenuTitleNode: document.getElementById('options-contextmenu-title'),
      reloadHintNode: document.getElementById('options-reload-hint'),
      checkboxIds: CHECKBOX_IDS,
      checkboxNodes
    };
  };

  let statusTimer = null;

  const setStatus = (dom, text, options = {}) => {
    const statusNode = dom?.statusNode;
    if (!(statusNode instanceof HTMLElement)) {
      return;
    }

    const { isError = false, autoClearMs = 1500 } = options;
    statusNode.textContent = typeof text === 'string' ? text : '';
    statusNode.classList.toggle('is-error', Boolean(isError));

    if (statusTimer) {
      window.clearTimeout(statusTimer);
      statusTimer = null;
    }

    if (autoClearMs > 0) {
      statusTimer = window.setTimeout(() => {
        if (statusNode.isConnected) {
          statusNode.textContent = '';
          statusNode.classList.remove('is-error');
        }
        statusTimer = null;
      }, autoClearMs);
    }
  };

  const applyI18n = (dom, getText) => {
    const t = typeof getText === 'function' ? getText : (_key, fallback) => fallback || '';

    document.title = t('options.documentTitle', 'Enhanced ChatGPT Panel - Options');

    if (dom?.titleNode instanceof HTMLElement) {
      dom.titleNode.textContent = t('options.heading', 'Options');
    }

    if (dom?.injectionTitleNode instanceof HTMLElement) {
      dom.injectionTitleNode.textContent = t('options.sections.injection', 'Button Injection');
    }

    if (dom?.contextMenuTitleNode instanceof HTMLElement) {
      dom.contextMenuTitleNode.textContent = t('options.sections.contextMenu', 'Context Menu');
    }

    const labelMappings = [
      [
        'enablePageSnapshotPageButtonLabel',
        'options.labels.enablePageSnapshotPageButton',
        'Inject snapshot button on non-ChatGPT pages'
      ],
      [
        'enablePageSnapshotPanelButtonLabel',
        'options.labels.enablePageSnapshotPanelButton',
        'Inject snapshot button in ChatGPT side panel'
      ],
      ['enablePageSnapshotContextMenuLabel', 'options.labels.enablePageSnapshotContextMenu', 'Show “Upload Page Snapshot” menu'],
      ['enableQuoteTextContextMenuLabel', 'options.labels.enableQuoteTextContextMenu', 'Show “Quote Text” menu']
    ];

    labelMappings.forEach(([id, key, fallback]) => {
      const node = document.getElementById(id);
      if (node instanceof HTMLElement) {
        node.textContent = t(key, fallback);
      }
    });

    if (dom?.reloadHintNode instanceof HTMLElement) {
      dom.reloadHintNode.textContent = t('options.hints.reloadTabs', 'Some changes require reloading existing tabs.');
    }
  };

  const readSettingsFromUi = (dom) => {
    const checkboxNodes = dom?.checkboxNodes || {};

    return {
      enablePageSnapshotPageButton: Boolean(checkboxNodes.enablePageSnapshotPageButton?.checked),
      enablePageSnapshotPanelButton: Boolean(checkboxNodes.enablePageSnapshotPanelButton?.checked),
      enablePageSnapshotContextMenu: Boolean(checkboxNodes.enablePageSnapshotContextMenu?.checked),
      enableQuoteTextContextMenu: Boolean(checkboxNodes.enableQuoteTextContextMenu?.checked)
    };
  };

  const applySettingsToUi = (dom, settings, defaultSettings) => {
    const checkboxIds = dom?.checkboxIds || [];
    const checkboxNodes = dom?.checkboxNodes || {};

    checkboxIds.forEach((id) => {
      const node = checkboxNodes[id];
      if (!node) {
        return;
      }

      const desired =
        typeof settings?.[id] === 'boolean'
          ? settings[id]
          : typeof defaultSettings?.[id] === 'boolean'
            ? defaultSettings[id]
            : false;
      node.checked = desired;
    });
  };

  const onCheckboxChanged = (dom, handler) => {
    const checkboxIds = dom?.checkboxIds || [];
    const checkboxNodes = dom?.checkboxNodes || {};
    const listener = typeof handler === 'function' ? handler : () => {};

    checkboxIds.forEach((id) => {
      const node = checkboxNodes[id];
      if (!node) {
        return;
      }
      node.addEventListener('change', listener);
    });

    return () => {
      checkboxIds.forEach((id) => {
        const node = checkboxNodes[id];
        if (!node) {
          return;
        }
        node.removeEventListener('change', listener);
      });
    };
  };

  window.__chatgptPanelOptionsUi = Object.freeze({
    getDom,
    setStatus,
    applyI18n,
    readSettingsFromUi,
    applySettingsToUi,
    onCheckboxChanged
  });
})();

