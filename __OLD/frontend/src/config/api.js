import axios from 'axios';

export const API_CONFIG = {
  BASE_URL: import.meta.env?.VITE_API_BASE_URL || 'http://localhost:5000',
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/login',
      REGISTER: '/api/register'
    },
    ADMIN: {
      USERS: '/api/admin/users',
      CATEGORIAS: '/api/admin/categorias',
      DISCIPLINAS: '/api/admin/disciplinas',
      EDITAIS: '/api/admin/editais',
      INSTITUICOES: '/api/admin/instituicoes'
    }
  }
};

export const API_BASE_URL = API_CONFIG.BASE_URL;

// Criar instância do axios
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000,
});

// Interceptador para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador para tratar respostas de erro
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      console.log('Token inválido ou expirado detectado pelo interceptor, removendo do localStorage');
      localStorage.removeItem('userToken');
      
      // Emitir evento customizado para que o AuthContext detecte
      window.dispatchEvent(new CustomEvent('auth-logout', { 
        detail: { reason: 'token-expired' } 
      }));
    }
    return Promise.reject(error);
  }
);

export default api;
