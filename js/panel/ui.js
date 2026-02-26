(function () {
  'use strict';

  if (window.__chatgptPanelPanelUi) {
    return;
  }

  const renderChatFrame = ({ container, addressPrefix, frameName }) => {
    if (!(container instanceof HTMLElement)) {
      return;
    }

    const baseUrl = typeof addressPrefix === 'string' && addressPrefix ? addressPrefix : 'https://chatgpt.com';
    const name = typeof frameName === 'string' && frameName ? frameName : 'chatgpt-panel-frame';

    container.innerHTML =
      '<iframe name="' +
      name +
      '" scrolling="no" src="' +
      baseUrl +
      '/chat?chatgpt_panel=1" frameborder="0" style="width: 100%; height: 100vh;"></iframe>';
  };

  const renderMessage = ({ container, message }) => {
    if (!(container instanceof HTMLElement)) {
      return;
    }

    const text = typeof message === 'string' ? message : '';
    container.innerHTML = '<div class="extension-body"><div class="notice"><div>' + text + '</div></div></div>';
  };

  window.__chatgptPanelPanelUi = Object.freeze({
    renderChatFrame,
    renderMessage
  });
})();

