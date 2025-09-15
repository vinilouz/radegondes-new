import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useSearchParams } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import { API_BASE_URL } from '../../config/api';
import { useModal } from '../../hooks/useModal';
import ColorPicker from '../../components/ColorPicker';
import SearchableSelect from '../../components/SearchableSelect';
import { CORES_DISCIPLINAS } from '../../data/cores';

function Disciplinas() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [todasDisciplinas, setTodasDisciplinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ nome: '', cor: 'azul', edital: '' });
  const [showModal, setShowModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [novoTopico, setNovoTopico] = useState('');
  const [currentTopicos, setCurrentTopicos] = useState([]);
  const [editingTopico, setEditingTopico] = useState(null);
  const [topicoEditText, setTopicoEditText] = useState('');
  const [draggingTopico, setDraggingTopico] = useState(null);
  const [filtroEdital, setFiltroEdital] = useState('');
  const { token } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useModal(showModal);

  const openModal = (disciplina = null) => {
    if (disciplina) {
      setFormData({ 
        nome: disciplina.nome, 
        cor: disciplina.cor || 'azul',
        edital: disciplina.edital || ''
      });
      setEditingId(disciplina._id);
      setCurrentTopicos(disciplina.topicos || []);
    } else {
      // Para nova disciplina, só permite se houver um edital filtrado
      if (!filtroEdital) {
        alert('Selecione um edital primeiro para criar uma nova disciplina.');
        return;
      }
      setFormData({ 
        nome: '', 
        cor: 'azul', 
        edital: filtroEdital // Sempre usar o edital filtrado
      });
      setEditingId(null);
      setCurrentTopicos([]);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setIsClosing(true);
    
    // Wait for animation to complete before hiding modal
    setTimeout(() => {
      setShowModal(false);
      setIsClosing(false);
      setEditingId(null);
      setFormData({ nome: '', cor: 'azul', edital: '' });
      setCurrentTopicos([]);
      setNovoTopico('');
      setEditingTopico(null);
      setTopicoEditText('');
      setDraggingTopico(null);
    }, 250);
  };

  const columns = [
    { key: 'nome', label: 'Nome' },
    { 
      key: 'cor', 
      label: 'Cor',
      render: (item) => {
        const cor = CORES_DISCIPLINAS.find(c => c.value === item.cor);
        const corPadrao = CORES_DISCIPLINAS[0];
        const corFinal = cor || corPadrao;
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div 
              style={{ 
                width: '20px', 
                height: '20px', 
                borderRadius: '50%', 
                backgroundColor: corFinal.color,
                border: '2px solid #fff',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
              }}
            ></div>
            {corFinal.label}
          </div>
        );
      }
    },
    { 
      key: 'edital', 
      label: 'Edital',
      render: (item) => item.edital || 'Não definido'
    },
    { 
      key: 'topicos', 
      label: 'Tópicos',
      render: (item) => (
        <span>{item.topicos ? item.topicos.length : 0} tópicos</span>
      )
    },
    { 
      key: 'createdAt', 
      label: 'Data de Criação',
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
            Gerenciar Tópicos
          </button>
          <button
            onClick={() => handleDelete(item)}
            className="admin-btn-danger"
          >
            Remover
          </button>
        </div>
      )
    }
  ];

  useEffect(() => {
    document.title = 'Disciplinas - Radegondes';
    fetchDisciplinas();
    fetchAllDisciplinasForEditais();
  }, []);

  // Efeito para detectar parâmetro de edital na URL
  useEffect(() => {
    const editalParam = searchParams.get('edital');
    if (editalParam) {
      setFiltroEdital(editalParam);
    }
  }, [searchParams]);

  // Efeito para abrir modal de disciplina específica quando vem da URL
  useEffect(() => {
    const disciplinaParam = searchParams.get('disciplina');
    if (disciplinaParam && disciplinas.length > 0) {
      // @ts-ignore
      const disciplinaEncontrada = disciplinas.find(d => d._id === disciplinaParam);
      if (disciplinaEncontrada) {
        openModal(disciplinaEncontrada);
        // Limpar o parâmetro da URL após abrir o modal
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('disciplina');
        const newUrl = `${window.location.pathname}?${newSearchParams.toString()}`;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [disciplinas, searchParams]);

  // Recarregar dados quando o filtro de edital mudar
  useEffect(() => {
    fetchDisciplinas();
  }, [filtroEdital]);

  const fetchDisciplinas = async () => {
    try {
      const url = new URL(`${API_BASE_URL}/api/admin/disciplinas`);
      if (filtroEdital) {
        url.searchParams.append('edital', filtroEdital);
      }
      
      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDisciplinas(data);
      }
    } catch (error) {
      console.error('Erro ao buscar disciplinas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDisciplinas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/disciplinas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Erro ao buscar todas as disciplinas:', error);
    }
    return [];
  };

  const fetchAllDisciplinasForEditais = async () => {
    const todas = await fetchAllDisciplinas();
    setTodasDisciplinas(todas);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const url = editingId 
      ? `${API_BASE_URL}/api/admin/disciplinas/${editingId}`
      : `${API_BASE_URL}/api/admin/disciplinas`;
    
    try {
      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          topicos: currentTopicos
        })
      });

      if (response.ok) {
        fetchDisciplinas();
        closeModal();
      }
    } catch (error) {
      console.error('Erro ao salvar disciplina:', error);
    }
  };

  const handleEdit = (disciplina) => {
    openModal(disciplina);
  };

  const handleDelete = async (disciplina) => {
    const id = disciplina._id || disciplina;
    if (confirm('Tem certeza que deseja excluir esta disciplina?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/disciplinas/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          fetchDisciplinas();
        }
      } catch (error) {
        console.error('Erro ao excluir disciplina:', error);
      }
    }
  };

  const handleAddTopico = () => {
    if (!novoTopico.trim()) return;
    
    // @ts-ignore
    setCurrentTopicos([...currentTopicos, novoTopico.trim()]);
    setNovoTopico('');
  };

  const handleRemoveTopico = (index) => {
    // @ts-ignore
    setCurrentTopicos(currentTopicos.filter((_, i) => i !== index));
  };

  const handleEditTopico = (index) => {
    setEditingTopico(index);
    setTopicoEditText(currentTopicos[index]);
  };

  const handleSaveEditTopico = (index) => {
    if (!topicoEditText.trim()) return;
    
    // @ts-ignore
    const newTopicos = [...currentTopicos];
    newTopicos[index] = topicoEditText.trim();
    setCurrentTopicos(newTopicos);
    setEditingTopico(null);
    setTopicoEditText('');
  };

  const handleCancelEditTopico = () => {
    setEditingTopico(null);
    setTopicoEditText('');
  };

  const handleDragStartTopico = (index) => {
    setDraggingTopico(index);
  };

  const handleDragOverTopico = (e, index) => {
    e.preventDefault();
  };

  const handleDropTopico = (dropIndex) => {
    if (draggingTopico !== null && draggingTopico !== dropIndex) {
      const updatedTopicos = [...currentTopicos];
      const draggedItem = updatedTopicos[draggingTopico];
      updatedTopicos.splice(draggingTopico, 1);
      updatedTopicos.splice(dropIndex, 0, draggedItem);
      // @ts-ignore
      setCurrentTopicos(updatedTopicos);
    }
    setDraggingTopico(null);
  };

  const handleDragEndTopico = () => {
    setDraggingTopico(null);
  };

  // Filtrar disciplinas (edital já filtrado no backend se aplicável)
  const disciplinasFiltradas = disciplinas;

  // Criar lista de editais únicos para o filtro (usando todas as disciplinas)
  // @ts-ignore
  const editaisUnicos = [...new Set(todasDisciplinas.filter(d => d.edital).map(d => d.edital))]
    .sort()
    .map(edital => ({ nome: edital, value: edital }));

  return (
    <>
      <header className='flex justify-between head'>
        <h1>
          Disciplinas
          {filtroEdital && <span style={{ fontSize: '18px', color: 'var(--darkmode-text-secondary)', fontWeight: 'normal' }}> - {filtroEdital}</span>}
        </h1>
        {filtroEdital ? (
          <button onClick={() => openModal()}>Nova Disciplina</button>
        ) : (
          <div style={{ 
            padding: '8px 16px', 
            backgroundColor: 'var(--darkmode-bg-secondary)', 
            color: '#fff',
            borderRadius: '4px',
            fontSize: '14px'
          }}>
            Selecione um edital para gerenciar as disciplinas
          </div>
        )}
      </header>

      {/* Seção de Filtros e Busca */}
      <div>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '15px'
        }}>
          {/* Filtro por edital */}
          <div style={{ 
            display: 'flex', 
            gap: '15px', 
            alignItems: 'center',
            flexWrap: 'wrap',
            background: 'var(--darkmode-bg-secondary)',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid var(--darkmode-border-secondary)',
            marginBottom: '20px'
          }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            flex: '1',
            minWidth: '300px'
          }}>
            <label style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              color: 'var(--darkmode-text-primary)',
              whiteSpace: 'nowrap'
            }}>
              Filtrar por edital:
            </label>
            <div style={{ flex: '1', maxWidth: '300px' }}>
              <SearchableSelect
                value={filtroEdital}
                onChange={setFiltroEdital}
                options={[
                  { nome: 'Todos os editais', value: '' },
                  // @ts-ignore
                  ...editaisUnicos
                ]}
                placeholder=""
                displayKey="nome"
                valueKey="value"
              />
            </div>
            {filtroEdital && (
              <button
                onClick={() => setFiltroEdital('')}
                className="admin-btn-danger-small"
                style={{
                  whiteSpace: 'nowrap'
                }}
              >
                Limpar
              </button>
            )}
          </div>
          </div>
        </div>
        
        {/* Informação de filtros aplicados */}
        {filtroEdital && (
          <div style={{ 
            marginTop: '10px', 
            fontSize: '12px', 
            color: '#6c757d',
            fontStyle: 'italic',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <span>
              Exibindo {disciplinasFiltradas.length} de {disciplinas.length} disciplinas
            </span>
            {filtroEdital && (
              <span>
                • Edital: "{filtroEdital}"
              </span>
            )}
          </div>
        )}
      </div>

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
            <h3>{editingId ? 'Editar Disciplina' : 'Nova Disciplina'}</h3>
          
          <div className="form-section">
            <h4>Dados da Disciplina</h4>
            
            {/* Mostrar o edital atual */}
            <div className="info-box">
              <strong>Edital:</strong> {formData.edital || 'Não definido'}
            </div>
            
            <input
              type="text"
              placeholder="Nome da disciplina"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
            />
            
            <ColorPicker
              value={formData.cor}
              onChange={(cor) => setFormData({...formData, cor})}
              colors={CORES_DISCIPLINAS}
            />
          </div>          <div className="form-group">
            <label>Tópicos</label>
            <div style={{ display: 'flex', marginBottom: '10px' }}>
              <input
                type="text"
                value={novoTopico}
                onChange={(e) => setNovoTopico(e.target.value)}
                placeholder="Digite o nome do tópico"
                style={{ flex: 1, marginRight: '8px' }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTopico();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddTopico}
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
              {currentTopicos?.map((topico, index) => (
                <div
                  key={index}
                  className={`topico-item ${draggingTopico === index ? 'dragging' : ''}`}
                  draggable
                  onDragStart={() => handleDragStartTopico(index)}
                  onDragOver={(e) => handleDragOverTopico(e, index)}
                  onDrop={() => handleDropTopico(index)}
                  onDragEnd={handleDragEndTopico}
                  style={{
                    cursor: 'move',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    opacity: draggingTopico === index ? 0.5 : 1
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <span style={{ marginRight: '8px', color: 'var(--darkmode-text-secondary)' }}>⋮⋮</span>
                    {editingTopico === index ? (
                      <input
                        type="text"
                        value={topicoEditText}
                        onChange={(e) => setTopicoEditText(e.target.value)}
                        onBlur={() => handleSaveEditTopico(index)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEditTopico(index);
                          } else if (e.key === 'Escape') {
                            setEditingTopico(null);
                            setTopicoEditText('');
                          }
                        }}
                        autoFocus
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          border: '1px solid #007bff',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    ) : (
                      <span 
                        style={{ flex: 1, cursor: 'text' }}
                        onClick={() => handleEditTopico(index)}
                      >
                        {topico}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTopico(index)}
                    className="admin-btn-danger-small"
                  >
                    Remover
                  </button>
                </div>
              ))}
              {(!currentTopicos || currentTopicos.length === 0) && (
                <div style={{ color: 'var(--darkmode-text-secondary)', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
                  Nenhum tópico adicionado
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={handleSubmit}>
              {editingId ? 'Atualizar' : 'Criar'} Disciplina
            </button>
            <button type="button" onClick={closeModal}>
              Cancelar
            </button>
          </div>
          </div>
        </div>
      )}

      <DataTable
        data={disciplinasFiltradas}
        columns={columns}
        onEdit={null}
        onDelete={null}
        loading={loading}
        hideControls={true}
      />
    </>
  );
}

export default Disciplinas;
