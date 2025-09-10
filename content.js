function getIdentifier() {
  return new Promise((resolve) => {
    // Retrieve saved selector from storage
    chrome.storage.local.get('selector', (data) => {
      const selector = data.selector || '.AppHeader-context-item-label'; // Fallback to default
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

// Send identifier on page load
sendIdentifier();

// Send identifier on <a> or button clicks
document.addEventListener('click', (e) => {
  if (e.target.tagName === 'A' || e.target.closest('button') || e.target.closest('[role="button"]')) {
    sendIdentifier();
  }
});

// Monitor DOM changes for the target element
chrome.storage.local.get('selector', (data) => {
  const selector = data.selector || '.AppHeader-context-item-label';
  const targetNode = document.querySelector(selector)?.parentNode || document.body;
  const observer = new MutationObserver(() => {
    sendIdentifier();
  });
  observer.observe(targetNode, { childList: true, subtree: true, characterData: true });
});

console.log('Content script loaded');