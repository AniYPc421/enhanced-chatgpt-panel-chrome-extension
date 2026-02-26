(function () {
  'use strict';

  const root = typeof globalThis !== 'undefined' ? globalThis : self;
  const locales = root.__chatgptPanelI18nLocales || (root.__chatgptPanelI18nLocales = {});

  locales['zh-cn'] = Object.freeze({
    extension: Object.freeze({
      actionTitle: 'Enhanced ChatGPT Panel Chrome 扩展'
    }),
    popup: Object.freeze({
      documentTitle: 'Enhanced ChatGPT Panel',
      cloudflareLoginMessage:
        '请先登录并通过 <a href="{url}" target="_blank" rel="noreferrer">chatgpt.com</a> 的 Cloudflare 校验',
      loginFirstMessage: '请先在 <a href="{url}" target="_blank" rel="noreferrer">chatgpt.com</a> 登录',
      fetchSessionError: '获取会话失败，请稍后重试。'
    }),
    pageSnapshot: Object.freeze({
      contextMenuTitle: '上传网页快照到 Enhanced ChatGPT Panel',
      pageButton: Object.freeze({
        text: '上传网页快照',
        busyText: '正在上传...',
        toastTimeout: '网页快照发送超时，请重试',
        toastSent: '网页快照已发送到 Enhanced ChatGPT Panel',
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
      contextMenuTitle: '引用文本到 Enhanced ChatGPT Panel'
    }),
    options: Object.freeze({
      documentTitle: 'Enhanced ChatGPT Panel - 选项',
      heading: '选项',
      sections: Object.freeze({
        injection: '按钮注入',
        contextMenu: '右键菜单'
      }),
      labels: Object.freeze({
        enablePageSnapshotPageButton: '在非 ChatGPT 页面注入快照按钮',
        enablePageSnapshotPanelButton: '在侧栏 ChatGPT 页面注入快照按钮',
        enablePageSnapshotContextMenu: '启用“上传网页快照”右键菜单',
        enableQuoteTextContextMenu: '启用“引用文本”右键菜单'
      }),
      hints: Object.freeze({
        reloadTabs: '部分修改需要刷新已打开的页面后生效。'
      }),
      status: Object.freeze({
        saving: '正在保存...',
        saved: '已保存',
        saveFailed: '保存失败，请重试。'
      })
    }),
    content: Object.freeze({
      copyDetection: Object.freeze({
        copyTerms: Object.freeze(['copy', '复制']),
        copiedTerms: Object.freeze(['copied', '已复制'])
      })
    })
  });
})();
