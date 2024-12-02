const API_URL = 'http://localhost:5001/api';

export const loginUser = async (username, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return response.json();
};

export const fetchScreenshots = async () => {
  const response = await fetch(`${API_URL}/screenshots`);
  return response.json();
};
