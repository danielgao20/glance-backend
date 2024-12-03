const startSessionButton = document.getElementById('start-session');
const screenshotsContainer = document.getElementById('screenshots');
const userIdSpan = document.getElementById('user-id');
const logoutButton = document.getElementById('logout-button');

// retrieve username from localStorage
const username = localStorage.getItem('username');
if (username) {
  userIdSpan.textContent = username;
} else {
  window.location.href = './login.html';
}

// handle screenshot capture
const captureScreenshot = () => {
  console.log('Requesting screenshot capture...');
  
  // generate unique filename
  const timestamp = Date.now();
  const screenshotFilename = `screenshot-${timestamp}.jpg`;

  // request screenshot capture and include the filename
  window.electronAPI.sendMessage('capture-screenshot', screenshotFilename);
};

window.electronAPI.onMessage('screenshot-captured', async (screenshotPath) => {
  console.log('Screenshot received:', screenshotPath);

  const token = localStorage.getItem('token');
  const username = localStorage.getItem('username');

  try {
    const fs = window.electronAPI.fs;

    // prepare FormData to send to backend
    const formData = new FormData();
    const fileData = await fs.readFile(screenshotPath);
    const blob = new Blob([fileData], { type: 'image/jpeg' });
    formData.append('screenshot', blob); // Attach the file
    formData.append('username', username); // Attach the username
    formData.append('filename', screenshotPath); // Attach the filename

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

    // add screenshot with description to the dashboard
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

// listen for screenshot capture error
window.electronAPI.onMessage('screenshot-error', (error) => {
  console.error('Error capturing screenshot:', error);
});

startSessionButton.addEventListener('click', captureScreenshot);

// handle logout
logoutButton.addEventListener('click', () => {
  localStorage.removeItem('token'); // remove the stored token
  window.location.href = './login.html'; // redirect to the login page
});