import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../hooks/useModal';
import api from '../config/api';
import { ESTADOS_BRASILEIROS, CIDADES_POR_ESTADO, OPCOES_GENERO } from '../data/localizacao';
import { usePasswordToggle } from '../hooks/usePasswordToggle.jsx';

function PerfilModal({ isOpen, onClose }) {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  
  // Password toggles para os campos de senha
  const { passwordType: currentPasswordType, togglePasswordVisibility: toggleCurrentPassword, PasswordToggleIcon: CurrentPasswordIcon } = usePasswordToggle();
  const { passwordType: newPasswordType, togglePasswordVisibility: toggleNewPassword, PasswordToggleIcon: NewPasswordIcon } = usePasswordToggle();
  const { passwordType: confirmPasswordType, togglePasswordVisibility: toggleConfirmPassword, PasswordToggleIcon: ConfirmPasswordIcon } = usePasswordToggle();
  
  // Estados para aba Perfil
  const [perfilData, setPerfilData] = useState({
    nome: '',
    sobrenome: '',
    email: '',
    dataAniversario: '',
    genero: '',
    cidade: '',
    estado: '',
    avatar: ''
  });
  
  // Estado para upload de avatar
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Estados para aba Preferências
  // @ts-ignore
  const [preferencias, setPreferencias] = useState({
    diasEstudo: [],
    primeiroDiaSemana: 'domingo',
    periodosDisponiveis: ['1', '7', '30', '60', '120'],
    audioAlerta: 'alerta1.wav'
  });
  
  // Estado para adicionar novo período
  const [novoPeriodo, setNovoPeriodo] = useState('');
  
  // Estados para aba Segurança
  const [seguranca, setSeguranca] = useState({
    senhaAtual: '',
    novaSenha: '',
    confirmarSenha: ''
  });

  // Handler para fechar modal com animação
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 250);
  };

  useModal(isOpen);

  useEffect(() => {
    if (isOpen && user) {
      loadUserData();
    }
  }, [isOpen]);

  // Redirecionar admin se tentar acessar preferências
  useEffect(() => {
    if (user?.role === 'admin' && activeTab === 'preferencias') {
      setActiveTab('perfil');
    }
  }, [user, activeTab]);

  const loadUserData = async () => {
    try {
      setPerfilData({
        nome: user.nome || '',
        sobrenome: user.sobrenome || '',
        email: user.email || '',
        dataAniversario: user.dataAniversario ? user.dataAniversario.split('T')[0] : '',
        genero: user.genero || '',
        cidade: user.cidade || '',
        estado: user.estado || '',
        avatar: user.avatar || ''
      });

      // Definir preview do avatar se existir
      if (user.avatar) {
        const avatarUrl = user.avatar.startsWith('http') 
          ? user.avatar 
          : `http://localhost:5000${user.avatar}`;
        setAvatarPreview(avatarUrl);
      }

      // Carregar preferências
      setPreferencias({
        diasEstudo: user.diasEstudo || [],
        primeiroDiaSemana: user.primeiroDiaSemana || 'domingo',
        periodosDisponiveis: user.periodosDisponiveis || ['1', '7', '30', '60', '120'],
        audioAlerta: user.audioAlerta || 'alerta1.wav'
      });

      // Se os dados estão incompletos, buscar do servidor (apenas uma vez)
      if (!user.dataAniversario || !user.genero || !user.cidade || !user.avatar) {
        fetchUserData();
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/users/${user.id}`);
      const userData = response.data;
      
      setPerfilData({
        nome: userData.nome || '',
        sobrenome: userData.sobrenome || '',
        email: userData.email || '',
        dataAniversario: userData.dataAniversario ? userData.dataAniversario.split('T')[0] : '',
        genero: userData.genero || '',
        cidade: userData.cidade || '',
        estado: userData.estado || '',
        avatar: userData.avatar || ''
      });

      // Definir preview do avatar se existir
      if (userData.avatar) {
        const avatarUrl = userData.avatar.startsWith('http') 
          ? userData.avatar 
          : `http://localhost:5000${userData.avatar}`;
        setAvatarPreview(avatarUrl);
        
        // Atualizar o contexto do usuário com o avatar
        setUser(prev => ({
          ...prev,
          avatar: avatarUrl
        }));
      }
      
      // Carregar preferências se existirem
      const periodosCarregados = userData.periodosDisponiveis || ['1', '7', '30', '60', '120'];
      // Ordenar numericamente os períodos carregados
      const periodosOrdenados = periodosCarregados.sort((a, b) => parseInt(a) - parseInt(b));
      
      setPreferencias({
        diasEstudo: userData.diasEstudo || [],
        primeiroDiaSemana: userData.primeiroDiaSemana || 'domingo',
        periodosDisponiveis: periodosOrdenados,
        audioAlerta: userData.audioAlerta || 'alerta1.wav'
      });
      
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      
      if (error.response?.status === 401) {
        // Não fecha o modal, apenas usa os dados do contexto que já foram carregados
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePerfilChange = (e) => {
    const { name, value } = e.target;
    setPerfilData(prev => ({
      ...prev,
      [name]: value,
      // Limpar cidade quando estado mudar
      ...(name === 'estado' && { cidade: '' })
    }));
  };

  // Funções para upload de avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Por favor, selecione apenas arquivos de imagem (JPG, PNG, GIF)');
      return;
    }

    // Validar tamanho do arquivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('A imagem deve ter no máximo 5MB');
      return;
    }

    setAvatarFile(file);

    // Criar preview da imagem
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && e.target.result && typeof e.target.result === 'string') {
        setAvatarPreview(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async () => {
    if (!avatarFile) return;

    setUploadingAvatar(true);
    
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await api.post('/api/users/upload-avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Avatar upload response:', response.data);

      // Construir a URL completa do avatar
      const avatarUrl = `http://localhost:5000${response.data.url}`;
      
      // Atualizar o avatar nos dados do perfil
      setPerfilData(prev => ({
        ...prev,
        avatar: avatarUrl
      }));

      // Atualizar o contexto do usuário
      setUser(prev => ({
        ...prev,
        avatar: avatarUrl
      }));

      // Limpar o arquivo temporário mas manter o preview com a nova URL
      setAvatarFile(null);
      setAvatarPreview(avatarUrl);
      
      // Avatar atualizado silenciosamente
    } catch (error) {
      console.error('Erro no upload:', error);
      alert(`Erro ao fazer upload do avatar: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const deleteAvatar = async () => {
    if (!confirm('Tem certeza que deseja excluir seu avatar?')) {
      return;
    }

    setUploadingAvatar(true);
    
    try {
      await api.delete(`/api/users/${user.id}/avatar`);
      
      // Limpar o avatar nos dados do perfil
      setPerfilData(prev => ({
        ...prev,
        avatar: ''
      }));

      // Limpar o avatar no contexto do usuário
      setUser(prev => ({
        ...prev,
        avatar: ''
      }));

      // Limpar o preview
      setAvatarPreview('');
      setAvatarFile(null);
      
      // Avatar excluído silenciosamente
    } catch (error) {
      console.error('Erro ao excluir avatar:', error);
      alert(`Erro ao excluir avatar: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePerfilSubmit = async (e) => {
    e.preventDefault();
    
    // Verificar se há token antes de tentar salvar
    const token = localStorage.getItem('userToken');
    
    if (!token) {
      alert('Sua sessão expirou. Você será redirecionado para o login.');
      window.location.href = '/login';
      return;
    }
    
    setLoading(true);
    
    try {
      // Primeiro, fazer upload do avatar se houver um novo arquivo
      if (avatarFile) {
        await uploadAvatar();
      }

      const response = await api.put(`/api/users/${user.id}`, perfilData);
      
      // Atualizar o contexto do usuário com todos os dados, preservando os existentes
      setUser(prev => ({ 
        ...prev, 
        ...response.data,
        // Garantir que os campos do perfil sejam atualizados
        nome: response.data.nome,
        sobrenome: response.data.sobrenome,
        email: response.data.email,
        dataAniversario: response.data.dataAniversario,
        genero: response.data.genero,
        cidade: response.data.cidade,
        estado: response.data.estado,
        avatar: response.data.avatar || perfilData.avatar
      }));
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Sua sessão expirou. Você será redirecionado para o login.');
        localStorage.removeItem('userToken');
        window.location.href = '/login';
        return;
      }
      
      alert(`Erro ao atualizar perfil: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenciasSubmit = async (e) => {
    e.preventDefault();
    
    // Verificar se há token antes de tentar salvar
    const token = localStorage.getItem('userToken');
    if (!token) {
      alert('Sua sessão expirou. Você será redirecionado para o login.');
      window.location.href = '/login';
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔧 Debug - Dados sendo enviados:', {
        userId: user.id,
        url: `/api/users/${user.id}/preferencias`,
        preferencias: preferencias,
        tokenExists: !!localStorage.getItem('userToken')
      });
      
      const response = await api.put(`/api/users/${user.id}/preferencias`, preferencias);
      alert('Preferências atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar preferências:', error);
      
      if (error.response?.status === 401) {
        alert('Sua sessão expirou. Você será redirecionado para o login.');
        localStorage.removeItem('userToken');
        window.location.href = '/login';
        return;
      }
      
      alert('Erro ao atualizar preferências');
    } finally {
      setLoading(false);
    }
  };

  const handleSegurancaSubmit = async (e) => {
    e.preventDefault();
    
    if (seguranca.novaSenha !== seguranca.confirmarSenha) {
      alert('As senhas não coincidem');
      return;
    }
    
    if (seguranca.novaSenha.length < 6) {
      alert('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    
    // Verificar se há token antes de tentar salvar
    const token = localStorage.getItem('userToken');
    if (!token) {
      alert('Sua sessão expirou. Você será redirecionado para o login.');
      window.location.href = '/login';
      return;
    }
    
    setLoading(true);
    
    try {
      await api.put(`/api/users/${user.id}/senha`, {
        senhaAtual: seguranca.senhaAtual,
        novaSenha: seguranca.novaSenha
      });
      alert('Senha atualizada com sucesso!');
      setSeguranca({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
    } catch (error) {
      console.error('Erro ao atualizar senha:', error);
      
      if (error.response?.status === 401) {
        alert('Sua sessão expirou. Você será redirecionado para o login.');
        localStorage.removeItem('userToken');
        window.location.href = '/login';
        return;
      }
      
      alert('Erro ao atualizar senha. Verifique se a senha atual está correta.');
    } finally {
      setLoading(false);
    }
  };

  // @ts-ignore
  const handleDiaEstudoChange = (dia) => {
    // @ts-ignore
    setPreferencias(prev => ({
      ...prev,
      // @ts-ignore
      diasEstudo: prev.diasEstudo.includes(dia)
        // @ts-ignore
        ? prev.diasEstudo.filter(d => d !== dia)
        // @ts-ignore
        : [...prev.diasEstudo, dia]
    }));
  };

  const handleAddPeriodo = () => {
    if (novoPeriodo && !preferencias.periodosDisponiveis.includes(novoPeriodo)) {
      // @ts-ignore
      setPreferencias(prev => {
        // @ts-ignore
        const novosPeriodos = [...prev.periodosDisponiveis, novoPeriodo];
        // Ordenar numericamente
        const periodosOrdenados = novosPeriodos.sort((a, b) => parseInt(a) - parseInt(b));
        return {
          ...prev,
          periodosDisponiveis: periodosOrdenados
        };
      });
      setNovoPeriodo('');
    }
  };

  const handleRemovePeriodo = (periodo) => {
    // @ts-ignore
    setPreferencias(prev => {
      // @ts-ignore
      const periodosRestantes = prev.periodosDisponiveis.filter(p => p !== periodo);
      // Manter ordenação após remoção
      const periodosOrdenados = periodosRestantes.sort((a, b) => parseInt(a) - parseInt(b));
      return {
        ...prev,
        periodosDisponiveis: periodosOrdenados
      };
    });
  };

  const diasSemana = [
    { value: 'domingo', label: 'Domingo' },
    { value: 'segunda', label: 'Segunda' },
    { value: 'terca', label: 'Terça' },
    { value: 'quarta', label: 'Quarta' },
    { value: 'quinta', label: 'Quinta' },
    { value: 'sexta', label: 'Sexta' },
    { value: 'sabado', label: 'Sábado' }
  ];

  const opcoesAudio = [
    { value: 'alerta1.wav', label: 'Alerta Suave' },
    { value: 'alerta2.wav', label: 'Alerta Clássico' },
    { value: 'alerta3.wav', label: 'Alerta Digital' },
    { value: 'alerta4.wav', label: 'Alerta Sino' },
    { value: 'alerta5.wav', label: 'Alerta Beep' }
  ];

  if (!isOpen) return null;

  return (
    <div 
      className={`modal-overlay${isClosing ? ' closing' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className={`form-modal perfil-modal${isClosing ? ' closing' : ''}`}>
        <div className="modal-header">
        <h3>Meu Perfil</h3>
        <div className="tabs">
          <button 
            className={activeTab === 'perfil' ? 'active' : ''}
            onClick={() => setActiveTab('perfil')}
          >
            Perfil
          </button>
          {user?.role !== 'admin' && (
            <button 
              className={activeTab === 'preferencias' ? 'active' : ''}
              onClick={() => setActiveTab('preferencias')}
            >
              Preferências
            </button>
          )}
          <button 
            className={activeTab === 'seguranca' ? 'active' : ''}
            onClick={() => setActiveTab('seguranca')}
          >
            Segurança
          </button>
        </div>
      </div>

      <div className="modal-content">
        {activeTab === 'perfil' && (
                      <form onSubmit={handlePerfilSubmit}>
              {/* Avatar Upload */}
              <div className="avatar-upload-container">
                <div
                  className={`avatar-upload-button ${avatarPreview ? 'has-image' : ''}`}
                  onClick={() => {
                    const input = document.getElementById('avatarInput');
                    if (input) input.click();
                  }}
                >
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                    />
                  ) : (
                    <span className="avatar-plus">+</span>
                  )}
                </div>
                
                <input
                  id="avatarInput"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="avatar-upload-input"
                />
                
                <label className="avatar-upload-label">
                  Avatar
                  {(avatarPreview || perfilData.avatar) && (
                    <span 
                      onClick={deleteAvatar}
                      className="avatar-delete-btn"
                    >
                      (Excluir)
                    </span>
                  )}
                </label>
              </div>

              {/* Nome */}
            <div className="form-row">
              <div className="form-group">
                <label>Nome</label>
                <input
                  type="text"
                  name="nome"
                  value={perfilData.nome}
                  onChange={handlePerfilChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Sobrenome</label>
                <input
                  type="text"
                  name="sobrenome"
                  value={perfilData.sobrenome}
                  onChange={handlePerfilChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={perfilData.email}
                onChange={handlePerfilChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Data de Nascimento</label>
                <input
                  type="date"
                  name="dataAniversario"
                  value={perfilData.dataAniversario}
                  onChange={handlePerfilChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Gênero</label>
                <select
                  name="genero"
                  value={perfilData.genero}
                  onChange={handlePerfilChange}
                  required
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

            <div className="form-row">
              <div className="form-group">
                <label>Estado</label>
                <select
                  name="estado"
                  value={perfilData.estado}
                  onChange={handlePerfilChange}
                  required
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
                <label>Cidade</label>
                <select
                  name="cidade"
                  value={perfilData.cidade}
                  onChange={handlePerfilChange}
                  required
                  disabled={!perfilData.estado}
                >
                  <option value="">
                    {perfilData.estado ? 'Selecione a cidade' : 'Primeiro selecione o estado'}
                  </option>
                  {perfilData.estado && CIDADES_POR_ESTADO[perfilData.estado] && 
                    CIDADES_POR_ESTADO[perfilData.estado].map(cidade => (
                      <option key={cidade} value={cidade}>
                        {cidade}
                      </option>
                    ))
                  }
                </select>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
              <button type="button" onClick={handleClose}>Cancelar</button>
            </div>
          </form>
        )}

        {activeTab === 'preferencias' && user?.role !== 'admin' && (
          <form onSubmit={handlePreferenciasSubmit}>
            <div className="form-group">
              <label>Dias de Estudo</label>
              <div className="dias-estudo">
                {diasSemana.map(dia => (
                  <label 
                    key={dia.value} 
                    // @ts-ignore
                    className={`checkbox-label ${preferencias.diasEstudo.includes(dia.value) ? 'checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      // @ts-ignore
                      checked={preferencias.diasEstudo.includes(dia.value)}
                      onChange={() => handleDiaEstudoChange(dia.value)}
                    />
                    <span>{dia.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Período de Revisões</label>
              <div className="periodo-revisoes">
                {preferencias.periodosDisponiveis.map(periodo => (
                  <div
                    key={periodo}
                    className="periodo-item"
                  >
                    {periodo === '1' ? '1 dia' : `${periodo} dias`}
                    <button
                      className="remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePeriodo(periodo);
                      }}
                      title="Remover período"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="add-periodo">
                <input
                  type="number"
                  value={novoPeriodo}
                  onChange={(e) => setNovoPeriodo(e.target.value)}
                  placeholder="Dias"
                  min="1"
                  max="365"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPeriodo();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddPeriodo}
                  disabled={!novoPeriodo || preferencias.periodosDisponiveis.includes(novoPeriodo)}
                >
                  + Adicionar
                </button>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Primeiro Dia da Semana</label>
                <select
                  value={preferencias.primeiroDiaSemana}
                  onChange={(e) => setPreferencias(prev => ({ ...prev, primeiroDiaSemana: e.target.value }))}
                >
                  <option value="domingo">Domingo</option>
                  <option value="segunda">Segunda-feira</option>
                </select>
              </div>
              <div className="form-group">
                <label>Som de Alerta</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <select
                    value={preferencias.audioAlerta}
                    onChange={(e) => setPreferencias(prev => ({ ...prev, audioAlerta: e.target.value }))}
                    style={{ 
                      flex: 1,
                      paddingRight: '80px' // Espaço para o botão
                    }}
                  >
                    {opcoesAudio.map(opcao => (
                      <option key={opcao.value} value={opcao.value}>
                        {opcao.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      const audio = new Audio(`/sounds/${preferencias.audioAlerta}`);
                      audio.play().catch(err => console.error('Erro ao reproduzir áudio:', err));
                    }}
                    style={{ 
                      position: 'absolute',
                      right: '8px',
                      top: '50%',
                      transform: 'translateY(-75%)',
                      padding: '4px 8px', 
                      fontSize: '11px',
                      background: 'var(--orange)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      zIndex: 1
                    }}
                  >
                    Ouvir
                  </button>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar Preferências'}
              </button>
              <button type="button" onClick={handleClose}>Cancelar</button>
            </div>
          </form>
        )}

        {activeTab === 'seguranca' && (
          <form onSubmit={handleSegurancaSubmit}>
            <div className="form-group">
              <label>Senha Atual</label>
              <div className="password-input-container">
                <input
                  type={currentPasswordType}
                  value={seguranca.senhaAtual}
                  onChange={(e) => setSeguranca(prev => ({ ...prev, senhaAtual: e.target.value }))}
                  required
                />
                <CurrentPasswordIcon onClick={toggleCurrentPassword} />
              </div>
            </div>

            <div className="form-group">
              <label>Nova Senha</label>
              <div className="password-input-container">
                <input
                  type={newPasswordType}
                  value={seguranca.novaSenha}
                  onChange={(e) => setSeguranca(prev => ({ ...prev, novaSenha: e.target.value }))}
                  required
                  minLength={6}
                />
                <NewPasswordIcon onClick={toggleNewPassword} />
              </div>
            </div>

            <div className="form-group">
              <label>Confirmar Nova Senha</label>
              <div className="password-input-container">
                <input
                  type={confirmPasswordType}
                  value={seguranca.confirmarSenha}
                  onChange={(e) => setSeguranca(prev => ({ ...prev, confirmarSenha: e.target.value }))}
                  required
                  minLength={6}
                />
                <ConfirmPasswordIcon onClick={toggleConfirmPassword} />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" disabled={loading}>
                {loading ? 'Alterando...' : 'Alterar Senha'}
              </button>
              <button type="button" onClick={handleClose}>Cancelar</button>
            </div>
          </form>
        )}
      </div>
    </div>
    </div>
  );
}

export default PerfilModal;
