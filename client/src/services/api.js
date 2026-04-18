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

// Handle 401 globally
api.interceptors.response.use(
  res => res,
  async (err) => {
    if (err.response?.status === 401) {
      // Firebase auth state change listener will handle the UI redirect
      // if the user is truly signed out
      if (auth.currentUser) {
         await auth.signOut();
      }
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
