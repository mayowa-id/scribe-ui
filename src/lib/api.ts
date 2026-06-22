import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  withCredentials: true, // For HTTP-only cookies (refresh token)
});

// Interceptor to attach access token if it's in memory
// Note: In a real app, you'd want to store this in memory or let the useAuth hook handle it.
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Interceptor to handle 401s and silent refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthRequest = originalRequest.url?.includes('/auth/login') ||
                          originalRequest.url?.includes('/auth/refresh') ||
                          originalRequest.url?.includes('/auth/register') ||
                          originalRequest.url?.includes('/auth/verify-email');
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh the token
        const rt = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        if (!rt) {
          throw new Error('No refresh token available');
        }
        const refreshResponse = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken: rt }
        );
        const { accessToken: newToken, refreshToken: newRt } = refreshResponse.data.data;
        setAccessToken(newToken);
        if (typeof window !== 'undefined' && newRt) localStorage.setItem('refreshToken', newRt);
        // Dispatch an event so useAuth can update its state if needed
        if (typeof window !== 'undefined') {
           window.dispatchEvent(new CustomEvent('tokenRefreshed', { detail: newToken }));
        }
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, user needs to login again
        setAccessToken(null);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
