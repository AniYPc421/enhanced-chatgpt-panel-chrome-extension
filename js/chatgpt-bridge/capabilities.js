(function () {
  'use strict';

  const context = window.__chatgptPanelBridgeContext;
  if (!context || window.__chatgptPanelBridgeCapabilities) {
    return;
  }

  const isTextInputElement = (element) => {
    if (!element) {
      return false;
    }

    if (element instanceof HTMLTextAreaElement) {
      return true;
    }

    if (element instanceof HTMLDivElement) {
      return element.getAttribute('contenteditable') === 'true';
    }

    return false;
  };

  const waitFor = (finder, timeoutMs = 8000, intervalMs = 150) => {
    return new Promise((resolve, reject) => {
      const start = Date.now();

      const timer = window.setInterval(() => {
        const candidate = finder();
        if (candidate) {
          window.clearInterval(timer);
          resolve(candidate);
          return;
        }

        if (Date.now() - start >= timeoutMs) {
          window.clearInterval(timer);
          reject(new Error('wait_for_timeout'));
        }
      }, intervalMs);
    });
  };

  const findPromptInput = () => {
    const selectors = [
      '#prompt-textarea[contenteditable="true"]',
      'div[data-testid="prompt-textarea"][contenteditable="true"]',
      'textarea#prompt-textarea',
      'textarea[data-testid="prompt-textarea"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (isTextInputElement(element)) {
        return element;
      }
    }

    return null;
  };

  const findPromptAnchor = () => {
    const promptInput = findPromptInput();
    if (!promptInput) {
      return null;
    }

    const form = promptInput.closest('form');
    if (form instanceof HTMLElement) {
      return form;
    }

    return promptInput.parentElement;
  };

  const normalizePromptLineBreaks = (text) => {
    return String(text || '').replace(/\r\n?/g, '\n');
  };

  const dispatchPromptInputEvents = (element, inputType) => {
    element.dispatchEvent(
      new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType
      })
    );

    element.dispatchEvent(
      new Event('change', {
        bubbles: true,
        cancelable: true
      })
    );
  };

  const moveTextareaCaretToStart = (element) => {
    element.focus();
    element.setSelectionRange(0, 0);
  };

  const nextTick = () => {
    return new Promise((resolve) => {
      window.setTimeout(resolve, 0);
    });
  };

  const prependPromptParagraphNodes = (element, text) => {
    const lines = normalizePromptLineBreaks(text).split('\n');
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      const paragraph = document.createElement('p');
      if (lines[i].length === 0) {
        paragraph.appendChild(document.createElement('br'));
      } else {
        paragraph.textContent = lines[i];
      }
      element.insertBefore(paragraph, element.firstChild);
    }
  };

  const setPromptText = async (element, insertTextAtStart) => {
    const normalizedText = normalizePromptLineBreaks(insertTextAtStart);
    if (!normalizedText) {
      return;
    }

    if (element instanceof HTMLTextAreaElement) {
      moveTextareaCaretToStart(element);
      if (typeof element.setRangeText === 'function') {
        element.setRangeText(normalizedText, 0, 0, 'end');
      } else {
        document.execCommand('insertText', false, normalizedText);
      }
      await nextTick();
      dispatchPromptInputEvents(element, 'insertText');
      return;
    }

    prependPromptParagraphNodes(element, normalizedText);
    await nextTick();
    dispatchPromptInputEvents(element, 'insertText');
  };

  const prependTextToPrompt = async (text) => {
    const normalizedText = normalizePromptLineBreaks(typeof text === 'string' ? text.trim() : '');
    if (!normalizedText) {
      return;
    }

    const input = await waitFor(findPromptInput);
    input.focus();

    await setPromptText(input, `${normalizedText}\n`);
  };

  const getAttachButton = () => {
    const selectors = [
      'button[aria-label*="Upload"]',
      'button[aria-label*="Attach"]',
      'button[aria-label*="上传"]',
      'button[data-testid*="upload"]',
      'button[data-testid*="attach"]',
      '[role="button"][aria-label*="Upload"]',
      '[role="button"][aria-label*="Attach"]'
    ];

    for (const selector of selectors) {
      const button = document.querySelector(selector);
      if (button instanceof HTMLButtonElement || button instanceof HTMLElement) {
        return button;
      }
    }

    return null;
  };

  const findUploadInput = () => {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    for (const fileInput of fileInputs) {
      if (!(fileInput instanceof HTMLInputElement)) {
        continue;
      }

      if (!fileInput.disabled) {
        return fileInput;
      }
    }

    return null;
  };

  const waitForUploadInput = async () => {
    const existingInput = findUploadInput();
    if (existingInput) {
      return existingInput;
    }

    const attachButton = getAttachButton();
    if (attachButton) {
      attachButton.click();
    }

    return waitFor(findUploadInput);
  };

  const assignFileToInput = (fileInput, file) => {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);

    try {
      fileInput.files = dataTransfer.files;
    } catch (_error) {
      Object.defineProperty(fileInput, 'files', {
        value: dataTransfer.files,
        configurable: true
      });
    }

    fileInput.dispatchEvent(
      new Event('input', {
        bubbles: true,
        cancelable: true
      })
    );

    fileInput.dispatchEvent(
      new Event('change', {
        bubbles: true,
        cancelable: true
      })
    );
  };

  const uploadSnapshotFile = async (payload) => {
    if (!payload || typeof payload.html !== 'string' || !payload.html.trim()) {
      return;
    }

    const fileName =
      typeof payload.fileName === 'string' && payload.fileName ? payload.fileName : 'page-snapshot.html';
    const file = new File([payload.html], fileName, { type: 'text/html' });
    const fileInput = await waitForUploadInput();
    assignFileToInput(fileInput, file);
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

  const emitFeatureEvent = (message) => {
    window.dispatchEvent(
      new CustomEvent(context.FEATURE_EVENT_NAME, {
        detail: message
      })
    );
  };

  const onFeatureEvent = (handler) => {
    const listener = (event) => {
      handler(event?.detail);
    };

    window.addEventListener(context.FEATURE_EVENT_NAME, listener);

    return () => {
      window.removeEventListener(context.FEATURE_EVENT_NAME, listener);
    };
  };

  window.__chatgptPanelBridgeCapabilities = {
    waitFor,
    findPromptInput,
    findPromptAnchor,
    prependTextToPrompt,
    uploadSnapshotFile,
    sendRuntimeMessage,
    emitFeatureEvent,
    onFeatureEvent
  };
})();
