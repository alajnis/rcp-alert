import axios from 'axios';

// En desarrollo usamos localhost, en producción Vite usará la variable de entorno VITE_API_URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000';

const api = axios.create({
  baseURL: API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token automáticamente si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
