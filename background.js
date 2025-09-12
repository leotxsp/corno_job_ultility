let identifiers = {};
let lastIdentifier = 'download';

// Load identifiers from storage on startup
chrome.storage.local.get('identifiers', (data) => {
  identifiers = data.identifiers || {};
  console.log('Loaded identifiers from storage:', identifiers);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.identifier && sender.tab?.id) {
    let clean = message.identifier.replace(/[\\/:*?"<>|]/g, '_').trim();
    if (clean) {
      identifiers[sender.tab.id] = clean;
      lastIdentifier = clean; 
      chrome.storage.local.set({ identifiers });
      console.log(`Stored identifier for tab ${sender.tab.id}: ${clean} (lastIdentifier: ${lastIdentifier})`);

      // ✅ send tabId back to content.js
      sendResponse({ identifier: clean, tabId: sender.tab.id });
    } else {
      console.warn(`Invalid identifier "${message.identifier}" for tab ${sender.tab.id}, keeping lastIdentifier: ${lastIdentifier}`);
    }
  } else {
    console.warn('Invalid message or tabId:', message, sender);
  }

  // Needed for async responses
  return true;
});

chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
  console.log('Download item:', downloadItem);

  let tabId = downloadItem.tabId;
  let id;

  if (tabId && identifiers[tabId]) {
    id = identifiers[tabId];
  } else {
    id = lastIdentifier || 'download';
  }

  let originalName = downloadItem.filename || '';
  let ext = originalName.includes('.') 
    ? originalName.substring(originalName.lastIndexOf('.')) 
    : '.pdf';

  let suggestedFilename = id + ext;
  console.log(`Suggesting filename: ${suggestedFilename} for tabId: ${tabId ?? "N/A"}`);
  suggest({ filename: suggestedFilename });
});

