let identifiers = {};
let lastDrugname = 'download';
let lastContract = '';

// Load identifiers and persistent data from storage on startup
chrome.storage.local.get(['identifiers', 'lastDrugname', 'lastContract'], (data) => {
  identifiers = data.identifiers || {};
  lastDrugname = data.lastDrugname || 'download';
  lastContract = data.lastContract || '';
  console.log('Loaded from storage - identifiers:', identifiers, 'lastDrugname:', lastDrugname, 'lastContract:', lastContract);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.identifier && sender.tab?.id) {
    let clean = message.identifier.replace(/[\\/:*?"<>|]/g, '_').trim();
    if (clean) {
      identifiers[sender.tab.id] = clean;
      
      // Update persistent storage based on URL type
      chrome.tabs.get(sender.tab.id, (tab) => {
        if (tab.url) {
          if (/\/nextgendrugall\/\d+$/.test(tab.url)) {
            lastDrugname = clean;
            chrome.storage.local.set({ lastDrugname: clean });
            console.log(`Updated lastDrugname: ${clean}`);
          } else if (/\/nextgendealall\//.test(tab.url)) {
            lastContract = clean;
            chrome.storage.local.set({ lastContract: clean });
            console.log(`Updated lastContract: ${clean}`);
          }
        }
      });
      
      chrome.storage.local.set({ identifiers });
      console.log(`Stored identifier for tab ${sender.tab.id}: ${clean}`);

      sendResponse({ identifier: clean, tabId: sender.tab.id });
    } else {
      console.warn(`Invalid identifier "${message.identifier}" for tab ${sender.tab.id}`);
    }
  } else {
    console.warn('Invalid message or tabId:', message, sender);
  }

  // Needed for async responses
  return true;
});

chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
  console.log('Download item:', downloadItem);
  console.log('Available data - lastDrugname:', lastDrugname, 'lastContract:', lastContract);

  let tabId = downloadItem.tabId;
  let combinedName;

  // Try to get the most specific identifier first
  if (tabId && identifiers[tabId]) {
    combinedName = identifiers[tabId];
    console.log(`Using tab-specific identifier: ${combinedName}`);
  } else {
    // Combine drugname and contract name with hyphen
    if (lastDrugname && lastContract && lastDrugname !== 'download' && lastContract !== 'N/A') {
      combinedName = `${lastDrugname} - ${lastContract}`;
      console.log(`Combined drugname and contract: ${combinedName}`);
    } else if (lastDrugname && lastDrugname !== 'download') {
      combinedName = lastDrugname;
      console.log(`Using drugname only: ${combinedName}`);
    } else if (lastContract && lastContract !== 'N/A') {
      combinedName = lastContract;
      console.log(`Using contract only: ${combinedName}`);
    } else {
      combinedName = 'download';
      console.log('Using default name: download');
    }
  }

  let originalName = downloadItem.filename || '';
  let ext = originalName.includes('.') 
    ? originalName.substring(originalName.lastIndexOf('.')) 
    : '.pdf';

  // Clean the combined name (remove any invalid characters)
  let cleanName = combinedName.replace(/[\\/:*?"<>|]/g, '_').trim();
  
  let suggestedFilename = cleanName + ext;
  console.log(`Suggesting filename: ${suggestedFilename} for tabId: ${tabId ?? "N/A"}`);
  suggest({ filename: suggestedFilename });
});

// Function to send identifier (if needed elsewhere)
function sendIdentifier() {
  // This function can be used if needed by other parts of the extension
}