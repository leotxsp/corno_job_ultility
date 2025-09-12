document.addEventListener('DOMContentLoaded', () => {
  const selectorInput = document.getElementById('selectorInput');
  const saveButton = document.getElementById('saveButton');
  const statusDiv = document.getElementById('status');
  const errorDiv = document.getElementById('error');

  // Load saved selector from storage
  chrome.storage.local.get('selector', (data) => {
    if (data.selector) {
      selectorInput.value = data.selector;
    }
  });

  // Save selector when button is clicked
  saveButton.addEventListener('click', () => {
    const selector = selectorInput.value.trim();
    if (!selector) {
      errorDiv.textContent = 'Please enter a valid CSS selector.';
      errorDiv.style.display = 'block';
      statusDiv.style.display = 'none';
      return;
    }

    // Validate selector using querySelector
    try {
      document.querySelector(selector);
    } catch (e) {
      errorDiv.textContent = 'Invalid CSS selector syntax.';
      errorDiv.style.display = 'block';
      statusDiv.style.display = 'none';
      return;
    }

    // Save selector to storage
    chrome.storage.local.set({ selector }, () => {
      statusDiv.style.display = 'block';
      errorDiv.style.display = 'none';
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 2000);
    });
  });
});
