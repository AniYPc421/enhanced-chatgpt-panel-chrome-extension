(function () {
  'use strict';

  const root = typeof globalThis !== 'undefined' ? globalThis : self;
  const locales = root.__chatgptPanelI18nLocales || (root.__chatgptPanelI18nLocales = {});

  locales['zh-cn'] = Object.freeze({
    extension: Object.freeze({
      actionTitle: 'ChatGPT Panel Chrome 扩展'
    }),
    popup: Object.freeze({
      documentTitle: 'ChatGPT Panel',
      cloudflareLoginMessage:
        '请先登录并通过 <a href="{url}" target="_blank" rel="noreferrer">chatgpt.com</a> 的 Cloudflare 校验',
      loginFirstMessage: '请先在 <a href="{url}" target="_blank" rel="noreferrer">chatgpt.com</a> 登录',
      fetchSessionError: '获取会话失败，请稍后重试。'
    }),
    pageSnapshot: Object.freeze({
      pageButton: Object.freeze({
        text: '上传网页快照',
        busyText: '正在上传...',
        toastTimeout: '网页快照发送超时，请重试',
        toastSent: '网页快照已发送到 ChatGPT Panel',
        toastFailed: '网页快照发送失败，请重试'
      }),
      panelButton: Object.freeze({
        text: '上传网页快照',
        busyText: '正在抓取...',
        statusRequesting: '正在发送快照请求...',
        statusTimeout: '快照请求超时，请重试',
        statusSent: '网页快照已发送',
        statusFailed: '网页快照发送失败'
      })
    }),
    quoteText: Object.freeze({
      contextMenuTitle: '引用文本到 ChatGPT Panel'
    }),
    content: Object.freeze({
      copyDetection: Object.freeze({
        copyTerms: Object.freeze(['copy', '复制']),
        copiedTerms: Object.freeze(['copied', '已复制'])
      })
    })
  });
})();
