import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser } from '../services/api';
import { usePasswordToggle } from '../hooks/usePasswordToggle.jsx';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const { login } = useAuth();
  const { passwordType, togglePasswordVisibility, PasswordToggleIcon } = usePasswordToggle();

  useEffect(() => {
    document.title = 'Login - Radegondes';
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Tentando login...');

    try {
      const data = await loginUser({ email, password });
      if (data.token && typeof data.token === 'string') {
        setMessage(data.message);
        login(data.token);
      } else {
        setMessage('Erro: Token de autenticação não recebido ou inválido.');
      }
    } catch (error) {
      setMessage(error.message || 'Não foi possível conectar ao servidor. Tente novamente mais tarde.');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h2 className="auth-title">
          Login
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email:
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Senha:
            </label>
            <div className="password-input-container">
              <input
                type={passwordType}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input"
              />
              <PasswordToggleIcon onClick={togglePasswordVisibility} />
            </div>
          </div>
          
          <button type="submit" className="form-button">
            Entrar
          </button>
        </form>
        
        {message && (
          <div className={`auth-message ${message.includes('Erro') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
        
        <p className="form-link" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Não tem uma conta? <Link to="/register">Cadastre-se aqui</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginForm;
