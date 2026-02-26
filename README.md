
# Enhanced ChatGPT Panel Chrome Extension

## Overview

This Chrome extension integrates ChatGPT directly into your browser's side panel, allowing users to interact with ChatGPT seamlessly while browsing the web. The extension makes it convenient to access ChatGPT without opening a new tab or navigating away from the current page.

## Preview

<div><img src="https://i.imgur.com/ISmP3Ai.png" width="80%"></div>

## Features

- **Side Panel Integration:** ChatGPT is accessible from the browser's side panel.
- **Session Authentication:** The extension checks the user's authentication status with ChatGPT and prompts login if necessary.
- **Customizable Chat Frame:** Once authenticated, a chat frame is rendered inside the panel for easy access to ChatGPT.
- **Header Modifications:** Automatically removes content security policy and frame options from requests to ensure ChatGPT functions properly in the panel.
- **Page Snapshot Upload (`page-snapshot`):**
  - Injects an "Upload Page Snapshot" button on regular pages and sends HTML snapshot files to the ChatGPT panel upload flow.
  - Injects an "Upload Page Snapshot" button above the side-panel ChatGPT prompt to capture the current active page and upload it directly.
  - Adds a right-click action to upload the current page snapshot (shown only when no text is selected).
- **Quote Text to Prompt (`quote-text`):** Adds a context-menu action to inject selected text into the side-panel prompt.
- **Options Page:** Toggle page-button injection, panel-button injection, and the two context-menu features (persisted via `chrome.storage.sync`).
- **Scoped ChatGPT Injection:** Prompt/file automation runs only in the extension side-panel ChatGPT iframe, not in standalone `chatgpt.com` tabs.

## Installation

1. Clone or download the project files.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the directory containing the extension files.
5. The extension will now appear in the Chrome extensions list and can be accessed from the toolbar.
6. (Optional) Open the extension details page and click **Extension options** to configure button injection and context-menu toggles.

## Permissions

- **sidePanel:** Allows the extension to add content to the browser's side panel.
- **declarativeNetRequest & declarativeNetRequestWithHostAccess:** Used to modify the headers of the network requests to ensure the embedded ChatGPT interface works smoothly.
- **contextMenus:** Adds the page-snapshot / quote-text right-click actions.
- **storage:** Persists Options settings.
- **Host access (`http/https` + `chatgpt.com`):** Required for webpage snapshot injection and panel-side ChatGPT integration.

## How It Works

1. When the extension is loaded, the side panel becomes available, showing either the ChatGPT login prompt or the chat interface.
2. The `popup.js` file checks the user's session status and handles rendering the appropriate content inside the side panel.
3. If the user is authenticated, an iframe displaying ChatGPT is shown.
4. The extension modifies specific request headers to prevent `content-security-policy` and `x-frame-options` from blocking the integration.
5. A page-level content script can capture the current HTML and dispatch it to the side panel ChatGPT bridge as an upload file.
6. A page-snapshot context-menu action can also request a snapshot from the current tab and upload it to the panel.
7. A quote-text context-menu action can dispatch selected text and prepend it to the prompt in the side panel.
8. Options settings are stored in `chrome.storage.sync` and are applied to button injection + context menus.

## Troubleshooting

- **Unauthorized or Cloudflare Error:** Ensure you are logged in to ChatGPT and have passed any security checks.
- **Error fetching session:** This may occur if there is an issue with network connectivity. Try refreshing the panel or reloading the extension.

## License

This project is licensed under the MIT License.
