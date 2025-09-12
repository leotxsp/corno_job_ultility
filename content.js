// Persistent storage for widget data
let lastDrugname = 'N/A';
let lastContract = 'N/A';

function getIdentifier() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['drugnameSelector', 'contractSelector'], (data) => {
      let url = location.href;
      let selector, type, el, value;

      if (/\/nextgendrugall\/\d+$/.test(url)) {
        selector = data.drugnameSelector || 'input[name="drugname"]';
        type = 'drugname';
      } else if (/\/nextgendealall\//.test(url)) {
        selector = data.contractSelector || '.contract-class';
        type = 'contract';
      } else {
        selector = '.AppHeader-context-item-label';
        type = 'default';
      }

      el = document.querySelector(selector);
      if (el) {
        // Prefer input.value if available, else use text
        value = el.value || el.innerText || 'download';
      } else {
        value = 'download';
      }

      console.log(`Retrieved [${type}] using selector "${selector}": ${value}`);
      
      // Update persistent storage based on URL type
      if (/\/nextgendrugall\/\d+$/.test(url)) {
        lastDrugname = value;
        chrome.storage.local.set({ lastDrugname: value });
        console.log(`Updated lastDrugname: ${value}`);
      } else if (/\/nextgendealall\//.test(url)) {
        lastContract = value;
        chrome.storage.local.set({ lastContract: value });
        console.log(`Updated lastContract: ${value}`);
      }
      
      // Always update widget with persistent data (if visible)
      updateWidgetWithPersistentData();
      
      resolve(value);
    });
  });
}

// Load persistent data on startup
chrome.storage.local.get(['lastDrugname', 'lastContract', 'widgetHidden'], (data) => {
  if (data.lastDrugname) lastDrugname = data.lastDrugname;
  if (data.lastContract) lastContract = data.lastContract;
  console.log(`Loaded persistent data - Drugname: ${lastDrugname}, Contract: ${lastContract}`);
  
  // Always create widget, but hide if previously hidden
  createDebugWidget();
  if (data.widgetHidden) {
    const widget = document.getElementById("pdf-auto-naming-widget");
    if (widget) {
      widget.style.display = "none";
    }
  } else {
    updateWidgetWithPersistentData();
  }
});

// Update widget with persistent data
function updateWidgetWithPersistentData() {
  const widget = document.getElementById("pdf-auto-naming-widget");
  if (widget && widget.style.display !== "none") {
    updateDebugWidget(lastDrugname, lastContract);
  }
}

// Keep the original sendIdentifier function
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
        updateWidgetWithPersistentData();
      } else {
        updateWidgetWithPersistentData();
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
chrome.storage.local.get(['drugnameSelector', 'contractSelector'], (data) => {
  const drugnameSelector = data.drugnameSelector || 'input[name="drugname"]';
  const contractSelector = data.contractSelector || '.contract-class';
  
  // Observe drugname element if on drug page
  if (/\/nextgendrugall\/\d+$/.test(location.href)) {
    const drugnameElement = document.querySelector(drugnameSelector);
    if (drugnameElement) {
      const observer = new MutationObserver(async () => {
        await sendIdentifier();
      });
      observer.observe(drugnameElement, { characterData: true, childList: true, subtree: true });
      console.log(`Observing mutations on drugname element with selector "${drugnameSelector}"`);
    }
  }
  
  // Observe contract element if on contract page
  if (/\/nextgendealall\//.test(location.href)) {
    const contractElement = document.querySelector(contractSelector);
    if (contractElement) {
      const observer = new MutationObserver(async () => {
        await sendIdentifier();
      });
      observer.observe(contractElement, { characterData: true, childList: true, subtree: true });
      console.log(`Observing mutations on contract element with selector "${contractSelector}"`);
    }
  }
});

// === Debug Widget ===
function createDebugWidget() {
  // Remove any existing widget first
  const existingWidget = document.getElementById("pdf-auto-naming-widget");
  if (existingWidget) {
    existingWidget.remove();
  }

  const widget = document.createElement("div");
  widget.id = "pdf-auto-naming-widget";
  widget.style.position = "fixed";
  widget.style.bottom = "20px";
  widget.style.right = "20px";
  widget.style.background = "rgba(0,0,0,0.9)";
  widget.style.color = "white";
  widget.style.padding = "15px";
  widget.style.borderRadius = "10px";
  widget.style.fontSize = "14px";
  widget.style.zIndex = "999999";
  widget.style.maxWidth = "350px";
  widget.style.fontFamily = "Arial, sans-serif";
  widget.style.lineHeight = "1.5";
  widget.style.boxShadow = "0 4px 15px rgba(0,0,0,0.7)";
  widget.style.border = "2px solid #555";
  widget.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 10px; font-size: 16px; color: #FFD700;">PDF Auto Naming</div>
    <div style="margin-bottom: 5px;">Drugname: <span style="color: #4CAF50; font-weight: bold;">loading...</span></div>
    <div style="margin-bottom: 10px;">Contract: <span style="color: #2196F3; font-weight: bold;">loading...</span></div>
  `;

  // Add close button
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "×";
  closeBtn.title = "Hide widget";
  closeBtn.style.position = "absolute";
  closeBtn.style.top = "8px";
  closeBtn.style.right = "8px";
  closeBtn.style.background = "#ff4444";
  closeBtn.style.color = "white";
  closeBtn.style.border = "none";
  closeBtn.style.borderRadius = "50%";
  closeBtn.style.width = "24px";
  closeBtn.style.height = "24px";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.fontSize = "16px";
  closeBtn.style.fontWeight = "bold";
  closeBtn.style.lineHeight = "1";
  closeBtn.onclick = () => {
    widget.style.display = "none";
    chrome.storage.local.set({ widgetHidden: true });
  };
  
  widget.appendChild(closeBtn);
  document.body.appendChild(widget);
}

function updateDebugWidget(drugname = "N/A", contract = "N/A") {
  const widget = document.getElementById("pdf-auto-naming-widget");
  if (widget) {
    widget.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 10px; font-size: 16px; color: #FFD700;">PDF Auto Naming</div>
      <div style="margin-bottom: 5px;">Drugname: <span style="color: #4CAF50; font-weight: bold;">${drugname}</span></div>
      <div style="margin-bottom: 10px;">Contract: <span style="color: #2196F3; font-weight: bold;">${contract}</span></div>
      <div style="font-size: 12px; color: #ccc; margin-top: 5px;">
        Right-click → "Show Widget" to reopen
      </div>
    `;
    
    // Re-add the close button
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.title = "Hide widget";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "8px";
    closeBtn.style.right = "8px";
    closeBtn.style.background = "#ff4444";
    closeBtn.style.color = "white";
    closeBtn.style.border = "none";
    closeBtn.style.borderRadius = "50%";
    closeBtn.style.width = "24px";
    closeBtn.style.height = "24px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.fontSize = "16px";
    closeBtn.style.fontWeight = "bold";
    closeBtn.style.lineHeight = "1";
    closeBtn.onclick = () => {
      widget.style.display = "none";
      chrome.storage.local.set({ widgetHidden: true });
    };
    
    widget.appendChild(closeBtn);
  }
}

