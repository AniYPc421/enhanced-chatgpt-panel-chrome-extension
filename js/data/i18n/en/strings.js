(function () {
  'use strict';

  const root = typeof globalThis !== 'undefined' ? globalThis : self;
  const locales = root.__chatgptPanelI18nLocales || (root.__chatgptPanelI18nLocales = {});

  locales.en = Object.freeze({
    extension: Object.freeze({
      actionTitle: 'ChatGPT Panel Chrome Extension'
    }),
    popup: Object.freeze({
      documentTitle: 'ChatGPT Panel',
      cloudflareLoginMessage:
        'Please login and pass the Cloudflare check at <a href="{url}" target="_blank" rel="noreferrer">chatgpt.com</a>',
      loginFirstMessage: 'Please login at <a href="{url}" target="_blank" rel="noreferrer">chatgpt.com</a> first',
      fetchSessionError: 'Error fetching session. Please try again later.'
    }),
    pageSnapshot: Object.freeze({
      pageButton: Object.freeze({
        text: 'Upload Page Snapshot',
        busyText: 'Uploading...',
        toastTimeout: 'Page snapshot request timed out. Please try again.',
        toastSent: 'Page snapshot sent to ChatGPT Panel',
        toastFailed: 'Failed to send page snapshot. Please try again.'
      }),
      panelButton: Object.freeze({
        text: 'Upload Page Snapshot',
        busyText: 'Capturing...',
        statusRequesting: 'Sending snapshot request...',
        statusTimeout: 'Snapshot request timed out. Please try again.',
        statusSent: 'Page snapshot sent',
        statusFailed: 'Failed to send page snapshot'
      })
    }),
    quoteText: Object.freeze({
      contextMenuTitle: 'Quote Text to ChatGPT Panel'
    }),
    content: Object.freeze({
      copyDetection: Object.freeze({
        copyTerms: Object.freeze(['copy']),
        copiedTerms: Object.freeze(['copied'])
      })
    })
  });
})();
