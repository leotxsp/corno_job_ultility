let identifier = document.querySelector("h1")?.innerText || "download";

chrome.runtime.sendMessage({ identifier: identifier });