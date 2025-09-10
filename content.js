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
    chrome.runtime.sendMessage({ identifier });
    console.log('Sent identifier:', identifier);
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