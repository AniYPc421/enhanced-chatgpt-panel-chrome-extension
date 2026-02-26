(function() {
  'use strict';

  const i18n = window.__chatgptPanelI18n;

  const normalizeTerms = (terms, fallbackTerms) => {
    const values = Array.isArray(terms) ? terms : fallbackTerms;
    return values
      .map((term) => String(term || '').trim().toLowerCase())
      .filter(Boolean);
  };

  const getI18nTerms = (key, fallbackTerms) => {
    const value = i18n && typeof i18n.t === 'function' ? i18n.t(key) : undefined;
    return normalizeTerms(value, fallbackTerms);
  };

  const copyTerms = getI18nTerms('content.copyDetection.copyTerms', ['copy']);
  const copiedTerms = getI18nTerms('content.copyDetection.copiedTerms', ['copied']);

  const containsTerm = (text, terms) => {
    return terms.some((term) => text.includes(term));
  };

  const setTextAreaValue = (textArea, text) => {
    textArea.value = text;
  };

  const setTextAreaHiddenStyles = (textArea) => {
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.style.left = '-9999px';
  };

  const createHiddenTextArea = (text) => {
    const textArea = document.createElement('textarea');
    setTextAreaValue(textArea, text);
    setTextAreaHiddenStyles(textArea);
    return textArea;
  };

  const executeCopyCommand = (textArea) => {
    textArea.select();
    document.execCommand('copy');
  };

  const removeTextArea = (textArea) => {
    document.body.removeChild(textArea);
  };

  const appendTextAreaToBody = (textArea) => {
    document.body.appendChild(textArea);
  };

  const copyUsingTextArea = (textArea) => {
    executeCopyCommand(textArea);
    removeTextArea(textArea);
  };

  const copyTextViaExecCommand = (text) => {
    const textArea = createHiddenTextArea(text);
    appendTextAreaToBody(textArea);
    copyUsingTextArea(textArea);
    return true;
  };

  const copyTextToClipboard = (text) => {
    return copyTextViaExecCommand(text);
  };

  const getButtonAttributes = (button) => {
    return {
      label: button.getAttribute('aria-label') || '',
      text: button.textContent || '',
      id: button.id || '',
      className: button.className || ''
    };
  };

  const isCopyButtonLabel = (attributes) => {
    const lowerLabel = attributes.label.toLowerCase();
    return containsTerm(lowerLabel, copyTerms) && !containsTerm(lowerLabel, copiedTerms);
  };

  const isCopyButtonByAttributes = (attributes) => {
    return containsTerm(attributes.label.toLowerCase(), copyTerms) ||
           containsTerm(attributes.text.toLowerCase(), copyTerms) ||
           containsTerm(attributes.id.toLowerCase(), copyTerms) ||
           containsTerm(attributes.className.toLowerCase(), copyTerms);
  };

  const isCopyButtonByTestId = (button) => {
    return button.querySelector('[data-testid*="copy"]') ||
           button.closest('[data-testid*="copy"]');
  };

  const isCopyButton = (button) => {
    const attributes = getButtonAttributes(button);
    return isCopyButtonLabel(attributes) &&
           (isCopyButtonByAttributes(attributes) || isCopyButtonByTestId(button));
  };

  const findCodeBlockInParent = (button) => {
    return button.closest('div')?.querySelector('code') ||
           button.closest('pre')?.querySelector('code') ||
           button.closest('div')?.querySelector('pre code') ||
           button.closest('[class*="code"]')?.querySelector('code');
  };

  const findCodeBlockFallback = () => {
    return document.querySelector('pre code:last-of-type');
  };

  const findAssociatedCodeBlock = (button) => {
    return findCodeBlockInParent(button) || findCodeBlockFallback();
  };

  const extractTextFromCodeBlock = (codeBlock) => {
    return codeBlock.textContent || codeBlock.innerText;
  };

  const hasValidText = (text) => {
    return text && text.trim();
  };

  const processCodeBlockForCopy = (codeBlock) => {
    const textToCopy = extractTextFromCodeBlock(codeBlock);
    if (hasValidText(textToCopy)) {
      copyTextToClipboard(textToCopy);
    }
  };

  const handleCopyButtonClick = (button) => {
    const codeBlock = findAssociatedCodeBlock(button);
    if (codeBlock) {
      processCodeBlockForCopy(codeBlock);
    }
  };

  const handleClickEvent = (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    if (isCopyButton(button)) {
      handleCopyButtonClick(button);
    }
  };

  const isCtrlCKeyPress = (event) => {
    return event.ctrlKey && event.key === 'c';
  };

  const getSelectedText = () => {
    return window.getSelection().toString();
  };

  const hasValidSelection = () => {
    const selection = window.getSelection();
    return selection.rangeCount > 0 && selection.toString().trim().length > 0;
  };

  const getCommonAncestorContainer = (range) => {
    return range.commonAncestorContainer;
  };

  const findCodeBlockParent = (node) => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      return node.closest('code, pre');
    }
    return node.parentElement?.closest('code, pre');
  };

  const isSelectionInsideCodeBlock = () => {
    const selection = window.getSelection();
    if (selection.rangeCount === 0) return false;
    const range = selection.getRangeAt(0);
    const ancestorContainer = getCommonAncestorContainer(range);
    return findCodeBlockParent(ancestorContainer);
  };

  const handleCtrlCKeyPress = (event) => {
    if (!hasValidSelection()) return;
    if (!isSelectionInsideCodeBlock()) return;

    event.preventDefault();
    const textToCopy = getSelectedText();
    if (hasValidText(textToCopy)) {
      copyTextToClipboard(textToCopy);
    }
  };

  const handleKeyDownEvent = (event) => {
    if (isCtrlCKeyPress(event)) {
      handleCtrlCKeyPress(event);
    }
  };

  const attachClickEventListener = () => {
    document.addEventListener('click', handleClickEvent, true);
  };

  const attachKeyDownEventListener = () => {
    document.addEventListener('keydown', handleKeyDownEvent, true);
  };

  const initializeOnDOMReady = () => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachClickEventListener);
      document.addEventListener('DOMContentLoaded', attachKeyDownEventListener);
    } else {
      attachClickEventListener();
      attachKeyDownEventListener();
    }
  };

  const initializeCopyEnhancement = () => {
    initializeOnDOMReady();
  };

  initializeCopyEnhancement();

})();
