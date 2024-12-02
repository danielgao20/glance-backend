const startSessionButton = document.getElementById('start-session');
const screenshotsContainer = document.getElementById('screenshots');
const userIdSpan = document.getElementById('user-id');
const logoutButton = document.getElementById('logout-button');

// Retrieve username from localStorage
const username = localStorage.getItem('username');

if (username) {
  userIdSpan.textContent = username; // Display the username in the UI
} else {
  // If no username is found, redirect to login for safety
  window.location.href = './login.html';
}

// Capture screenshot on button click
const captureScreenshot = () => {
  console.log('Requesting screenshot capture...');
  window.electronAPI.sendMessage('capture-screenshot');
};

// screenshot capture! so cool!
window.electronAPI.onMessage('screenshot-captured', async (screenshotPath) => {
  console.log('Screenshot received:', screenshotPath);

  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  try {
    // Use fs module exposed by preload.js
    const fs = window.electronAPI.fs;

    // Prepare the file upload
    const formData = new FormData();
    formData.append('screenshot', fs.createReadStream(screenshotPath)); // Attach the screenshot file
    formData.append('user_id', username); // Attach the user ID

    const response = await fetch('http://localhost:5001/api/screenshots', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`, // Authorization header
      },
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
      <img src="${data.screenshot_url}" alt="Screenshot" />
    `;
    screenshotsContainer.appendChild(card);
  } catch (error) {
    console.error('Error fetching description:', error);
    alert('An error occurred while generating the description.');
  }
});

// Listen for screenshot capture error
window.electronAPI.onMessage('screenshot-error', (error) => {
  console.error('Error capturing screenshot:', error);
});

startSessionButton.addEventListener('click', captureScreenshot);

// handle logout
logoutButton.addEventListener('click', () => {
  localStorage.removeItem('token'); // Remove the stored token
  window.location.href = './login.html'; // Redirect to the login page
});