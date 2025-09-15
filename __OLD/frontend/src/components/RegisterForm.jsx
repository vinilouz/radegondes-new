import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ESTADOS_BRASILEIROS, CIDADES_POR_ESTADO, OPCOES_GENERO } from '../data/localizacao';
import { usePasswordToggle } from '../hooks/usePasswordToggle.jsx';

function RegisterForm() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { passwordType: passwordType1, togglePasswordVisibility: togglePassword1, PasswordToggleIcon: PasswordToggleIcon1 } = usePasswordToggle();
  const { passwordType: passwordType2, togglePasswordVisibility: togglePassword2, PasswordToggleIcon: PasswordToggleIcon2 } = usePasswordToggle();
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    password: '',
    confirmPassword: '',
    dataAniversario: '',
    genero: '',
    estado: '',
    cidade: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const cidadesDisponiveis = formData.estado ? CIDADES_POR_ESTADO[formData.estado] || [] : [];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Se mudou o estado, limpar a cidade
      if (name === 'estado') {
        newData.cidade = '';
      }
      
      return newData;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { nome, sobrenome, email, password, confirmPassword, dataAniversario, genero, estado, cidade } = formData;

    if (!nome || !email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos obrigatórios (nome, email e senhas).');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    try {
      await register(formData);
      navigate('/planos');
    } catch (err) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-form">
        <h2>
          Cadastro
        </h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group required">
              <label htmlFor="nome">Nome:</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                required
                placeholder="Digite seu nome"
              />
            </div>
            <div className="form-group">
              <label htmlFor="sobrenome">Sobrenome:</label>
              <input
                type="text"
                id="sobrenome"
                name="sobrenome"
                value={formData.sobrenome}
                onChange={handleChange}
                placeholder="Digite seu sobrenome"
              />
            </div>
          </div>

          <div className="form-group required">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Digite seu email"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dataAniversario">Data de Nascimento:</label>
              <input
                type="date"
                id="dataAniversario"
                name="dataAniversario"
                value={formData.dataAniversario}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="genero">Gênero:</label>
              <select
                id="genero"
                name="genero"
                value={formData.genero}
                onChange={handleChange}
              >
                <option value="">Selecione...</option>
                {OPCOES_GENERO.map(opcao => (
                  <option key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="estado">Estado:</label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
              >
                <option value="">Selecione um estado...</option>
                {ESTADOS_BRASILEIROS.map(estado => (
                  <option key={estado.sigla} value={estado.sigla}>
                    {estado.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="cidade">Cidade:</label>
              <select
                id="cidade"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
                disabled={!formData.estado}
              >
                <option value="">
                  {formData.estado ? 'Selecione uma cidade...' : 'Primeiro selecione um estado'}
                </option>
                {cidadesDisponiveis.map(cidade => (
                  <option key={cidade} value={cidade}>
                    {cidade}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group required">
              <label htmlFor="password">Senha:</label>
              <div className="password-input-container">
                <input
                  type={passwordType1}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Digite sua senha"
                />
                <PasswordToggleIcon1 onClick={togglePassword1} />
              </div>
            </div>
            <div className="form-group required">
              <label htmlFor="confirmPassword">Confirmar Senha:</label>
              <div className="password-input-container">
                <input
                  type={passwordType2}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength={6}
                  placeholder="Confirme sua senha"
                />
                <PasswordToggleIcon2 onClick={togglePassword2} />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="register-button"
          >
            {loading ? 'Criando conta...' : 'Cadastrar'}
          </button>
        </form>
        
        <p className="form-link" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Já tem uma conta? <Link to="/login">Faça login aqui</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterForm;
