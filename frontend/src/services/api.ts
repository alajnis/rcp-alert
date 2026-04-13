import axios from 'axios';

const api = axios.create({
  // Conexión directa al backend para evitar problemas de proxy en entornos Windows
  baseURL: 'http://127.0.0.1:3000/api'
});

// Interceptor para agregar el token si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
