import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/DataTable';
import { API_BASE_URL } from '../../config/api';
import { ESTADOS_BRASILEIROS, CIDADES_POR_ESTADO, OPCOES_GENERO } from '../../data/localizacao';
import { useModal } from '../../hooks/useModal';
import { usePasswordToggle } from '../../hooks/usePasswordToggle.jsx';

function GerenciarUsuarios() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useModal(showForm);
  
  const { passwordType, togglePasswordVisibility, PasswordToggleIcon } = usePasswordToggle();

  const [formData, setFormData] = useState({
    nome: '',
    sobrenome: '',
    dataAniversario: '',
    genero: '',
    cidade: '',
    estado: '',
    email: '',
    password: '',
    role: 'user',
    avatar: ''
  });

  // Estados para upload de avatar
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { token } = useAuth();

  const columns = [
    { 
      key: 'nome', 
      label: 'Nome',
      render: (item) => {
        const nomeCompleto = `${item.nome || ''} ${item.sobrenome || ''}`.trim();
        const iniciais = `${item.nome?.charAt(0) || ''}${item.sobrenome?.charAt(0) || ''}`.toUpperCase();
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              {item.avatar ? (
                <img 
                  src={item.avatar.startsWith('http') ? item.avatar : `http://localhost:5000${item.avatar}`}
                  alt="Avatar"
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0
                  }}
                />
              ) : (
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: '#ff6b35',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  {iniciais}
                </div>
              )}
              <div className={item.isOnline ? "user-status-online" : "user-status-offline"}></div>
            </div>
            <span>{nomeCompleto}</span>
          </div>
        );
      }
    },
    { key: 'email', label: 'Email' },
    { key: 'estado', label: 'Estado' },
    { key: 'cidade', label: 'Cidade' },
    { 
      key: 'genero', 
      label: 'Gênero',
      render: (item) => {
        const genero = OPCOES_GENERO.find(g => g.value === item.genero);
        return genero ? genero.label : item.genero;
      }
    },
    { 
      key: 'role', 
      label: 'Função',
      render: (item) => (
        <span className={`role ${item.role}`}>
          {item.role === 'admin' ? 'Administrador' : 'Usuário'}
        </span>
      )
    },
    { 
      key: 'lastLogin', 
      label: 'Último Login',
      render: (item) => {
        if (!item.lastLogin) return 'Nunca';
        const lastLogin = new Date(item.lastLogin);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Agora';
        if (diffInHours < 24) return `${diffInHours}h atrás`;
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d atrás`;
        return lastLogin.toLocaleDateString('pt-BR');
      }
    },
    { 
      key: 'createdAt', 
      label: 'Data de Cadastro',
      render: (item) => new Date(item.createdAt).toLocaleDateString('pt-BR')
    },
    {
      key: 'acoes',
      label: 'Ações',
      render: (item) => (
        <div className="admin-button-group">
          <button
            onClick={() => handleEdit(item)}
            className="admin-btn-create"
          >
            Editar
          </button>
          <button
            onClick={() => handleDelete(item)}
            className="admin-btn-danger"
          >
            Excluir
          </button>
        </div>
      )
    }
  ];

  useEffect(() => {
    document.title = 'Gerenciar Usuários - Radegondes';
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (user = null) => {
    if (user) {
      setFormData({
        // @ts-ignore
        nome: user.nome,
        // @ts-ignore
        sobrenome: user.sobrenome,
        // @ts-ignore
        dataAniversario: user.dataAniversario ? user.dataAniversario.split('T')[0] : '',
        // @ts-ignore
        genero: user.genero,
        // @ts-ignore
        cidade: user.cidade,
        // @ts-ignore
        estado: user.estado,
        // @ts-ignore
        email: user.email,
        password: '',
        // @ts-ignore
        role: user.role,
        // @ts-ignore
        avatar: user.avatar || ''
      });
      
      // Definir preview do avatar se existir
      // @ts-ignore
      if (user.avatar) {
        // @ts-ignore
        const avatarUrl = user.avatar.startsWith('http') 
          // @ts-ignore
          ? user.avatar 
          // @ts-ignore
          : `http://localhost:5000${user.avatar}`;
        setAvatarPreview(avatarUrl);
      } else {
        setAvatarPreview('');
      }
      
      // @ts-ignore
      setEditingId(user._id);
    } else {
      setFormData({
        nome: '',
        sobrenome: '',
        dataAniversario: '',
        genero: '',
        cidade: '',
        estado: '',
        email: '',
        password: '',
        role: 'user',
        avatar: ''
      });
      setAvatarPreview('');
      setAvatarFile(null);
      setEditingId(null);
    }
    setShowForm(true);
  };

  const closeModal = () => {
    setIsClosing(true);
    
    // Wait for animation to complete before hiding modal
    setTimeout(() => {
      setShowForm(false);
      setIsClosing(false);
      setEditingId(null);
      setFormData({
        nome: '',
        sobrenome: '',
        dataAniversario: '',
        genero: '',
        cidade: '',
        estado: '',
        email: '',
        password: '',
        role: 'user',
        avatar: ''
      });
      setAvatarPreview('');
      setAvatarFile(null);
    }, 250);
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

  const deleteAvatar = async () => {
    if (!confirm('Tem certeza que deseja excluir o avatar?')) {
      return;
    }

    setAvatarPreview('');
    setAvatarFile(null);
    setFormData(prev => ({
      ...prev,
      avatar: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let finalFormData = { ...formData };
      
      // Se há um arquivo de avatar para fazer upload
      if (avatarFile) {
        setUploadingAvatar(true);
        
        const avatarFormData = new FormData();
        avatarFormData.append('avatar', avatarFile);

        // Fazer upload do avatar primeiro
        const avatarResponse = await fetch(`${API_BASE_URL}/api/users/upload-avatar`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: avatarFormData
        });

        if (avatarResponse.ok) {
          const avatarData = await avatarResponse.json();
          // Construir a URL completa do avatar
          const avatarUrl = `http://localhost:5000${avatarData.url}`;
          finalFormData.avatar = avatarUrl;
        }
        
        setUploadingAvatar(false);
      }
    
      // Salvar ou atualizar o usuário
      const url = editingId 
        ? `${API_BASE_URL}/api/admin/users/${editingId}`
        : `${API_BASE_URL}/api/admin/users`;
      
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(finalFormData)
      });

      if (response.ok) {
        fetchUsers();
        closeModal();
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    }
  };

  const handleEdit = (user) => {
    openModal(user);
  };

  const handleDelete = async (usuario) => {
    const id = usuario._id || usuario;
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          console.log('Usuário excluído com sucesso, atualizando lista...');
          fetchUsers();
        } else {
          console.error('Erro na resposta:', await response.text());
        }
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
      }
    }
  };

  return (
    <>
      <header className='flex justify-between head'>
        <h1>Gerenciar Usuários</h1>
        <button onClick={() => openModal()}>Novo Usuário</button>
      </header>

      {showForm && (
        <div 
          className={`modal-overlay${isClosing ? ' closing' : ''}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <form onSubmit={handleSubmit} className={`form-modal${isClosing ? ' closing' : ''}`}>
            <h3>{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h3>
          
          {/* Avatar Upload */}
          <div className="avatar-upload-container" style={{ marginBottom: '20px' }}>
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
              {(avatarPreview || formData.avatar) && (
                <span 
                  onClick={deleteAvatar}
                  className="avatar-delete-btn"
                >
                  (Excluir)
                </span>
              )}
            </label>
          </div>

          {/* Seção Role - No topo */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              color: 'var(--darkmode-text-primary)', 
              fontWeight: '500' 
            }}>
              Definir regra
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              required
            >
              <option value="user">Usuário</option>
              <option value="admin">Administrador</option>
            </select>
            <div style={{ 
              height: '1px', 
              background: 'rgba(255, 255, 255, 0.1)', 
              margin: '15px 0 20px 0' 
            }}></div>
          </div>

          {/* Nome e Sobrenome lado a lado */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Nome"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              required
              style={{ flex: 1 }}
            />
            <input
              type="text"
              placeholder="Sobrenome"
              value={formData.sobrenome}
              onChange={(e) => setFormData({...formData, sobrenome: e.target.value})}
              required
              style={{ flex: 1 }}
            />
          </div>
          
          <input
            type="date"
            placeholder="Data de Aniversário"
            value={formData.dataAniversario}
            onChange={(e) => setFormData({...formData, dataAniversario: e.target.value})}
            required
          />
          
          <select
            value={formData.genero}
            onChange={(e) => setFormData({...formData, genero: e.target.value})}
            required
          >
            <option value="">Selecione o gênero</option>
            {OPCOES_GENERO.map(opcao => (
              <option key={opcao.value} value={opcao.value}>
                {opcao.label}
              </option>
            ))}
          </select>
          
          {/* Estado e Cidade lado a lado */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <select
              value={formData.estado}
              onChange={(e) => setFormData({...formData, estado: e.target.value, cidade: ''})}
              required
              style={{ flex: 1 }}
            >
              <option value="">Selecione o estado</option>
              {ESTADOS_BRASILEIROS.map(estado => (
                <option key={estado.sigla} value={estado.sigla}>
                  {estado.sigla} - {estado.nome}
                </option>
              ))}
            </select>
            
            <select
              value={formData.cidade}
              onChange={(e) => setFormData({...formData, cidade: e.target.value})}
              required
              disabled={!formData.estado}
              style={{ flex: 1 }}
            >
              <option value="">
                {formData.estado ? 'Selecione a cidade' : 'Primeiro selecione o estado'}
              </option>
              {formData.estado && CIDADES_POR_ESTADO[formData.estado]?.map(cidade => (
                <option key={cidade} value={cidade}>
                  {cidade}
                </option>
              ))}
            </select>
          </div>
          
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          
          {!editingId && (
            <div className="password-input-container">
              <input
                type={passwordType}
                placeholder="Senha (obrigatória para novos usuários)"
                value={formData.password || ''}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
              <PasswordToggleIcon onClick={togglePasswordVisibility} />
            </div>
          )}
            <div className="form-actions">
              <button type="submit" disabled={uploadingAvatar}>
                {uploadingAvatar ? 'Fazendo upload...' : 'Salvar'}
              </button>
              <button type="button" onClick={closeModal} disabled={uploadingAvatar}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <DataTable
        data={users}
        columns={columns}
        onEdit={null}
        onDelete={null}
        loading={loading}
      />
    </>
  );
}

export default GerenciarUsuarios;
