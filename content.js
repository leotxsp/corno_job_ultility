function getIdentifier() {
  let el = document.querySelector('.AppHeader-context-item-label')?.innerText || "download";
  console.log("Retrieved identifier:", el);
  return el;
}

function sendIdentifier() {
  if (chrome.runtime?.id) {
    let identifier = getIdentifier();
    chrome.runtime.sendMessage({ identifier });
    console.log("Sent identifier:", identifier);
  } else {
    console.warn("Extension context invalidated, cannot send message.");
  }
}

// Send identifier on page load
sendIdentifier();

// Send identifier on <a> or button clicks
document.addEventListener('click', e => {
  if (e.target.tagName === 'A' || e.target.closest('button')) {
    sendIdentifier();
  }
});

// Monitor DOM changes for the target element
const targetNode = document.querySelector('span.x1iyjqo2.x6ikm8r.x10wlt62.x1n2onr6.xlyipyv.xuxw1ft.x1rg5ohu._ao3e')?.parentNode || document.body;
const observer = new MutationObserver(() => {
  sendIdentifier();
});
observer.observe(targetNode, { childList: true, subtree: true, characterData: true });

console.log("Content script loaded");