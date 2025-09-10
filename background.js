let identifiers = {};
let lastIdentifier = "download"; // Fallback for downloads without tabId

// Load identifiers from storage on startup
chrome.storage.local.get("identifiers", (data) => {
  identifiers = data.identifiers || {};
  console.log("Loaded identifiers from storage:", identifiers);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.identifier && sender.tab?.id) {
    let clean = message.identifier.replace(/[\\/:*?"<>|]/g, "_").trim();
    if (clean) {
      identifiers[sender.tab.id] = clean;
      lastIdentifier = clean; // Store last identifier as fallback
      chrome.storage.local.set({ identifiers });
      console.log(`Stored identifier for tab ${sender.tab.id}: ${clean}`);
    }
  } else {
    console.warn("Invalid message or tabId:", message, sender);
  }
});

chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
  console.log("Download item:", downloadItem); // Debug full downloadItem
  let tabId = downloadItem.tabId;
  let id = identifiers[tabId] || lastIdentifier || "download";
  let originalName = downloadItem.filename || "";
  let ext = originalName.includes(".") ? originalName.substring(originalName.lastIndexOf(".")) : ".pdf";

  // Restrict to PDFs only (optional, remove if you want to rename all files)
  if (ext.toLowerCase() === ".pdf") {
    let suggestedFilename = id + ext;
    console.log(`Suggesting filename: ${suggestedFilename} for tabId: ${tabId}`);
    suggest({ filename: suggestedFilename });
  } else {
    console.log(`Non-PDF download, using default filename: ${originalName}`);
    suggest(); // Use default filename for non-PDFs
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete identifiers[tabId];
  chrome.storage.local.set({ identifiers });
  console.log(`Cleared identifier for tab ${tabId}`);
});