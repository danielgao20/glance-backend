const API_URL = 'http://localhost:5001/api';

const loginUser = async (username, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return response.json();
};

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const data = await loginUser(username, password);
    if (data.token) {
      localStorage.setItem('token', data.token); // Save token
      localStorage.setItem('username', username); // Save username
      window.location.href = './dashboard.html'; // Redirect to dashboard
    } else {
      alert('Login failed: Incorrect credentials.');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('An error occurred during login.');
  }
});
