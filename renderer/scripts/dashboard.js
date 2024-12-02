const startSessionButton = document.getElementById('start-session');
const screenshotsContainer = document.getElementById('screenshots');

// Capture screenshot on button click
const captureScreenshot = () => {
  console.log('Requesting screenshot capture...');
  window.electronAPI.sendMessage('capture-screenshot');
};

// Listen for screenshot capture success
window.electronAPI.onMessage('screenshot-captured', (screenshotPath) => {
  console.log('Screenshot received:', screenshotPath);

  // Add screenshot to the dashboard
  const card = document.createElement('div');
  card.className = 'screenshot-card';
  card.innerHTML = `
    <p><strong>Username:</strong> testuser</p>
    <img src="${screenshotPath}" alt="Screenshot" />
  `;
  screenshotsContainer.appendChild(card);
});

// Listen for screenshot capture error
window.electronAPI.onMessage('screenshot-error', (error) => {
  console.error('Error capturing screenshot:', error);
});

startSessionButton.addEventListener('click', captureScreenshot);
