const addressPrefix = 'https://chatgpt.com';
const panelFrameName = 'chatgpt-panel-frame';
const i18n = window.__chatgptPanelI18n;

const getI18nText = (key, params, fallbackText = '') => {
  const value = i18n && typeof i18n.t === 'function' ? i18n.t(key, params) : undefined;
  return typeof value === 'string' && value ? value : fallbackText;
};

const fetchAuthSession = async () => {
  try {
    const response = await fetch(addressPrefix + '/api/auth/session');

    if (response.status === 403) {
      return {
        state: "cloudflare",
        message: getI18nText('popup.cloudflareLoginMessage', { url: addressPrefix }),
      };
    }

    const data = await response.json();
    if (!response.ok || !data.accessToken) {
      return {
        state: "unauthorized",
        message: getI18nText('popup.loginFirstMessage', { url: addressPrefix }),
      };
    }

    return { state: "authorized" };
  } catch (error) {
    console.error("Error fetching session:", error);
    return {
      state: "error",
      message: getI18nText('popup.fetchSessionError')
    };
  }
};

const renderChatFrame = (container) => {
  container.innerHTML =
    '<iframe name="' +
    panelFrameName +
    '" scrolling="no" src="' +
    addressPrefix +
    '/chat?chatgpt_panel=1" frameborder="0" style="width: 100%; height: 100vh;"></iframe>';
};

const renderMessage = (container, message) => {
  container.innerHTML = '<div class="extension-body"><div class="notice"><div>' + message + '</div></div></div>';
};

const initializeBar = async () => {
  document.title = getI18nText('popup.documentTitle');
  const container = document.getElementById("iframe");

  const authStatus = await fetchAuthSession();

  if (authStatus.state === "authorized") {
    renderChatFrame(container);
  } else {
    renderMessage(container, authStatus.message);
  }
};

initializeBar();
