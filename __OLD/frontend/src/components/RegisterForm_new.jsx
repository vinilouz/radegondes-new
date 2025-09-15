import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../services/api';
import { ESTADOS_BRASILEIROS, CIDADES_POR_ESTADO, OPCOES_GENERO } from '../data/localizacao';
import { usePasswordToggle } from '../hooks/usePasswordToggle.jsx';

function RegisterForm() {
  const { passwordType: passwordType1, togglePasswordVisibility: togglePassword1, PasswordToggleIcon: PasswordToggleIcon1 } = usePasswordToggle();
  const { passwordType: passwordType2, togglePasswordVisibility: togglePassword2, PasswordToggleIcon: PasswordToggleIcon2 } = usePasswordToggle();
  
  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    dataAniversario: '',
    genero: '',
    cidade: '',
    estado: '',
    email: '',
    password: '',
    tipoEstudo: 'personalizado', // Novo campo
    instituicao: '',             // Novo campo
    edital: ''                   // Novo campo
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [instituicoes, setInstituicoes] = useState([]);
  const [editais, setEditais] = useState([]);
  const { login } = useAuth();

  useEffect(() => {
    document.title = 'Cadastro - Radegondes';
    fetchInstituicoes();
  }, []);

  const fetchInstituicoes = async () => {
    try {
      const response = await fetch('/api/instituicoes', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setInstituicoes(data);
      }
    } catch (error) {
      console.error('Erro ao buscar instituições:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Limpar cidade quando estado mudar
      ...(name === 'estado' && { cidade: '' }),
      // Limpar edital quando instituição mudar
      ...(name === 'instituicao' && { edital: '' })
    }));

    // Atualizar editais quando instituição for selecionada
    if (name === 'instituicao' && value) {
      const instituicaoSelecionada = instituicoes.find((inst, index) => (inst._id || index) === value);
      if (instituicaoSelecionada && instituicaoSelecionada.cargos) {
        setEditais(instituicaoSelecionada.cargos.map(cargo => ({ nome: cargo, value: cargo })));
      } else {
        setEditais([]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('Tentando cadastrar...');

    try {
      const data = await registerUser(formData);
      setMessage(data.message);
      setFormData({
        nome: '',
        sobrenome: '',
        dataAniversario: '',
        genero: '',
        cidade: '',
        estado: '',
        email: '',
        password: '',
        tipoEstudo: 'personalizado',
        instituicao: '',
        edital: ''
      });
      login(data.token);
    } catch (error) {
      setMessage(error.message || 'Não foi possível conectar ao servidor. Tente novamente mais tarde.');
    }
  };

  const cidadesDisponiveis = formData.estado ? CIDADES_POR_ESTADO[formData.estado] || [] : [];

  return (
    <div className="register-container">
      <div className="register-form">
        <h2 className="auth-title">
          Cadastro
        </h2>
        
        <form onSubmit={handleSubmit}>
          {/* Primeira linha - Nome e Sobrenome */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nome" className="form-label">
                Nome:
              </label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="sobrenome" className="form-label">
                Sobrenome:
              </label>
              <input
                type="text"
                id="sobrenome"
                name="sobrenome"
                value={formData.sobrenome}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>
          </div>

          {/* Segunda linha - Data de Nascimento e Gênero */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dataAniversario" className="form-label">
                Data de Nascimento:
              </label>
              <input
                type="date"
                id="dataAniversario"
                name="dataAniversario"
                value={formData.dataAniversario}
                onChange={handleInputChange}
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label htmlFor="genero" className="form-label">
                Gênero:
              </label>
              <select
                id="genero"
                name="genero"
                value={formData.genero}
                onChange={handleInputChange}
                required
                className="form-input"
              >
                <option value="">Selecione o gênero</option>
                {OPCOES_GENERO.map(opcao => (
                  <option key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Terceira linha - Estado e Cidade */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="estado" className="form-label">
                Estado:
              </label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleInputChange}
                required
                className="form-input"
              >
                <option value="">Selecione o estado</option>
                {ESTADOS_BRASILEIROS.map(estado => (
                  <option key={estado.sigla} value={estado.sigla}>
                    {estado.sigla} - {estado.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="cidade" className="form-label">
                Cidade:
              </label>
              <select
                id="cidade"
                name="cidade"
                value={formData.cidade}
                onChange={handleInputChange}
                required
                disabled={!formData.estado}
                className="form-input"
              >
                <option value="">
                  {formData.estado ? 'Selecione a cidade' : 'Primeiro selecione o estado'}
                </option>
                {cidadesDisponiveis.map(cidade => (
                  <option key={cidade} value={cidade}>
                    {cidade}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email:
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="form-input"
            />
          </div>

          {/* Tipo de Estudo */}
          <div className="form-group">
            <label htmlFor="tipoEstudo" className="form-label">
              Tipo de Estudo:
            </label>
            <select
              id="tipoEstudo"
              name="tipoEstudo"
              value={formData.tipoEstudo}
              onChange={handleInputChange}
              required
              className="form-input"
            >
              <option value="personalizado">Personalizado</option>
              <option value="concurso">Concurso Público</option>
              <option value="vestibular">Vestibular</option>
              <option value="enem">ENEM</option>
              <option value="outros">Outros</option>
            </select>
          </div>

          {/* Campos condicionais para tipos não personalizados */}
          {formData.tipoEstudo !== 'personalizado' && (
            <>
              {/* Instituição */}
              <div className="form-group">
                <label htmlFor="instituicao" className="form-label">
                  Instituição:
                </label>
                <select
                  id="instituicao"
                  name="instituicao"
                  value={formData.instituicao}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                >
                  <option value="">Selecione a instituição</option>
                  {instituicoes.map((instituicao, index) => (
                    <option key={index} value={instituicao._id || index}>
                      {instituicao.nome || 'Nome não disponível'} ({instituicao.sigla || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Edital */}
              {formData.instituicao && (
                <div className="form-group">
                  <label htmlFor="edital" className="form-label">
                    Edital/Cargo:
                  </label>
                  <select
                    id="edital"
                    name="edital"
                    value={formData.edital}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  >
                    <option value="">Selecione o edital/cargo</option>
                    {editais.map((edital, index) => (
                      <option key={index} value={edital.value || edital}>
                        {edital.nome || edital}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Senhas */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Senha:
              </label>
              <div className="password-input-container">
                <input
                  type={passwordType1}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                />
                <PasswordToggleIcon1 onClick={togglePassword1} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirmar Senha:
              </label>
              <div className="password-input-container">
                <input
                  type={passwordType2}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="form-input"
                />
                <PasswordToggleIcon2 onClick={togglePassword2} />
              </div>
            </div>
          </div>
          
          <button type="submit" className="register-button">
            Cadastrar
          </button>
        </form>
        
        {message && (
          <div className={`auth-message ${message.includes('Erro') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
        
        <p className="form-link" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Já tem uma conta? <Link to="/login" className="form-link">Faça login aqui</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterForm;
