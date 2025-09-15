import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DataTable from '../../components/DataTable';
import SearchableSelect from '../../components/SearchableSelect';
import ColorPicker from '../../components/ColorPicker';
import { useModal } from '../../hooks/useModal';
import { API_BASE_URL } from '../../config/api';
import { CORES_DISCIPLINAS } from '../../data/cores';

function Editais() {
  const [editais, setEditais] = useState([]);
  const [instituicoes, setInstituicoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroInstituicao, setFiltroInstituicao] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [editingEdital, setEditingEdital] = useState(null);
  const [formData, setFormData] = useState({ nome: '' });
  const [disciplinasEdital, setDisciplinasEdital] = useState([]);
  const [novaDisciplina, setNovaDisciplina] = useState({ nome: '', cor: 'azul' });
  const [editingDisciplina, setEditingDisciplina] = useState(null);
  const [disciplinaEditText, setDisciplinaEditText] = useState('');
  const [disciplinaEditCor, setDisciplinaEditCor] = useState('azul');
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useModal(showModal);

  const columns = [
    { 
      key: 'nome', 
      label: 'Nome do Edital'
    },
    { 
      key: 'instituicao', 
      label: 'Instituição',
      render: (item) => (
        <div className="flex items-center">
          {item.instituicao.logotipo && (
            <img 
              src={`${API_BASE_URL}${item.instituicao.logotipo}`} 
              alt={`Logo ${item.instituicao.nome}`}
              style={{ 
                width: '30px', 
                height: '30px', 
                objectFit: 'contain',
                marginRight: '8px'
              }}
            />
          )}
          <div>
            <div className="font-medium">{item.instituicao.nome}</div>
            <div className="text-sm text-gray-500">{item.instituicao.sigla}</div>
          </div>
        </div>
      )
    },
    { 
      key: 'categoria', 
      label: 'Categoria',
      render: (item) => item.instituicao.categoria?.nome || 'Sem categoria'
    },
    { 
      key: 'estado', 
      label: 'Estado',
      render: (item) => item.instituicao.estado || '-'
    },
    { 
      key: 'cidade', 
      label: 'Cidade',
      render: (item) => item.instituicao.cidade || '-'
    },
    { 
      key: 'tipo', 
      label: 'Tipo',
      render: (item) => item.instituicao.tipo || 'Concurso Público'
    },
    {
      key: 'acoes',
      label: 'Ações',
      render: (item) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleEdit(item)}
            className="admin-btn-info"
            style={{
              padding: '4px 8px',
              fontSize: '12px'
            }}
          >
            Editar
          </button>
          <button
            onClick={() => handleDelete(item)}
            className="admin-btn-danger-small"
          >
            Excluir
          </button>
        </div>
      )
    }
  ];

  useEffect(() => {
    document.title = 'Editais - Radegondes';
    fetchEditais();
    fetchInstituicoes();
  }, []);

  // Efeito para detectar parâmetro de busca na URL e converter para filtro de instituição
  useEffect(() => {
    const searchParam = searchParams.get('search');
    if (searchParam && instituicoes.length > 0) {
      // Encontrar a instituição pelo nome
      const instituicao = instituicoes.find(inst => 
        inst.nome.toLowerCase() === searchParam.toLowerCase()
      );
      if (instituicao) {
        setFiltroInstituicao(instituicao._id);
      }
      // Limpar parâmetro da URL após aplicar o filtro
      navigate('/admin/editais', { replace: true });
    }
  }, [searchParams, navigate, instituicoes]);

  const handleDisciplinas = (edital) => {
    navigate(`/admin/disciplinas?edital=${encodeURIComponent(edital.nome)}`);
  };

  const openModal = (edital) => {
    console.log('=== ABRINDO MODAL ===');
    console.log('Edital recebido:', edital);
    console.log('Nome do edital:', edital?.nome);
    console.log('Instituição do edital:', edital?.instituicao);
    
    if (!edital || !edital.nome) {
      console.error('Edital inválido:', edital);
      alert('Erro: dados do edital inválidos');
      return;
    }
    
    setEditingEdital(edital);
    setFormData({ nome: edital.nome });
    fetchDisciplinasDoEdital(edital.nome);
    setShowModal(true);
  };

  const closeModal = () => {
    setIsClosing(true);
    
    setTimeout(() => {
      setShowModal(false);
      setIsClosing(false);
      setEditingEdital(null);
      setFormData({ nome: '' });
      setDisciplinasEdital([]);
      setNovaDisciplina({ nome: '', cor: 'azul' });
      setEditingDisciplina(null);
      setDisciplinaEditText('');
      setDisciplinaEditCor('azul');
    }, 250);
  };

  const fetchDisciplinasDoEdital = async (nomeEdital) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/disciplinas?edital=${encodeURIComponent(nomeEdital)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setDisciplinasEdital(data);
      }
    } catch (error) {
      console.error('Erro ao buscar disciplinas do edital:', error);
    }
  };

  const handleSubmitEdital = async (e) => {
    e.preventDefault();
    
    console.log('=== INÍCIO SALVAMENTO EDITAL ===');
    console.log('editingEdital:', editingEdital);
    console.log('formData:', formData);
    
    if (!editingEdital) {
      alert('Erro: nenhum edital sendo editado');
      return;
    }
    
    if (!formData.nome.trim()) {
      alert('Por favor, digite um nome para o edital');
      return;
    }
    
    try {
      // Como os editais são cargos das instituições, precisamos atualizar a instituição
      const instituicaoId = editingEdital.instituicao._id;
      const nomeAntigoEdital = editingEdital.nome;
      const novoNomeEdital = formData.nome.trim();
      
      console.log('instituicaoId:', instituicaoId);
      console.log('nomeAntigoEdital:', nomeAntigoEdital);
      console.log('novoNomeEdital:', novoNomeEdital);
      
      // Se o nome não mudou, apenas feche o modal
      if (nomeAntigoEdital === novoNomeEdital) {
        console.log('Nome não mudou, fechando modal');
        closeModal();
        return;
      }
      
      // Buscar a instituição atual
      console.log('Buscando instituições...');
      const instituicaoResponse = await fetch(`${API_BASE_URL}/api/admin/instituicoes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Response status:', instituicaoResponse.status);
      
      if (!instituicaoResponse.ok) {
        throw new Error('Erro ao buscar instituições');
      }
      
      const instituicoes = await instituicaoResponse.json();
      console.log('Instituições encontradas:', instituicoes.length);
      
      const instituicao = instituicoes.find(inst => inst._id === instituicaoId);
      console.log('Instituição encontrada:', instituicao);
      
      if (!instituicao) {
        throw new Error('Instituição não encontrada');
      }
      
      // Verificar se já existe um edital com o novo nome na mesma instituição
      console.log('Cargos atuais:', instituicao.cargos);
      if (instituicao.cargos.includes(novoNomeEdital)) {
        alert('Já existe um edital com este nome nesta instituição');
        return;
      }
      
      // Atualizar o nome do cargo (edital) na lista de cargos
      const novosCargos = instituicao.cargos.map(cargo => 
        cargo === nomeAntigoEdital ? novoNomeEdital : cargo
      );
      
      console.log('Novos cargos:', novosCargos);
      
      // Atualizar a instituição
      console.log('Atualizando instituição...');
      const updateResponse = await fetch(`${API_BASE_URL}/api/admin/instituicoes/${instituicaoId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...instituicao,
          cargos: novosCargos
        })
      });

      console.log('Update response status:', updateResponse.status);

      if (updateResponse.ok) {
        console.log('Edital atualizado com sucesso no backend');
        
        // Atualizar o nome do edital nas disciplinas associadas
        console.log('Atualizando disciplinas...');
        await atualizarNomeEditalNasDisciplinas(nomeAntigoEdital, novoNomeEdital);
        
        // Atualizar o estado local imediatamente
        console.log('Atualizando estado local dos editais...');
        setEditais(prevEditais => 
          prevEditais.map(edital => 
            edital._id === editingEdital._id 
              ? { ...edital, nome: novoNomeEdital }
              : edital
          )
        );
        
        // Também atualizar o editingEdital para refletir a mudança
        setEditingEdital(prev => prev ? { ...prev, nome: novoNomeEdital } : null);
        
        console.log('Recarregando lista de editais do servidor...');
        // Recarregar a lista de editais do servidor para garantir consistência
        await fetchEditais();
        
        console.log('Fechando modal...');
        closeModal();
        
        // Feedback de sucesso
        console.log('Exibindo mensagem de sucesso');
        alert('Edital atualizado com sucesso!');
      } else {
        const errorData = await updateResponse.json();
        throw new Error(errorData.message || 'Erro ao atualizar instituição');
      }
    } catch (error) {
      console.error('Erro ao salvar edital:', error);
      alert(`Erro ao salvar edital: ${error.message}`);
    }
  };

  const atualizarNomeEditalNasDisciplinas = async (nomeAntigo, nomeNovo) => {
    try {
      // Buscar disciplinas do edital antigo
      const response = await fetch(`${API_BASE_URL}/api/admin/disciplinas?edital=${encodeURIComponent(nomeAntigo)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const disciplinas = await response.json();
        
        // Atualizar cada disciplina
        for (const disciplina of disciplinas) {
          await fetch(`${API_BASE_URL}/api/admin/disciplinas/${disciplina._id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ...disciplina,
              edital: nomeNovo
            })
          });
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar disciplinas:', error);
    }
  };

  const handleAddDisciplina = async () => {
    if (!novaDisciplina.nome.trim()) return;
    if (!editingEdital) {
      alert('Erro: edital não definido');
      return;
    }
    
    console.log('Estado do editingEdital na criação:', editingEdital); // Debug
    console.log('Nome do edital:', editingEdital?.nome); // Debug
    
    // Usar o nome do edital de forma mais robusta
    const nomeEdital = editingEdital.nome || formData.nome;
    
    if (!nomeEdital) {
      alert('Erro: nome do edital não encontrado');
      console.error('Edital sem nome:', editingEdital);
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/disciplinas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: novaDisciplina.nome.trim(),
          cor: novaDisciplina.cor,
          edital: nomeEdital,
          topicos: []
        })
      });

      if (response.ok) {
        const novaDisciplinaCriada = await response.json();
        
        // Recarregar as disciplinas do edital
        await fetchDisciplinasDoEdital(nomeEdital);
        
        // Limpar o formulário
        setNovaDisciplina({ nome: '', cor: 'azul' });
      } else {
        const errorData = await response.json();
        console.error('Erro na resposta:', errorData);
      }
    } catch (error) {
      console.error('Erro ao adicionar disciplina:', error);
    }
  };

  const handleEditDisciplina = (index) => {
    setEditingDisciplina(index);
    setDisciplinaEditText(disciplinasEdital[index].nome);
    setDisciplinaEditCor(disciplinasEdital[index].cor);
  };

  const handleSaveEditDisciplina = async (index) => {
    if (!disciplinaEditText.trim()) return;
    
    try {
      const disciplina = disciplinasEdital[index];
      const response = await fetch(`${API_BASE_URL}/api/admin/disciplinas/${disciplina._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nome: disciplinaEditText.trim(),
          cor: disciplinaEditCor,
          edital: disciplina.edital,
          topicos: disciplina.topicos
        })
      });

      if (response.ok) {
        fetchDisciplinasDoEdital(editingEdital.nome);
        setEditingDisciplina(null);
        setDisciplinaEditText('');
        setDisciplinaEditCor('azul');
      }
    } catch (error) {
      console.error('Erro ao editar disciplina:', error);
    }
  };

  const handleCancelEditDisciplina = () => {
    setEditingDisciplina(null);
    setDisciplinaEditText('');
    setDisciplinaEditCor('azul');
  };

  const handleRemoveDisciplina = async (index) => {
    if (!confirm('Tem certeza que deseja excluir esta disciplina?')) return;
    
    try {
      const disciplina = disciplinasEdital[index];
      const response = await fetch(`${API_BASE_URL}/api/admin/disciplinas/${disciplina._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchDisciplinasDoEdital(editingEdital.nome);
      }
    } catch (error) {
      console.error('Erro ao excluir disciplina:', error);
    }
  };

  const handleVerDisciplina = (disciplina) => {
    const confirmacao = confirm(
      `Deseja ir para a página de Disciplinas para editar "${disciplina.nome}"?\n\nIsto fechará o modal atual.`
    );
    
    if (confirmacao) {
      navigate(`/admin/disciplinas?edital=${encodeURIComponent(disciplina.edital)}&disciplina=${encodeURIComponent(disciplina._id)}`);
    }
  };

  const fetchEditais = async () => {
    try {
      console.log('=== RECARREGANDO EDITAIS ===');
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/admin/editais-list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Fetch editais response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Novos editais recebidos:', data.length);
        console.log('Editais atualizados:', data);
        setEditais(data);
        console.log('Estado editais atualizado');
      } else {
        console.error('Erro ao buscar editais, status:', response.status);
      }
    } catch (error) {
      console.error('Erro ao buscar editais:', error);
    } finally {
      setLoading(false);
      console.log('=== FIM RECARREGAMENTO EDITAIS ===');
    }
  };

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
    }
  };

  const handleVer = (edital) => {
    // Navegar para a página de instituições com parâmetros para abrir o modal
    navigate(`/admin/instituicoes?edit=${edital.instituicao._id}&edital=${encodeURIComponent(edital.nome)}`);
  };

  const handleEdit = (edital) => {
    openModal(edital);
  };

  const handleDelete = async (edital) => {
    if (!confirm('Tem certeza que deseja excluir este edital? Isso também excluirá todas as disciplinas associadas.')) return;
    
    try {
      // Primeiro excluir todas as disciplinas do edital
      const disciplinasResponse = await fetch(`${API_BASE_URL}/api/admin/disciplinas?edital=${encodeURIComponent(edital.nome)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (disciplinasResponse.ok) {
        const disciplinas = await disciplinasResponse.json();
        
        // Excluir cada disciplina
        for (const disciplina of disciplinas) {
          await fetch(`${API_BASE_URL}/api/admin/disciplinas/${disciplina._id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
      }

      // Então remover o cargo (edital) da instituição
      const instituicaoId = edital.instituicao._id;
      const nomeEdital = edital.nome;
      
      // Buscar a instituição atual
      const instituicaoResponse = await fetch(`${API_BASE_URL}/api/admin/instituicoes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!instituicaoResponse.ok) {
        throw new Error('Erro ao buscar instituições');
      }
      
      const instituicoes = await instituicaoResponse.json();
      const instituicao = instituicoes.find(inst => inst._id === instituicaoId);
      
      if (!instituicao) {
        throw new Error('Instituição não encontrada');
      }
      
      // Remover o cargo (edital) da lista de cargos
      const novosCargos = instituicao.cargos.filter(cargo => cargo !== nomeEdital);
      
      // Atualizar a instituição
      const updateResponse = await fetch(`${API_BASE_URL}/api/admin/instituicoes/${instituicaoId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...instituicao,
          cargos: novosCargos
        })
      });

      if (updateResponse.ok) {
        fetchEditais();
      } else {
        throw new Error('Erro ao atualizar instituição');
      }
    } catch (error) {
      console.error('Erro ao excluir edital:', error);
      alert('Erro ao excluir edital. Verifique o console para mais detalhes.');
    }
  };

  // Filtrar editais por instituição
  const editaisFiltrados = editais.filter(edital => {
    if (!filtroInstituicao) return true;
    return edital.instituicao._id === filtroInstituicao;
  });

  if (loading) {
    return <div>Carregando editais...</div>;
  }

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Gerenciar Editais</h1>
        <p>Lista de todos os editais criados nas instituições</p>
      </div>

      {editais.length === 0 ? (
        <div className="empty-state">
          <h3>Nenhum edital encontrado</h3>
          <p>Os editais são criados através das instituições. Acesse a página de Instituições para adicionar editais.</p>
        </div>
      ) : (
        <>
          {/* Seção de Filtros */}
          <div>
            <div style={{ 
              display: 'flex', 
              gap: '15px', 
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'space-between'
            }}>
              {/* Filtro por instituição */}
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
                  color: '#fff',
                  whiteSpace: 'nowrap'
                }}>
                  Filtrar por instituição:
                </label>
                <div style={{ flex: '1', maxWidth: '300px' }}>
                  <SearchableSelect
                    value={filtroInstituicao}
                    onChange={setFiltroInstituicao}
                    options={[
                      { _id: '', nome: 'Todas as instituições' },
                      ...instituicoes
                    ]}
                    placeholder="Selecione uma instituição"
                    displayKey="nome"
                    valueKey="_id"
                  />
                </div>
                {filtroInstituicao && (
                  <button
                    onClick={() => setFiltroInstituicao('')}
                    className="admin-btn-secondary"
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px'
                    }}
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Informações do filtro */}
            {(filtroInstituicao) && (
              <div style={{ 
                marginTop: '10px', 
                fontSize: '13px', 
                color: '#6c757d',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <span>
                  Exibindo {editaisFiltrados.length} de {editais.length} editais
                </span>
                {filtroInstituicao && (
                  <span>
                    • Filtro: {instituicoes.find(inst => inst._id === filtroInstituicao)?.nome || 'Instituição'}
                  </span>
                )}
              </div>
            )}
          </div>

          <DataTable
            data={editaisFiltrados}
            columns={columns}
            onEdit={null}
            onDelete={null}
            loading={loading}
            hideControls={true}
          />

          {showModal && (
            <div 
              className={`modal-overlay${isClosing ? ' closing' : ''}`}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  closeModal();
                }
              }}
            >
              <div className={`form-modal${isClosing ? ' closing' : ''}`} style={{ maxWidth: '800px' }}>
                <h3>Editar Edital</h3>
                
                <div className="form-section">
                  <h4>Dados do Edital</h4>
                  
                  {/* Mostrar a instituição */}
                  {editingEdital && editingEdital.instituicao && (
                    <div className="info-box" style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      {editingEdital.instituicao.logotipo && (
                        <img 
                          src={`${API_BASE_URL}${editingEdital.instituicao.logotipo}`} 
                          alt={`Logo ${editingEdital.instituicao.nome}`}
                          style={{ 
                            width: '30px', 
                            height: '30px', 
                            objectFit: 'contain'
                          }}
                        />
                      )}
                      <div>
                        <strong>Instituição:</strong> {editingEdital.instituicao.nome}
                        {editingEdital.instituicao.sigla && (
                          <span style={{ color: 'var(--darkmode-text-secondary)', marginLeft: '8px' }}>({editingEdital.instituicao.sigla})</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <input
                    type="text"
                    placeholder="Nome do edital"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Disciplinas</label>
                  <div style={{ display: 'flex', marginBottom: '10px', gap: '10px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        value={novaDisciplina.nome}
                        onChange={(e) => setNovaDisciplina({...novaDisciplina, nome: e.target.value})}
                        placeholder="Digite o nome da disciplina (Ex: Matemática, Português, Direito Administrativo)"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddDisciplina();
                          }
                        }}
                      />
                    </div>
                    <div style={{ width: '120px' }}>
                      <ColorPicker
                        value={novaDisciplina.cor}
                        onChange={(cor) => setNovaDisciplina({...novaDisciplina, cor})}
                        colors={CORES_DISCIPLINAS}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddDisciplina}
                      className="admin-btn-primary"
                      style={{ 
                        padding: '12px 16px',
                        fontSize: '14px',
                        height: '44px'
                      }}
                    >
                      Adicionar
                    </button>
                  </div>
                  
                  <div className="topicos-list">
                    {disciplinasEdital?.map((disciplina, index) => (
                      <div
                        key={disciplina._id}
                        className="topico-item"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '10px' }}>
                          {editingDisciplina === index ? (
                            <>
                              <input
                                type="text"
                                value={disciplinaEditText}
                                onChange={(e) => setDisciplinaEditText(e.target.value)}
                                onBlur={() => handleSaveEditDisciplina(index)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    handleSaveEditDisciplina(index);
                                  } else if (e.key === 'Escape') {
                                    handleCancelEditDisciplina();
                                  }
                                }}
                                autoFocus
                                style={{
                                  flex: 1,
                                  padding: '4px 8px',
                                  fontSize: '14px'
                                }}
                              />
                              <div style={{ width: '120px' }}>
                                <ColorPicker
                                  value={disciplinaEditCor}
                                  onChange={setDisciplinaEditCor}
                                  colors={CORES_DISCIPLINAS}
                                />
                              </div>
                            </>
                          ) : (
                            <>
                              <div 
                                style={{ 
                                  width: '20px', 
                                  height: '20px', 
                                  borderRadius: '50%', 
                                  backgroundColor: CORES_DISCIPLINAS.find(c => c.value === disciplina.cor)?.color || CORES_DISCIPLINAS[0].color,
                                  border: '2px solid #fff',
                                  boxShadow: '0 0 0 1px rgba(0,0,0,0.1)'
                                }}
                              ></div>
                              <span 
                                style={{ flex: 1, cursor: 'text' }}
                                onClick={() => handleEditDisciplina(index)}
                              >
                                {disciplina.nome}
                              </span>
                            </>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => handleVerDisciplina(disciplina)}
                            className="admin-btn-primary"
                            style={{
                              padding: '4px 8px',
                              fontSize: '12px'
                            }}
                          >
                            Ver Disciplina
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveDisciplina(index)}
                            className="admin-btn-danger-small"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!disciplinasEdital || disciplinasEdital.length === 0) && (
                      <div style={{ color: '#999', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
                        Nenhuma disciplina adicionada
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={(e) => {
                      console.log('=== BOTÃO CLICADO ===');
                      console.log('Event:', e);
                      console.log('editingEdital atual:', editingEdital);
                      console.log('formData atual:', formData);
                      handleSubmitEdital(e);
                    }}
                  >
                    Atualizar Edital
                  </button>
                  <button type="button" onClick={closeModal}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Editais;
