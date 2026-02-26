(function () {
  'use strict';

  const settingsApi = window.__chatgptPanelSettings;
  if (!settingsApi) {
    return;
  }

  const i18n = window.__chatgptPanelI18n;
  const getI18nText = (key, fallbackText = '') => {
    const value = i18n && typeof i18n.t === 'function' ? i18n.t(key) : undefined;
    return typeof value === 'string' && value ? value : fallbackText;
  };

  const statusNode = document.getElementById('options-status');
  const titleNode = document.getElementById('options-title');
  const injectionTitleNode = document.getElementById('options-injection-title');
  const contextMenuTitleNode = document.getElementById('options-contextmenu-title');
  const reloadHintNode = document.getElementById('options-reload-hint');

  const checkboxIds = Object.freeze([
    'enablePageSnapshotPageButton',
    'enablePageSnapshotPanelButton',
    'enablePageSnapshotContextMenu',
    'enableQuoteTextContextMenu'
  ]);

  const checkboxNodes = checkboxIds.reduce((acc, id) => {
    const node = document.getElementById(id);
    if (node instanceof HTMLInputElement) {
      acc[id] = node;
    }
    return acc;
  }, {});

  let statusTimer = null;

  const setStatus = (text, options = {}) => {
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

  const applyI18n = () => {
    document.title = getI18nText('options.documentTitle', 'Enhanced ChatGPT Panel - Options');

    if (titleNode) {
      titleNode.textContent = getI18nText('options.heading', 'Options');
    }

    if (injectionTitleNode) {
      injectionTitleNode.textContent = getI18nText('options.sections.injection', 'Button Injection');
    }

    if (contextMenuTitleNode) {
      contextMenuTitleNode.textContent = getI18nText('options.sections.contextMenu', 'Context Menu');
    }

    const labelMappings = [
      ['enablePageSnapshotPageButtonLabel', 'options.labels.enablePageSnapshotPageButton', 'Inject snapshot button on non-ChatGPT pages'],
      ['enablePageSnapshotPanelButtonLabel', 'options.labels.enablePageSnapshotPanelButton', 'Inject snapshot button in ChatGPT side panel'],
      ['enablePageSnapshotContextMenuLabel', 'options.labels.enablePageSnapshotContextMenu', 'Show “Upload Page Snapshot” menu'],
      ['enableQuoteTextContextMenuLabel', 'options.labels.enableQuoteTextContextMenu', 'Show “Quote Text” menu']
    ];

    labelMappings.forEach(([id, key, fallback]) => {
      const node = document.getElementById(id);
      if (node instanceof HTMLElement) {
        node.textContent = getI18nText(key, fallback);
      }
    });

    if (reloadHintNode) {
      reloadHintNode.textContent = getI18nText('options.hints.reloadTabs', 'Some changes require reloading existing tabs.');
    }
  };

  const readSettingsFromUi = () => {
    return {
      enablePageSnapshotPageButton: Boolean(checkboxNodes.enablePageSnapshotPageButton?.checked),
      enablePageSnapshotPanelButton: Boolean(checkboxNodes.enablePageSnapshotPanelButton?.checked),
      enablePageSnapshotContextMenu: Boolean(checkboxNodes.enablePageSnapshotContextMenu?.checked),
      enableQuoteTextContextMenu: Boolean(checkboxNodes.enableQuoteTextContextMenu?.checked)
    };
  };

  const applySettingsToUi = (settings) => {
    checkboxIds.forEach((id) => {
      const node = checkboxNodes[id];
      if (!node) {
        return;
      }

      const desired = typeof settings?.[id] === 'boolean' ? settings[id] : settingsApi.DEFAULT_SETTINGS[id];
      node.checked = desired;
    });
  };

  const saveSettings = async () => {
    setStatus(getI18nText('options.status.saving', 'Saving...'), { autoClearMs: 0 });

    try {
      const settings = await settingsApi.updateSettings(readSettingsFromUi());
      applySettingsToUi(settings);
      setStatus(getI18nText('options.status.saved', 'Saved'));
    } catch (error) {
      setStatus(getI18nText('options.status.saveFailed', 'Failed to save settings.'), { isError: true, autoClearMs: 2500 });
      console.error(error);
    }
  };

  const attachHandlers = () => {
    checkboxIds.forEach((id) => {
      const node = checkboxNodes[id];
      if (!node) {
        return;
      }

      node.addEventListener('change', () => {
        void saveSettings();
      });
    });

    settingsApi.onChanged((nextSettings) => {
      applySettingsToUi(nextSettings);
    });
  };

  const initialize = async () => {
    applyI18n();

    try {
      const settings = await settingsApi.getSettings();
      applySettingsToUi(settings);
    } catch (_error) {
      applySettingsToUi(settingsApi.DEFAULT_SETTINGS);
    }

    attachHandlers();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      void initialize();
    });
  } else {
    void initialize();
  }
})();

