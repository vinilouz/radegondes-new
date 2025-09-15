import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Função para fazer logout e redirecionar
  const forceLogout = () => {
    // Pausar todos os timers ativos antes do logout forçado
    const activeTimers = JSON.parse(localStorage.getItem('globalTimers') || '{}');
    Object.keys(activeTimers).forEach(timerKey => {
      if (activeTimers[timerKey].ativo) {
        activeTimers[timerKey].ativo = false;
        activeTimers[timerKey].ultimaAtualizacao = Date.now();
      }
    });
    localStorage.setItem('globalTimers', JSON.stringify(activeTimers));

    setUser(null);
    setToken(null);
    localStorage.removeItem('userToken');
    navigate('/login');
  };

  // Interceptador global para detectar respostas 401
  const handleApiResponse = async (response) => {
    if (response.status === 401) {
      console.log('Token inválido detectado, fazendo logout automático');
      forceLogout();
      return null;
    }
    return response;
  };

  // Função para fazer fetch com interceptação automática
  const authenticatedFetch = async (url, options = {}) => {
    const currentToken = localStorage.getItem('userToken');
    
    if (currentToken) {
      // Verificar se o token não expirou antes de fazer a requisição
      try {
        const decodedToken = jwtDecode(currentToken);
        if (decodedToken.exp * 1000 <= Date.now()) {
          console.log('Token expirado detectado, fazendo logout automático');
          forceLogout();
          return null;
        }
      } catch (error) {
        console.log('Token inválido detectado, fazendo logout automático');
        forceLogout();
        return null;
      }
    }
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (currentToken) {
      headers['Authorization'] = `Bearer ${currentToken}`;
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });
      
      return await handleApiResponse(response);
    } catch (error) {
      console.error('Erro na requisição:', error);
      throw error;
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('userToken');
    if (storedToken) {
      try {
        const decodedToken = jwtDecode(storedToken);
        if (decodedToken.exp * 1000 > Date.now()) {
          // Primeiro definir dados básicos do token
          const basicUserData = { 
            id: decodedToken.id, 
            email: decodedToken.email,
            role: decodedToken.role,
            nome: decodedToken.nome
          };
          setUser(basicUserData);
          setToken(storedToken);
          
          // Depois buscar dados completos do servidor
          loadCompleteUserData(decodedToken.id, storedToken);
        } else {
          console.log('Token expirado encontrado no localStorage, removendo');
          localStorage.removeItem('userToken');
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error("Erro ao decodificar token no carregamento:", error);
        localStorage.removeItem('userToken');
        setUser(null);
        setToken(null);
      }
    }
    setIsLoading(false);
  }, []);

  // Hook para verificar periodicamente se o token ainda é válido
  useEffect(() => {
    const checkTokenValidity = () => {
      const storedToken = localStorage.getItem('userToken');
      if (storedToken && user) {
        try {
          const decodedToken = jwtDecode(storedToken);
          if (decodedToken.exp * 1000 <= Date.now()) {
            console.log('Token expirado detectado na verificação periódica');
            forceLogout();
          }
        } catch (error) {
          console.log('Token inválido detectado na verificação periódica');
          forceLogout();
        }
      }
    };

    // Listener para evento customizado de logout
    const handleAuthLogout = (event) => {
      console.log('Evento de logout recebido:', event.detail);
      forceLogout();
    };

    // Verificar a cada 60 segundos se o token ainda é válido
    const interval = setInterval(checkTokenValidity, 60000);
    
    // Adicionar listener para evento customizado
    window.addEventListener('auth-logout', handleAuthLogout);

    return () => {
      clearInterval(interval);
      window.removeEventListener('auth-logout', handleAuthLogout);
    };
  }, [user]);

  const loadCompleteUserData = async (userId, userToken) => {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/api/users/${userId}`);
      
      if (response && response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados completos do usuário:', error);
    }
  };

  const login = (userToken) => {
    try {
      const decodedToken = jwtDecode(userToken);
      const userData = { 
        id: decodedToken.id, 
        email: decodedToken.email,
        role: decodedToken.role,
        nome: decodedToken.nome
      };
      setUser(userData);
      setToken(userToken);
      localStorage.setItem('userToken', userToken);
      
      // Carregar dados completos após o login
      loadCompleteUserData(decodedToken.id, userToken);
      
      if (decodedToken.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/planos');
      }
    } catch (error) {
      console.error("Erro ao decodificar token no login:", error);
      logout();
    }
  };

  const register = async (userData) => {
    try {
      // Para registro não usamos authenticatedFetch pois ainda não temos token
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar conta');
      }

      const data = await response.json();
      
      // Após o registro bem-sucedido, fazer login automaticamente
      if (data.token) {
        login(data.token);
      }
      
      return data;
    } catch (error) {
      console.error('Erro no registro:', error);
      throw error;
    }
  };

  const logout = () => {
    // Pausar todos os timers ativos antes do logout
    const activeTimers = JSON.parse(localStorage.getItem('globalTimers') || '{}');
    Object.keys(activeTimers).forEach(timerKey => {
      if (activeTimers[timerKey].ativo) {
        activeTimers[timerKey].ativo = false;
        activeTimers[timerKey].ultimaAtualizacao = Date.now();
      }
    });
    localStorage.setItem('globalTimers', JSON.stringify(activeTimers));

    setUser(null);
    setToken(null);
    localStorage.removeItem('userToken');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      logout, 
      register, 
      isLoading, 
      setUser, 
      authenticatedFetch,
      forceLogout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
