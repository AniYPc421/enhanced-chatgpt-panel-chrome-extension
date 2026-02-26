(function () {
  'use strict';

  const settingsApi = window.__chatgptPanelSettings;
  const ui = window.__chatgptPanelOptionsUi;
  if (!settingsApi || !ui) {
    return;
  }

  const i18n = window.__chatgptPanelI18n;
  const getI18nText = (key, fallbackText = '') => {
    const value = i18n && typeof i18n.t === 'function' ? i18n.t(key) : undefined;
    return typeof value === 'string' && value ? value : fallbackText;
  };

  let dom = null;

  const saveSettings = async () => {
    ui.setStatus(dom, getI18nText('options.status.saving', 'Saving...'), { autoClearMs: 0 });

    try {
      const settings = await settingsApi.updateSettings(ui.readSettingsFromUi(dom));
      ui.applySettingsToUi(dom, settings, settingsApi.DEFAULT_SETTINGS);
      ui.setStatus(dom, getI18nText('options.status.saved', 'Saved'));
    } catch (error) {
      ui.setStatus(dom, getI18nText('options.status.saveFailed', 'Failed to save settings.'), {
        isError: true,
        autoClearMs: 2500
      });
      console.error(error);
    }
  };

  const attachHandlers = () => {
    ui.onCheckboxChanged(dom, () => {
      void saveSettings();
    });

    if (typeof settingsApi.onChanged === 'function') {
      settingsApi.onChanged((nextSettings) => {
        ui.applySettingsToUi(dom, nextSettings, settingsApi.DEFAULT_SETTINGS);
      });
    }
  };

  const initialize = async () => {
    dom = ui.getDom();
    ui.applyI18n(dom, getI18nText);

    try {
      const settings = await settingsApi.getSettings();
      ui.applySettingsToUi(dom, settings, settingsApi.DEFAULT_SETTINGS);
    } catch (_error) {
      ui.applySettingsToUi(dom, settingsApi.DEFAULT_SETTINGS, settingsApi.DEFAULT_SETTINGS);
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

