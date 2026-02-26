(function () {
  'use strict';

  const root = typeof globalThis !== 'undefined' ? globalThis : self;
  if (root.__chatgptPanelSettings) {
    return;
  }

  const SETTINGS_STORAGE_KEY = 'chatgptPanelSettings';
  const DEFAULT_SETTINGS = Object.freeze({
    enablePageSnapshotPageButton: true,
    enablePageSnapshotPanelButton: true,
    enablePageSnapshotContextMenu: true,
    enableQuoteTextContextMenu: true
  });

  let cachedSettings = null;
  let pendingLoad = null;

  const getStorageArea = () => {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage) {
        return { area: null, areaName: '' };
      }

      if (chrome.storage.sync) {
        return { area: chrome.storage.sync, areaName: 'sync' };
      }

      if (chrome.storage.local) {
        return { area: chrome.storage.local, areaName: 'local' };
      }
    } catch (_error) {
      return { area: null, areaName: '' };
    }

    return { area: null, areaName: '' };
  };

  const normalizeSettings = (value) => {
    const raw = value && typeof value === 'object' ? value : {};
    const normalized = {};

    Object.keys(DEFAULT_SETTINGS).forEach((key) => {
      normalized[key] = typeof raw[key] === 'boolean' ? raw[key] : DEFAULT_SETTINGS[key];
    });

    return normalized;
  };

  const loadSettings = () => {
    return new Promise((resolve) => {
      const { area } = getStorageArea();
      if (!area || typeof area.get !== 'function') {
        resolve({ ...DEFAULT_SETTINGS });
        return;
      }

      area.get([SETTINGS_STORAGE_KEY], (result) => {
        if (chrome.runtime?.lastError) {
          resolve({ ...DEFAULT_SETTINGS });
          return;
        }

        resolve(normalizeSettings(result?.[SETTINGS_STORAGE_KEY]));
      });
    });
  };

  const getSettings = () => {
    if (cachedSettings) {
      return Promise.resolve(cachedSettings);
    }

    if (pendingLoad) {
      return pendingLoad;
    }

    pendingLoad = loadSettings()
      .then((settings) => {
        cachedSettings = settings;
        pendingLoad = null;
        return settings;
      })
      .catch(() => {
        pendingLoad = null;
        cachedSettings = { ...DEFAULT_SETTINGS };
        return cachedSettings;
      });

    return pendingLoad;
  };

  const saveSettings = (settings) => {
    return new Promise((resolve, reject) => {
      const { area } = getStorageArea();
      if (!area || typeof area.set !== 'function') {
        cachedSettings = settings;
        resolve();
        return;
      }

      area.set({ [SETTINGS_STORAGE_KEY]: settings }, () => {
        if (chrome.runtime?.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        cachedSettings = settings;
        resolve();
      });
    });
  };

  const updateSettings = async (partial) => {
    const current = await getSettings();
    const next = normalizeSettings({
      ...current,
      ...(partial && typeof partial === 'object' ? partial : {})
    });

    await saveSettings(next);
    return next;
  };

  const onChanged = (listener) => {
    if (typeof listener !== 'function') {
      return () => {};
    }

    if (!chrome?.storage?.onChanged) {
      return () => {};
    }

    const handler = (changes, areaName) => {
      if (!changes || !(SETTINGS_STORAGE_KEY in changes)) {
        return;
      }

      const next = normalizeSettings(changes[SETTINGS_STORAGE_KEY]?.newValue);
      cachedSettings = next;
      pendingLoad = null;

      try {
        listener(next, { areaName });
      } catch (_error) {
        // Ignore listener errors.
      }
    };

    chrome.storage.onChanged.addListener(handler);
    return () => {
      chrome.storage.onChanged.removeListener(handler);
    };
  };

  root.__chatgptPanelSettings = Object.freeze({
    SETTINGS_STORAGE_KEY,
    DEFAULT_SETTINGS,
    getSettings,
    updateSettings,
    onChanged
  });
})();

