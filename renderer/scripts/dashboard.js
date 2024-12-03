const startSessionButton = document.getElementById('start-session');
const screenshotsContainer = document.getElementById('screenshots');
const userIdSpan = document.getElementById('user-id');
const logoutButton = document.getElementById('logout-button');

// Retrieve username from localStorage
const username = localStorage.getItem('username');

if (username) {
  userIdSpan.textContent = username;
} else {
  window.location.href = './login.html';
}

// Capture screenshot on button click
const captureScreenshot = () => {
  console.log('Requesting screenshot capture...');
  window.electronAPI.sendMessage('capture-screenshot');
};

// Handle screenshot capture
window.electronAPI.onMessage('screenshot-captured', async (screenshotPath) => {
  console.log('Screenshot received:', screenshotPath);

  const token = localStorage.getItem('token');

  try {
    const fs = window.electronAPI.fs;

    // Read the file
    const fileData = await fs.readFile(screenshotPath);

    // Prepare form data
    const formData = new FormData();
    formData.append('username', username);
    formData.append('screenshot', new Blob([fileData], { type: 'image/jpeg' }));
    
    // Send data to backend
    const response = await fetch('http://localhost:5001/api/screenshots', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to save screenshot');
    }

    const data = await response.json();

    // Add screenshot with description to the dashboard
    const card = document.createElement('div');
    card.className = 'screenshot-card';
    card.innerHTML = `
      <p><strong>Username:</strong> ${username}</p>
      <p><strong>Description:</strong> ${data.description}</p>
      <img src="http://localhost:5001/api/screenshots/image/${data.fileId}" alt="Screenshot" />
    `;
    screenshotsContainer.appendChild(card);
  } catch (error) {
    console.error('Error uploading screenshot:', error);
    alert('An error occurred while uploading the screenshot.');
  }
});

// Fetch and display existing screenshots
const loadScreenshots = async () => {
  try {
    const response = await fetch('http://localhost:5001/api/screenshots', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });

    const screenshots = await response.json();

    screenshots.forEach((screenshot) => {
      const card = document.createElement('div');
      card.className = 'screenshot-card';
      card.innerHTML = `
        <p><strong>Username:</strong> ${screenshot.username}</p>
        <p><strong>Description:</strong> ${screenshot.description}</p>
        <img src="http://localhost:5001/api/screenshots/image/${screenshot.fileId}" alt="Screenshot" />
      `;
      screenshotsContainer.appendChild(card);
    });
  } catch (error) {
    console.error('Error loading screenshots:', error);
  }
};

// Load screenshots on page load
document.addEventListener('DOMContentLoaded', loadScreenshots);

// Logout handler
logoutButton.addEventListener('click', () => {
  localStorage.removeItem('token');
  window.location.href = './login.html';
});

startSessionButton.addEventListener('click', captureScreenshot);
