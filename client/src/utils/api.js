import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:8080/api`
});

// Request Interceptor: Automatically attach the token to every request
api.interceptors.request.use(
  (config) => {
    console.log(`[API Request] -> ${config.method.toUpperCase()} ${config.url}`);
    const token = localStorage.getItem('arena_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error(`[API Request Error] ->`, error);
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle the 'Strict One-Device Login' logout
api.interceptors.response.use(
  (response) => {
    console.log(`[API Response] <- ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`[API Response Error] <-`, {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.error || error.message
    });
    
    if (error.response && error.response.status === 403) {
      const { code } = error.response.data;
      
      if (code === 'SESSION_INVALIDATED') {
        console.error('Session invalidated by Admin/New Login. Logging out...');
        
        // 1. Clear all local session data
        localStorage.removeItem('arena_token');
        localStorage.removeItem('arena_user');
        localStorage.removeItem('arena_role');
        
        // 2. Immediate redirect to login with a message
        window.location.href = '/login?error=session_invalidated';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