// Add context menu to show widget
function addContextMenu() {
  // Remove existing context menu if any
  const existingMenu = document.getElementById("pdf-widget-context-menu");
  if (existingMenu) {
    existingMenu.remove();
  }

  const contextMenu = document.createElement("div");
  contextMenu.id = "pdf-widget-context-menu";
  contextMenu.style.position = "fixed";
  contextMenu.style.bottom = "60px";
  contextMenu.style.right = "20px";
  contextMenu.style.background = "rgba(0,0,0,0.8)";
  contextMenu.style.color = "white";
  contextMenu.style.padding = "10px";
  contextMenu.style.borderRadius = "8px";
  contextMenu.style.fontSize = "12px";
  contextMenu.style.zIndex = "999998";
  contextMenu.style.cursor = "pointer";
  contextMenu.style.display = "none";
  contextMenu.innerHTML = "Show Widget";
  contextMenu.onclick = () => {
    const widget = document.getElementById("pdf-auto-naming-widget");
    if (widget) {
      widget.style.display = "block";
      updateWidgetWithPersistentData();
      chrome.storage.local.set({ widgetHidden: false });
    }
    contextMenu.style.display = "none";
  };

  document.body.appendChild(contextMenu);

  // Show context menu on right-click near widget area
  document.addEventListener('contextmenu', (e) => {
    if (e.clientX > window.innerWidth - 100 && e.clientY > window.innerHeight - 100) {
      e.preventDefault();
      contextMenu.style.display = "block";
      contextMenu.style.left = e.clientX + "px";
      contextMenu.style.top = e.clientY + "px";
      
      // Hide context menu after click elsewhere
      const hideMenu = () => {
        contextMenu.style.display = "none";
        document.removeEventListener('click', hideMenu);
      };
      setTimeout(() => document.addEventListener('click', hideMenu), 100);
    }
  });
}

// Initialize everything
function initializeWidget() {
  chrome.storage.local.get(['widgetHidden'], (data) => {
    createDebugWidget();
    addContextMenu();
    
    if (data.widgetHidden) {
      const widget = document.getElementById("pdf-auto-naming-widget");
      if (widget) {
        widget.style.display = "none";
      }
    } else {
      updateWidgetWithPersistentData();
    }
  });
}

// Listen for messages from popup when selectors are updated
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "selectorsUpdated") {
    console.log("Selectors updated, re-extracting values...");
    sendIdentifier();
  }
  
  if (message.action === "showWidget") {
    const widget = document.getElementById("pdf-auto-naming-widget");
    if (widget) {
      widget.style.display = "block";
      updateWidgetWithPersistentData();
      chrome.storage.local.set({ widgetHidden: false });
    } else {
      initializeWidget();
    }
  }
  
  if (message.action === "hideWidget") {
    const widget = document.getElementById("pdf-auto-naming-widget");
    if (widget) {
      widget.style.display = "none";
      chrome.storage.local.set({ widgetHidden: true });
    }
  }
});

// Initialize when content script loads
console.log('Content script loaded');
initializeWidget();
sendIdentifier();

// Add a small delay to ensure DOM is fully loaded
setTimeout(() => {
  sendIdentifier();
}, 1000);