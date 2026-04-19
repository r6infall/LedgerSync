import axios from 'axios';
import { auth } from '../firebase';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Attach Firebase ID token on every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors cleanly without bypassing React state
api.interceptors.response.use(
  res => res,
  async (err) => {
    // If a request fails via 401, we want the specific API call to catch and handle it natively.
    // Force-redirects erase transient states (like during valid Firebase onboarding synchronization pipelines).
    return Promise.reject(err);
  }
);

export default api;
