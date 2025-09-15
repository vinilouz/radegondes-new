import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/DataTable';
import SearchableSelect from '../../components/SearchableSelect';
import { API_BASE_URL } from '../../config/api';
import { useModal } from '../../hooks/useModal';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ESTADOS_BRASILEIROS, CIDADES_POR_ESTADO } from '../../data/localizacao';

function Instituicoes() {
  const [instituicoes, setInstituicoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    sigla: '',
    logotipo: '',
    estado: '',
    cidade: '',
    tipo: 'Concurso Público',
    categoria: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentEditais, setCurrentEditais] = useState([]); // Ajustado para aceitar array de strings
  const [novoEdital, setNovoEdital] = useState('');
  const [editingEdital, setEditingEdital] = useState(null);
  const [editalEditText, setEditalEditText] = useState('');
  const [draggingEdital, setDraggingEdital] = useState(null);
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useModal(showModal);

  const columns = [
    { key: 'nome', label: 'Nome' },
    { key: 'sigla', label: 'Sigla' },
    { key: 'tipo', label: 'Tipo' },
    { 
      key: 'categoria', 
      label: 'Categoria',
      render: (item) => (
        item.categoria?.nome || '...'
      )
    },
    { key: 'estado', label: 'Estado' },
    { key: 'cidade', label: 'Cidade' },
    { 
      key: 'editais', 
      label: 'Editais',
      render: (item) => (
        <span>{item.cargos ? item.cargos.length : 0} editais</span>
      )
    },
    {
      key: 'acoes',
      label: 'Ações',
      render: (item) => (
        <div className="admin-button-group">
          <button
            onClick={() => handleVerEditais(item)}
            className="admin-btn-info"
          >
            Editais
          </button>
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
    document.title = 'Instituições - Radegondes';
    fetchInstituicoes();
    fetchCategorias();
  }, []);

  // Efeito para abrir modal automaticamente com parâmetros da URL
  useEffect(() => {
    const editId = searchParams.get('edit');
    const editalName = searchParams.get('edital');
    
    if (editId && instituicoes.length > 0) {
      const instituicao = instituicoes.find(inst => inst._id === editId);
      if (instituicao) {
        openModal(instituicao);
        
        // Se há um edital específico, rolar até ele no modal (após um pequeno delay)
        if (editalName) {
          setTimeout(() => {
            const editalElement = document.querySelector(`[data-edital="${editalName}"]`);
            if (editalElement) {
              editalElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
              editalElement.style.backgroundColor = '#fff3cd';
              setTimeout(() => {
                editalElement.style.backgroundColor = '';
              }, 3000);
            }
          }, 500);
        }
        
        // Limpar parâmetros da URL
        navigate('/admin/instituicoes', { replace: true });
      }
    }
  }, [instituicoes, searchParams, navigate]);

  // Adicionar event listener para atalhos de teclado no modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!showModal) return;

      if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.altKey) {
        // Evitar trigger se estiver editando um edital ou em um campo de texto
        if (event.target.tagName === 'INPUT' && event.target.type === 'text') {
          return;
        }
        if (event.target.tagName === 'TEXTAREA') {
          return;
        }
        
        event.preventDefault();
        handleSubmit(event);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        closeModal();
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal, formData, currentEditais, logoFile]); // Dependências necessárias para o handleSubmit

  const fetchInstituicoes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/instituicoes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setInstituicoes(data);
      }
    } catch (error) {
      console.error('Erro ao buscar instituições:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/categorias`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCategorias(data);
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const openModal = (instituicao = null) => {
    if (instituicao) {
      console.log('Abrindo modal para edição:', instituicao);
      console.log('Categoria da instituição:', instituicao.categoria);
      setFormData({
        nome: instituicao.nome,
        sigla: instituicao.sigla,
        logotipo: instituicao.logotipo || '',
        estado: instituicao.estado || '',
        cidade: instituicao.cidade || '',
        tipo: instituicao.tipo || 'Concurso Público',
        categoria: instituicao.categoria?._id || instituicao.categoria || ''
      });
      setEditingId(instituicao._id);
      setCurrentEditais(instituicao.cargos || []);
    } else {
      console.log('Abrindo modal para nova instituição');
      setFormData({
        nome: '',
        sigla: '',
        logotipo: '',
        estado: '',
        cidade: '',
        tipo: 'Concurso Público',
        categoria: ''
      });
      setEditingId(null);
      setCurrentEditais([]);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setIsClosing(true);

    setTimeout(() => {
      setShowModal(false);
      setIsClosing(false);
      setEditingId(null);
      setFormData({
        nome: '',
        sigla: '',
        logotipo: '',
        estado: '',
        cidade: '',
        tipo: 'Concurso Público',
        categoria: ''
      });
      setLogoFile(null);
      setCurrentEditais([]);
      setNovoEdital('');
      setEditingEdital(null);
      setEditalEditText('');
      setDraggingEdital(null);
    }, 250);
  };

  const uploadLogotipo = async (file) => {
    if (!file) return null;
    
    setUploading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('logotipo', file);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/upload-logotipo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.url;
      } else {
        throw new Error('Erro no upload');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.categoria) {
      alert('Por favor, selecione uma categoria.');
      return;
    }
    
    console.log('=== DADOS DO FORMULÁRIO ===');
    console.log('formData:', formData);
    console.log('currentEditais:', currentEditais);
    
    let logoUrl = formData.logotipo;
    
    if (logoFile) {
      logoUrl = await uploadLogotipo(logoFile);
      if (!logoUrl) {
        alert('Erro ao fazer upload do logotipo. Tente novamente.');
        return;
      }
    }
    
    const url = editingId 
      ? `${API_BASE_URL}/api/admin/instituicoes/${editingId}`
      : `${API_BASE_URL}/api/admin/instituicoes`;
    
    try {
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          logotipo: logoUrl,
          cargos: currentEditais
        })
      });

      if (response.ok) {
        const dadosAtualizados = await response.json();
        console.log('=== RESPOSTA DO SERVIDOR ===');
        console.log('Dados atualizados:', dadosAtualizados);
        fetchInstituicoes();
        closeModal();
      } else {
        const error = await response.json();
        console.error('Erro na resposta:', error);
        alert(`Erro ao salvar instituição: ${error.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao salvar instituição:', error);
      alert('Erro ao salvar instituição. Verifique sua conexão.');
    }
  };

  const handleEdit = (instituicao) => {
    openModal(instituicao);
  };

  const handleVerEditais = (instituicao) => {
    navigate(`/admin/editais?search=${encodeURIComponent(instituicao.nome)}`);
  };

  const handleDelete = async (instituicao) => {
    const id = instituicao._id || instituicao;
    if (confirm('Tem certeza que deseja excluir esta instituição?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/instituicoes/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          fetchInstituicoes();
        }
      } catch (error) {
        console.error('Erro ao excluir instituição:', error);
      }
    }
  };

  const handleAddEdital = () => {
    if (!novoEdital.trim()) return;
    
    // @ts-ignore
    setCurrentEditais([...currentEditais, novoEdital.trim()]);
    setNovoEdital('');
  };

  const handleRemoveEdital = (index) => {
    // @ts-ignore
    setCurrentEditais(currentEditais.filter((_, i) => i !== index));
  };

  const handleLogoChange = (e) => {
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

    setLogoFile(file);

    // Criar preview da imagem
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setFormData({...formData, logotipo: result});
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteLogo = () => {
    setLogoFile(null);
    setFormData({...formData, logotipo: ''});
  };

  const handleEditEdital = (index) => {
    setEditingEdital(index);
    setEditalEditText(currentEditais[index]);
  };

  const handleSaveEditEdital = (index) => {
    if (!editalEditText.trim()) return;
    
    // @ts-ignore
    const newEditais = [...currentEditais];
    newEditais[index] = editalEditText.trim();
    setCurrentEditais(newEditais);
    setEditingEdital(null);
    setEditalEditText('');
  };

  const handleCancelEditEdital = () => {
    setEditingEdital(null);
    setEditalEditText('');
  };

  const handleDragStartEdital = (index) => {
    setDraggingEdital(index);
  };

  const handleDragOverEdital = (e, index) => {
    e.preventDefault();
  };

  const handleDropEdital = (dropIndex) => {
    if (draggingEdital === null || draggingEdital === dropIndex) {
      setDraggingEdital(null);
      return;
    }

    const newEditais = [...currentEditais];
    const draggedItem = newEditais[draggingEdital];
    
    newEditais.splice(draggingEdital, 1);
    newEditais.splice(dropIndex, 0, draggedItem);
    
    // @ts-ignore
    setCurrentEditais(newEditais);
    setDraggingEdital(null);
  };

  const handleDragEndEdital = () => {
    setDraggingEdital(null);
  };

  const handleVerEdital = (editalNome) => {
    // Fechar o modal atual primeiro
    closeModal();
    
    // Navegar para a página de editais com o filtro da instituição atual
    setTimeout(() => {
      // Encontrar a instituição atual
      const instituicaoAtual = instituicoes.find(inst => inst._id === editingId);
      if (instituicaoAtual) {
        navigate(`/admin/editais?search=${encodeURIComponent(instituicaoAtual.nome)}`);
      } else {
        navigate('/admin/editais');
      }
    }, 300);
  };

  return (
    <>
      <header className='flex justify-between head'>
        <h1>Instituições</h1>
        <button onClick={() => openModal()}>Nova Instituição</button>
      </header>

      {showModal && (
        <div 
          className={`modal-overlay${isClosing ? ' closing' : ''}`}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className={`form-modal${isClosing ? ' closing' : ''}`}>
            <h3>{editingId ? 'Editar' : 'Nova'} Instituição</h3>
          
          {/* Nome e Sigla lado a lado */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Nome da instituição"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              style={{ flex: 2 }}
            />
            
            <input
              type="text"
              placeholder="Sigla (ex: UFMG, USP)"
              value={formData.sigla}
              onChange={(e) => setFormData({...formData, sigla: e.target.value.toUpperCase()})}
              className="flex-1"
            />
          </div>
          
          {/* Upload do Logotipo */}
          <div className="avatar-upload-container">
            <div 
              className={`avatar-upload-button ${(formData.logotipo || logoFile) ? 'has-image' : ''}`}
              onClick={() => {
                const input = document.getElementById('logoInput');
                if (input) input.click();
              }}
            >
              {(formData.logotipo || logoFile) ? (
                <img
                  src={logoFile ? formData.logotipo : (formData.logotipo?.startsWith('data:') ? formData.logotipo : `${API_BASE_URL}${formData.logotipo}`)}
                  alt="Logotipo"
                />
              ) : (
                <span className="avatar-plus">+</span>
              )}
            </div>
            
            <input
              id="logoInput"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="avatar-upload-input"
            />
            
            <label className="avatar-upload-label">
              Logotipo da Instituição
              {(formData.logotipo || logoFile) && (
                <span 
                  onClick={deleteLogo}
                  className="avatar-delete-btn"
                >
                  (Excluir)
                </span>
              )}
            </label>
          </div>

          {/* Tipo de Instituição e Categoria lado a lado */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div className="flex-1">
              <label>
                Tipo de Instituição:
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({...formData, tipo: e.target.value})}
              >
                <option value="Concurso Público">Concurso Público</option>
                <option value="Enem">Enem</option>
                <option value="Vestibular">Vestibular</option>
                <option value="Residência Médica">Residência Médica</option>
                <option value="OAB">OAB</option>
                <option value="Concurso Militar">Concurso Militar</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div className="flex-1">
              <label>
                Categoria:
              </label>
              <SearchableSelect
                key={`categoria-${editingId || 'new'}-${formData.categoria}`}
                options={categorias}
                value={formData.categoria}
                onChange={(value) => setFormData({...formData, categoria: value})}
                placeholder="Selecione uma categoria..."
                displayKey="nome"
                valueKey="_id"
              />
            </div>
          </div>

          {/* Estado e Cidade lado a lado */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <div className="flex-1">
              <label>
                Estado:
              </label>
              <select
                value={formData.estado}
                onChange={(e) => {
                  const novoEstado = e.target.value;
                  setFormData({
                    ...formData, 
                    estado: novoEstado,
                    cidade: '' // Reset cidade when estado changes
                  });
                }}
              >
                <option value="">Selecione um estado</option>
                {ESTADOS_BRASILEIROS.map((estado) => (
                  <option key={estado.sigla} value={estado.sigla}>
                    {estado.nome} ({estado.sigla})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label>
                Cidade:
              </label>
              <select
                value={formData.cidade}
                onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                disabled={!formData.estado}
                style={{
                  backgroundColor: !formData.estado ? 'var(--darkmode-bg-tertiary)' : undefined
                }}
              >
                <option value="">
                  {!formData.estado ? 'Selecione um estado primeiro' : 'Selecione uma cidade'}
                </option>
                {formData.estado && CIDADES_POR_ESTADO[formData.estado]?.map((cidade) => (
                  <option key={cidade} value={cidade}>
                    {cidade}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Editais</label>
            <div style={{ display: 'flex', marginBottom: '10px' }}>
              <input
                type="text"
                value={novoEdital}
                onChange={(e) => setNovoEdital(e.target.value)}
                placeholder="Digite o nome do edital"
                style={{ flex: 1, marginRight: '8px' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEdital();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddEdital}
                className="admin-btn-primary"
                style={{ 
                  marginLeft: '8px', 
                  padding: '12px 16px',
                  fontSize: '14px',
                  height: '44px' // Altura similar ao input
                }}
              >
                Adicionar
              </button>
            </div>
            
            <div className="topicos-list">
              {/* @ts-ignore */}
              {currentEditais?.map((edital, index) => (
                <div
                  key={index}
                  className={`topico-item ${draggingEdital === index ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => handleDragStartEdital(index)}
                  onDragOver={(e) => handleDragOverEdital(e, index)}
                  onDrop={() => handleDropEdital(index)}
                  onDragEnd={handleDragEndEdital}
                  style={{
                    opacity: draggingEdital === index ? 0.5 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <span style={{ marginRight: '8px', color: 'var(--darkmode-text-secondary)' }}>⋮⋮</span>
                    {editingEdital === index ? (
                      <input
                        type="text"
                        value={editalEditText}
                        onChange={(e) => setEditalEditText(e.target.value)}
                        onBlur={() => handleSaveEditEdital(index)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEditEdital(index);
                          } else if (e.key === 'Escape') {
                            setEditingEdital(null);
                            setEditalEditText('');
                          }
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          fontSize: '14px'
                        }}
                      />
                    ) : (
                      <span 
                        style={{ flex: 1, cursor: 'text' }}
                        onClick={() => handleEditEdital(index)}
                        data-edital={edital}
                      >
                        {edital}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleVerEdital(edital)}
                      className="admin-btn-primary"
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px'
                      }}
                    >
                      Ver
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveEdital(index)}
                      className="admin-btn-danger-small"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              ))}
              {(!currentEditais || currentEditais.length === 0) && (
                <div style={{ color: '#999', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
                  Nenhum edital adicionado
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={handleSubmit} disabled={uploading}>
              {uploading ? 'Fazendo upload...' : (editingId ? 'Atualizar' : 'Criar')} Instituição
            </button>
            <button type="button" onClick={closeModal} disabled={uploading}>
              Cancelar
            </button>
          </div>
          </div>
        </div>
      )}

      <DataTable
        data={instituicoes}
        columns={columns}
        onEdit={null}
        onDelete={null}
        loading={loading}
      />
    </>
  );
}

export default Instituicoes;
