document.addEventListener('DOMContentLoaded', () => {
  const drugInput = document.getElementById('drugnameSelector');
  const contractInput = document.getElementById('contractSelector');
  const saveButton = document.getElementById('saveButton');
  const generateButton = document.getElementById('generateButton');
  const statusDiv = document.getElementById('status');
  const errorDiv = document.getElementById('error');
  const reportDiv = document.getElementById('reportUrl');

  // Load saved selectors from storage
  chrome.storage.local.get(['drugnameSelector', 'contractSelector'], (data) => {
    if (data.drugnameSelector) drugInput.value = data.drugnameSelector;
    if (data.contractSelector) contractInput.value = data.contractSelector;
  });

  // Save selectors
  saveButton.addEventListener('click', () => {
    const drugSel = drugInput.value.trim();
    const contractSel = contractInput.value.trim();

    if (!drugSel || !contractSel) {
      errorDiv.textContent = 'Both selectors are required.';
      errorDiv.style.display = 'block';
      statusDiv.style.display = 'none';
      return;
    }

    // Validate syntax
    try {
      document.querySelector(drugSel);
      document.querySelector(contractSel);
    } catch (e) {
      errorDiv.textContent = 'Invalid CSS selector syntax.';
      errorDiv.style.display = 'block';
      statusDiv.style.display = 'none';
      return;
    }

// In the saveButton click handler, after saving:
// In the saveButton click handler:
chrome.storage.local.set(
  { drugnameSelector: drugSel, contractSelector: contractSel },
  () => {
    statusDiv.style.display = "block";
    errorDiv.style.display = "none";
    setTimeout(() => (statusDiv.style.display = "none"), 2000);

    // Notify content script that selectors were updated
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      chrome.tabs.sendMessage(tab.id, { action: "selectorsUpdated" });
    });

    // Re-run extraction
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          if (typeof sendIdentifier === "function") {
            sendIdentifier();
          }
        }
      });
    });
  }
);

  // Enable or disable the Generate Report URL button based on active tab URL
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (/\/nextgendrugall\/\d+$/.test(tab.url)) {
      generateButton.disabled = false;
    } else {
      generateButton.disabled = true;
      generateButton.title = "This button is only available on drug pages (nextgendrugall/{id})";
    }
  });

// Generate Report URL
generateButton.addEventListener('click', () => {
  if (generateButton.disabled) return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    
    // First get the saved selector from storage
    chrome.storage.local.get(['drugnameSelector'], (storageData) => {
      const drugnameSelector = storageData.drugnameSelector || 'input[name="drugname"]';
      
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          func: (selector) => {
            const url = location.href;
            let result = {};

            // Only for drug pages
            if (/\/nextgendrugall\/\d+$/.test(url)) {
              const id = url.split('/').pop();
              
              // Use the provided selector
              const drugnameElement = document.querySelector(selector);
              let drugname = '';
              
              if (drugnameElement) {
                drugname = drugnameElement.value || drugnameElement.textContent || drugnameElement.innerText || '';
                drugname = drugname.trim();
              }
              
              // Fallback to default selector if not found
              if (!drugname) {
                const fallbackElement = document.querySelector('input[name="drugname"]');
                if (fallbackElement) {
                  drugname = fallbackElement.value || '';
                }
              }
              
              result = { id, drugname, selectorUsed: selector };
            }
            return result;
          },
          args: [drugnameSelector]
        },
        (results) => {
          if (chrome.runtime.lastError || !results || !results[0]) {
            reportDiv.textContent = 'Could not extract drug name and id.';
            reportDiv.style.color = 'red';
            return;
          }

          const { id, drugname, selectorUsed } = results[0].result;
          
          if (!id) {
            reportDiv.textContent = 'Missing drug ID from URL.';
            reportDiv.style.color = 'red';
            return;
          }
          
          if (!drugname) {
            reportDiv.textContent = `Drug name not found using selector: "${selectorUsed}". Try a different selector.`;
            reportDiv.style.color = 'red';
            return;
          }

          const reportUrl = `https://www.cortellis.com/intelligence/search/report?searchType=reportToResult&entityType=nextgendealall&entityId=${id}&reportEntity=nextgendrugall&reportEntityName=${encodeURIComponent(
            drugname
          )}&sortBy=dealDateEventMostRecent&angularjs=true`;

          reportDiv.innerHTML = `<strong>Generated URL:</strong><br><a href="${reportUrl}" target="_blank" style="word-break:break-all;color:blue;">${reportUrl}</a>`;
          reportDiv.style.color = 'black';
        }
      );
    });
  });
});
})
})