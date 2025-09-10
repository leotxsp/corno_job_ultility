let latestIdentifier = "download";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.identifier) {
    latestIdentifier = message.identifier.replace(/[\\/:*?"<>|]/g, "_");
  }
});

chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
   if (downloadItem.mime === "application/pdf") {
    let newName = latestIdentifier + ".pdf";
        suggest({ filename: newName });
  } else {
        suggest();
  }
});