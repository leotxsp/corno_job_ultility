function getIdentifier() {
  return new Promise((resolve) => {
    chrome.storage.local.get('selector', (data) => {
      const selector = data.selector || '.AppHeader-context-item-label'; // Fallback selector
      let el = document.querySelector(selector)?.innerText || 'download';
      console.log(`Retrieved identifier using selector "${selector}": ${el}`);
      resolve(el);
    });
  });
}

async function sendIdentifier() {
  if (chrome.runtime?.id) {
    let identifier = await getIdentifier();
    chrome.runtime.sendMessage({ identifier }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("Message failed:", chrome.runtime.lastError);
        return;
      }
      if (response) {
        console.log("Response from background:", response);
        updateDebugWidget(`TabID: ${response.tabId}\nIdentifier: ${response.identifier}`);
      } else {
        updateDebugWidget(`Identifier: ${identifier}\n(TabID not received)`);
      }
    });
  } else {
    console.warn('Extension context invalidated, cannot send message.');
  }
}


// Send identifier only when a potential download link or button is clicked
document.addEventListener('click', async (e) => {
  // Check if the click is on a download-related element
  const isDownloadLink = e.target.tagName === 'A' && (e.target.href.endsWith('.pdf') || e.target.hasAttribute('download'));
  const isDownloadButton = e.target.closest('button') || e.target.closest('[role="button"]');
  if (isDownloadLink || isDownloadButton) {
    await sendIdentifier();
  }
});

// Monitor DOM changes only for the target element
chrome.storage.local.get('selector', (data) => {
  const selector = data.selector || '.AppHeader-context-item-label';
  const targetElement = document.querySelector(selector);
  if (targetElement) {
    const observer = new MutationObserver(async () => {
      await sendIdentifier();
    });
    observer.observe(targetElement, { characterData: true, childList: true, subtree: true });
    console.log(`Observing mutations on element with selector "${selector}"`);
  } else {
    console.warn(`No element found for selector "${selector}", mutation observation skipped.`);
  }
});

console.log('Content script loaded');
sendIdentifier();
// === Debug Widget ===
function createDebugWidget() {
  // Prevent multiple widgets
  if (document.getElementById("pdf-auto-naming-widget")) return;

  const widget = document.createElement("div");
  widget.id = "pdf-auto-naming-widget";
  widget.style.position = "fixed";
  widget.style.bottom = "20px";
  widget.style.right = "20px";
  widget.style.background = "rgba(0,0,0,0.8)";
  widget.style.color = "white";
  widget.style.padding = "10px";
  widget.style.borderRadius = "8px";
  widget.style.fontSize = "14px";
  widget.style.zIndex = "999999";
  widget.style.maxWidth = "250px";
  widget.style.fontFamily = "monospace";
  widget.innerText = "PDF Auto Naming: waiting...";

  document.body.appendChild(widget);
}

function updateDebugWidget(text) {
  const widget = document.getElementById("pdf-auto-naming-widget");
  if (widget) {
    widget.innerText = `PDF Auto Naming:\n${text}`;
  }
}

// Initialize the widget
createDebugWidget();

// Hook into your existing identifier logic
async function getIdentifierWithWidget() {
  let identifier = await getIdentifier();
  updateDebugWidget(identifier);
  return identifier;
}

// Replace sendIdentifier to also update widget
async function sendIdentifier() {
  if (chrome.runtime?.id) {
    let identifier = await getIdentifierWithWidget();
    chrome.runtime.sendMessage({ identifier });
    console.log('Sent identifier:', identifier);
  } else {
    console.warn('Extension context invalidated, cannot send message.');
  }
}

