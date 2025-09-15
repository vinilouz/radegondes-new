/* eslint-disable */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import ColorPicker from '../../components/ColorPicker';
import { CORES_DISCIPLINAS } from '../../data/cores';
import { SkeletonStats, SkeletonList } from '../../components/Skeleton';

const cores = {
  azul: 'var(--darkmode-text-link)',
  verde: '#10B981',
  vermelho: '#EF4444',
  amarelo: '#F59E0B',
  roxo: '#8B5CF6',
  laranja: '#F97316',
  rosa: '#EC4899',
  cinza: 'var(--darkmode-text-secondary)'
};

function PlanoDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [plano, setPlano] = useState({
    nome: '',
    descricao: '',
    editais: [],
    disciplinas: 0,
    topicos: 0,
    horasEstudo: 0,
    questoesTotal: 0,
    disciplinasDetalhadas: []
  });
  const [tempoDeEstudos, setTempoDeEstudos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [menuAberto, setMenuAberto] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditDisciplinaModal, setShowEditDisciplinaModal] = useState(false);
  const [showNovaDisciplinaModal, setShowNovaDisciplinaModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: ''
  });
  const [disciplinaSelecionada, setDisciplinaSelecionada] = useState(null);
  const [formDataDisciplina, setFormDataDisciplina] = useState({
    nome: '',
    cor: 'azul',
    topicos: []
  });
  const [formDataNovaDisciplina, setFormDataNovaDisciplina] = useState({
    nome: '',
    cor: 'azul',
    topicos: []
  });
  const [editandoTopico, setEditandoTopico] = useState(null);
  const [novoTopico, setNovoTopico] = useState('');

  const [statusDisciplinas, setStatusDisciplinas] = useState({});
  const [topicosAgendados, setTopicosAgendados] = useState({});
  const [jaVerificouModal, setJaVerificouModal] = useState(false);

  useEffect(() => {
    document.title = 'Detalhes do Estudo - Radegondes';
    fetchPlano();
    fetchStatusDisciplinas();
    fetchTopicosAgendados();

    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('edit') === 'true') {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [id]);

  // Estado específico para controlar a abertura automática do modal
  const [deveAbrirModalAutomatico, setDeveAbrirModalAutomatico] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const shouldEdit = searchParams.get('edit') === 'true';

    if (shouldEdit && !jaVerificouModal) {
      console.log('🎯 Parâmetro edit=true detectado, configurando para abrir modal...');

      // Limpar URL imediatamente
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      setJaVerificouModal(true);
      setDeveAbrirModalAutomatico(true);
    }
  }, [id]); // Mudança: depender apenas do id, não do location.search

  // Effect separado para abrir o modal quando o plano estiver carregado
  useEffect(() => {
    if (deveAbrirModalAutomatico && plano && plano.nome && !loading && !showEditModal) {
      console.log('🎯 Verificando se deve abrir modal para plano carregado...');

      const isPersonalizado = isPlanoPersonalizado(plano);
      const semDisciplinas = !plano.disciplinasDetalhadas || plano.disciplinasDetalhadas.length === 0;

      console.log('🔍 Verificações finais:', {
        isPersonalizado,
        semDisciplinas,
        editais: plano.editais,
        shouldOpenModal: isPersonalizado && semDisciplinas
      });

      if (isPersonalizado && semDisciplinas) {
        console.log('✅ ABRINDO MODAL AUTOMATICAMENTE!');

        const timer = setTimeout(() => {
          console.log('⏰ Timer executado, abrindo modal...');
          setShowEditModal(true);
          setIsClosing(false);
          setDeveAbrirModalAutomatico(false); // Reset flag
        }, 300);

        return () => {
          console.log('🧹 Limpando timer...');
          clearTimeout(timer);
        };
      } else {
        console.log('❌ Não vai abrir modal automaticamente');
        setDeveAbrirModalAutomatico(false); // Reset flag mesmo se não abrir
      }
    }
  }, [deveAbrirModalAutomatico, plano, loading, showEditModal]);

  // Função para verificar se um tópico está agendado
  const verificarTopicoAgendado = (disciplinaId, nomeTopico) => {
    const chave = `${disciplinaId}_${nomeTopico}`;
    return topicosAgendados[chave];
  };

  const fetchStatusDisciplinas = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/registros-estudo?limit=1000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        const registros = data.registros || [];

        const statusMap = {};

        registros.forEach(registro => {
          if (registro.disciplinaId && registro.tempoEstudo > 0) {
            statusMap[registro.disciplinaId] = true;
          }
        });
        if (data && Array.isArray(data.registros)) {
          const registrosDoPlano = data.registros.filter(registro => registro.plano === id);
          const totalTempoEstudo = registrosDoPlano
            .filter(registro => registro.tempoEstudo != null)
            .reduce((acc, registro) => acc + registro.tempoEstudo, 0);
          setTempoDeEstudos(formatarTempo(totalTempoEstudo));
        }
        setStatusDisciplinas(statusMap);

      }
    } catch (error) {
      console.error('Erro ao buscar status das disciplinas:', error);
    }
  };

  const fetchTopicosAgendados = async () => {
    if (!token) return;

    try {
      // Buscar registros de estudo com agendamento
      const response = await fetch(`${API_BASE_URL}/api/registros-estudo?dataOpcao=agendar&limit=1000`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        // Criar um mapa de tópicos agendados por disciplina e tópico
        const agendados = {};
        (data.registros || []).forEach(registro => {
          if (registro.dataAgendada && registro.disciplinaId && registro.topico) {
            const chave = `${registro.disciplinaId}_${registro.topico}`;
            agendados[chave] = {
              dataAgendada: registro.dataAgendada,
              horarioAgendado: registro.horarioAgendado || ''
            };
          }
        });
        setTopicosAgendados(agendados);
      }
    } catch (error) {
      console.error('Erro ao buscar tópicos agendados:', error);
    }
  };

  const fetchPlano = async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`${API_BASE_URL}/api/planos/${id}?_t=${timestamp}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPlano(data);
        setFormData({
          nome: data.nome,
          descricao: data.descricao || 'Sem informações extras'
        });
        document.title = `${data.nome} - Radegondes`;
      } else if (response.status === 404) {
        navigate('/planos');
      } else {
        const errorText = await response.text();
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const verificarDisciplinaEstudando = (disciplina) => {
    return statusDisciplinas[disciplina._id] || false;
  };

  const isPlanoPersonalizado = (plano) => {
    console.log('🔍 Verificando se é plano personalizado:', {
      editais: plano?.editais,
      editaisLength: plano?.editais?.length,
      isArray: Array.isArray(plano?.editais)
    });

    if (!plano?.editais || !Array.isArray(plano.editais) || plano.editais.length === 0) {
      console.log('✅ É personalizado: sem editais ou array vazio');
      return true;
    }

    const resultado = plano.editais.some(edital => {
      if (!edital || typeof edital !== 'object' || !edital.nome) {
        console.log('✅ É personalizado: edital inválido');
        return true;
      }
      const nomeEdital = edital.nome.toLowerCase().trim();
      const isPersonalizado = nomeEdital === 'editalpersonalizado' || nomeEdital === 'personalizado';
      console.log('🔍 Verificando edital:', { nome: edital.nome, nomeEdital, isPersonalizado });
      return isPersonalizado;
    });

    console.log('🎯 Resultado final isPlanoPersonalizado:', resultado);
    return resultado;
  };

  const openEditModal = () => {
    setJaVerificouModal(true);
    setShowEditModal(true);
    setIsClosing(false);
  };

  const handleNovaDisciplina = () => {
    setFormDataNovaDisciplina({
      nome: '',
      cor: 'azul',
      topicos: []
    });
    setShowNovaDisciplinaModal(true);
  };

  const closeEditModal = () => {
    setJaVerificouModal(true);
    setIsClosing(true);

    setTimeout(() => {
      setShowEditModal(false);
      setIsClosing(false);
    }, 300);
  };

  const handleVisualizarDisciplina = (disciplina) => {
    navigate(`/planos/${id}/disciplinas/${disciplina._id}`);
  };

  const handleEditarDisciplina = (disciplina) => {
    setDisciplinaSelecionada(disciplina);
    setFormDataDisciplina({
      nome: disciplina.nome,
      cor: disciplina.cor,
      topicos: disciplina.topicos || []
    });
    setShowEditDisciplinaModal(true);
  };

  const closeEditDisciplinaModal = () => {
    setShowEditDisciplinaModal(false);
    setDisciplinaSelecionada(null);
    setFormDataDisciplina({ nome: '', cor: 'azul', topicos: [] });
    setEditandoTopico(null);
    setNovoTopico('');
  };

  const handleAdicionarTopico = () => {
    if (novoTopico.trim()) {
      const topicoJaExiste = formDataDisciplina.topicos.includes(novoTopico.trim());
      if (topicoJaExiste) {
        alert('Este tópico já existe!');
        return;
      }
      setFormDataDisciplina(prev => ({
        ...prev,
        topicos: [...prev.topicos, novoTopico.trim()]
      }));
      setNovoTopico('');
    }
  };

  const handleEditarTopico = (index, novoTexto) => {
    setFormDataDisciplina(prev => ({
      ...prev,
      topicos: prev.topicos.map((topico, i) => i === index ? novoTexto : topico)
    }));
    setEditandoTopico(null);
  };

  const handleRemoverTopico = (index) => {
    setFormDataDisciplina(prev => ({
      ...prev,
      topicos: prev.topicos.filter((_, i) => i !== index)
    }));
  };

  const handleEditDisciplinaSubmit = async (e) => {
    e.preventDefault();

    if (!disciplinaSelecionada) {
      alert('Nenhuma disciplina selecionada!');
      return;
    }

    try {
      const testResponse = await fetch(`${API_BASE_URL}/api/planos`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!testResponse.ok) {
        alert('Erro de conectividade com o servidor. Verifique se o backend está rodando.');
        return;
      }
    } catch (connectError) {
      alert('Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 5000.');
      return;
    }

    try {
      const url = `${API_BASE_URL}/api/planos/${id}/disciplinas/${disciplinaSelecionada._id}`;

      const requestData = {
        nome: formDataDisciplina.nome,
        cor: formDataDisciplina.cor,
        topicos: formDataDisciplina.topicos
      };

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      const responseText = await response.text();

      if (response.ok) {
        let updatedPlano;
        try {
          updatedPlano = JSON.parse(responseText);

          const disciplinaAtualizada = updatedPlano.disciplinasDetalhadas?.find(d => d._id === disciplinaSelecionada._id);
          if (!disciplinaAtualizada) {
          }

        } catch (parseError) {
          alert('Erro ao processar resposta do servidor');
          return;
        }

        setPlano(updatedPlano);

        await new Promise(resolve => setTimeout(resolve, 500));

        await fetchPlano();

        closeEditDisciplinaModal();
        alert('Disciplina atualizada com sucesso!');
      } else {
        alert(`Erro ao atualizar disciplina: ${response.status} - ${responseText}`);
      }
    } catch (error) {
      alert(`Erro ao atualizar disciplina: ${error.message}`);
    }
  };

  const handleSalvarNovaDisciplina = async () => {
    if (!formDataNovaDisciplina.nome.trim()) {
      alert('Por favor, insira o nome da disciplina.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/planos/${id}/disciplinas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formDataNovaDisciplina)
      });

      if (response.ok) {
        const updatedPlano = await response.json();
        setPlano(updatedPlano);
        closeNovaDisciplinaModal();
        alert('Nova disciplina criada com sucesso!');
      } else {
        const errorData = await response.text();
        alert(`Erro ao criar disciplina: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      alert(`Erro ao criar disciplina: ${error.message}`);
    }
  };

  const handleAdicionarTopicoNova = () => {
    if (novoTopico.trim()) {
      const topicoJaExiste = formDataNovaDisciplina.topicos.includes(novoTopico.trim());
      if (topicoJaExiste) {
        alert('Este tópico já existe!');
        return;
      }
      setFormDataNovaDisciplina(prev => ({
        ...prev,
        topicos: [...prev.topicos, novoTopico.trim()]
      }));
      setNovoTopico('');
    }
  };

  const handleEditarTopicoNova = (index, novoTexto) => {
    setFormDataNovaDisciplina(prev => ({
      ...prev,
      topicos: prev.topicos.map((topico, i) => i === index ? novoTexto : topico)
    }));
  };

  const handleRemoverTopicoNova = (index) => {
    setFormDataNovaDisciplina(prev => ({
      ...prev,
      topicos: prev.topicos.filter((_, i) => i !== index)
    }));
  };

  const closeNovaDisciplinaModal = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShowNovaDisciplinaModal(false);
      setIsClosing(false);
      setFormDataNovaDisciplina({
        nome: '',
        cor: 'azul',
        topicos: []
      });
      setNovoTopico('');
    }, 250);
  };

  const handleRemoverDisciplina = async (disciplina) => {
    const confirmDelete = window.confirm(`Tem certeza que deseja remover a disciplina "${disciplina.nome}" do estudo?`);

    if (!confirmDelete) return;

    const originalText = event.target.textContent;
    if (event.target) {
      event.target.textContent = 'Removendo...';
      event.target.disabled = true;
    }

    try {
      console.log('=== REMOVENDO DISCIPLINA ===');
      console.log('Disciplina:', disciplina);
      console.log('Plano ID:', id);
      console.log('URL:', `${API_BASE_URL}/api/planos/${id}/disciplinas/${disciplina._id}`);
      console.log('Token presente:', !!token);

      const response = await fetch(`${API_BASE_URL}/api/planos/${id}/disciplinas/${disciplina._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('Response data:', data);
        alert(data.message || 'Disciplina removida com sucesso!');
        await fetchPlano();
      } else {
        const errorData = await response.json();
        console.error('Erro na resposta:', errorData);
        alert(errorData.message || 'Erro ao remover disciplina. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao remover disciplina:', error);
      alert(`Erro de conexão: ${error.message}. Verifique sua internet e tente novamente.`);
    } finally {
      if (event.target) {
        event.target.textContent = originalText;
        event.target.disabled = false;
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE_URL}/api/planos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchPlano();
        closeEditModal();
      } else {
      }
    } catch (error) {
    }
  };

  const handleDelete = async () => {
    if (!plano.nome) return;

    const confirmDelete = window.confirm(`Tem certeza que deseja excluir o estudo "${plano.nome}"?`);

    if (!confirmDelete) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/planos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Estudo excluído com sucesso!');
        navigate('/planos');
      } else {
        alert('Erro ao excluir estudo. Tente novamente.');
      }
    } catch (error) {
      alert('Erro ao excluir estudo. Tente novamente.');
    }
  };

  const formatarTempo = (segundos) => {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segundosRestantes = segundos % 60;

    if (horas > 0) {
      return `${horas}h ${minutos.toString().padStart(2, '0')}m ${segundosRestantes.toString().padStart(2, '0')}s`;
    } else if (minutos > 0) {
      return `${minutos}m ${segundosRestantes.toString().padStart(2, '0')}s`;
    } else {
      return `${segundosRestantes}s`;
    }
  };

  if (loading) {
    return (
      <>
        <header className='flex flex-col head'>
          <div style={{
            height: '32px',
            width: '200px',
            background: 'linear-gradient(90deg, var(--darkmode-bg-secondary) 25%, var(--darkmode-bg-tertiary) 50%, var(--darkmode-bg-secondary) 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-loading 1.5s infinite',
            borderRadius: '4px',
            marginBottom: '8px'
          }} />
          <div style={{
            height: '16px',
            width: '300px',
            background: 'linear-gradient(90deg, var(--darkmode-bg-secondary) 25%, var(--darkmode-bg-tertiary) 50%, var(--darkmode-bg-secondary) 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-loading 1.5s infinite',
            borderRadius: '4px'
          }} />
        </header>

        <SkeletonStats count={3} />
        <SkeletonList count={5} />

        <style>
          {`
            @keyframes skeleton-loading {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}
        </style>
      </>
    );
  }

  if (!plano || !plano.nome) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '18px',
        color: 'var(--darkmode-text-secondary)'
      }}>
        Plano não encontrado
      </div>
    );
  }

  return (
    <>
      <style>
        {`
          @keyframes fadeIn {
            from { 
              opacity: 0;
            }
            to { 
              opacity: 1;
            }
          }
          
          @keyframes fadeOut {
            from { 
              opacity: 1;
            }
            to { 
              opacity: 0;
            }
          }
          
          @keyframes slideUp {
            from { 
              opacity: 0;
              transform: translateY(30px) scale(0.98);
            }
            to { 
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          
          @keyframes slideDown {
            from { 
              opacity: 1;
              transform: translateY(0) scale(1);
            }
            to { 
              opacity: 0;
              transform: translateY(30px) scale(0.98);
            }
          }
          
          .modal-overlay {
            transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .modal-content {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          
          .nova-disciplina-button:hover {
            background-color: #E66912 !important;
            color: var(--darkmode-text-primary) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 8px rgba(230, 105, 18, 0.2) !important;
          }
          
          .edit-button:hover {
            background-color: var(--darkmode-text-secondary) !important;
            color: var(--darkmode-text-primary) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 8px rgba(107, 114, 128, 0.2) !important;
          }
          
          .delete-button:hover {
            background-color: #EF4444 !important;
            color: var(--darkmode-text-primary) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 8px rgba(239, 68, 68, 0.2) !important;
          }
          
          .disciplina-card {
            position: relative;
            transition: all 0.3s ease;
          }
          
          .disciplina-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4) !important;
          }
          
          .disciplina-actions {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.95);
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            border-radius: 12px;
          }
          
          .disciplina-card:hover .disciplina-actions {
            opacity: 1;
            visibility: visible;
          }
          
          .action-button {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 16px;
            background: var(--darkmode-bg-secondary);
            border: 2px solid var(--darkmode-border-secondary);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            min-width: 80px;
          }
          
          .action-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          }
          
          .action-button.visualizar:hover {
            border-color: var(--darkmode-text-link);
            color: var(--darkmode-text-link);
            background-color: var(--darkmode-bg-tertiary);
            transform: translateY(-3px);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.3);
          }
          
          .action-button.editar:hover {
            border-color: #E66912;
            color: #E66912;
          }
          
          .action-button.remover:hover {
            border-color: #EF4444;
            color: #EF4444;
          }
        `}
      </style>
      <div className="plano-detalhes-container">
        {/* Header Hero Section */}
        <div className="plano-hero">
          <div className="plano-hero-content">
            <div className="plano-info">
              <h1 className="plano-hero-title">{plano.nome}</h1>

              {/* Exibir informações de Instituição e Edital APENAS para estudos não-personalizados */}
              {plano.editais && Array.isArray(plano.editais) && plano.editais.length > 0 &&
                /* @ts-ignore */
                plano.editais.some(edital => {
                  if (!edital || typeof edital !== 'object' || !edital.nome) return false;
                  const nomeEdital = edital.nome.toLowerCase().trim();
                  return nomeEdital !== 'editalpersonalizado' && nomeEdital !== 'personalizado';
                }) && (
                  <div style={{
                    marginTop: '12px',
                    marginBottom: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    {/* @ts-ignore */}
                    {plano.editais
                      .filter(edital => {
                        if (!edital || typeof edital !== 'object' || !edital.nome) return false;
                        const nomeEdital = edital.nome.toLowerCase().trim();
                        return nomeEdital !== 'editalpersonalizado' && nomeEdital !== 'personalizado';
                      })
                      .map((edital, index) => (
                        <div key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px',
                          color: 'var(--darkmode-text-secondary)'
                        }}>
                          {/* @ts-ignore */}
                          <span style={{
                            fontWeight: '600',
                            color: '#E66912'
                          }}>
                            {edital.instituicao && edital.instituicao.nome
                              ? edital.instituicao.nome
                              : 'Instituição'}
                            {edital.instituicao && edital.instituicao.sigla && (
                              <span> ({edital.instituicao.sigla})</span>
                            )}
                          </span>
                          <span> - </span>
                          {/* @ts-ignore */}
                          <span>{edital.nome}</span>
                        </div>
                      ))}
                  </div>
                )}

              <p className="plano-hero-description">{plano.descricao || 'Sem descrição'}</p>
            </div>
            <div className="plano-actions">
              <button
                onClick={handleNovaDisciplina}
                className="btn-primary-hero"
              >
                + Nova Disciplina
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  openEditModal();
                }}
                className="btn-secondary-hero"
              >
                Editar
              </button>
              <button
                onClick={handleDelete}
                className="btn-danger-hero"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="dashboard-stats">
          <div className="stat-card-dashboard">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 19.5C4 20.3284 4.67157 21 5.5 21H18.5C19.3284 21 20 20.3284 20 19.5V6.5C20 5.67157 19.3284 5 18.5 5H5.5C4.67157 5 4 5.67157 4 6.5V19.5Z" stroke="#E66912" strokeWidth="1.5" fill="none" />
                <path d="M7 9H17" stroke="#E66912" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M7 13H17" stroke="#E66912" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M7 17H14" stroke="#E66912" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-number">{plano.disciplinas}</div>
              <div className="stat-label">Disciplinas</div>
            </div>
          </div>
          <div className="stat-card-dashboard">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="#E66912" strokeWidth="1.5" />
                <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="#E66912" strokeWidth="1.5" />
                <path d="M9 12H15" stroke="#E66912" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M9 16H15" stroke="#E66912" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-number">
                {plano.disciplinasDetalhadas?.reduce((total, disciplina) => {
                  const topicosTotal = disciplina.topicosTotal || disciplina.topicos?.length || 0;
                  return total + topicosTotal;
                }, 0) || 0}
              </div>
              <div className="stat-label">Tópicos</div>
            </div>
          </div>
          <div className="stat-card-dashboard">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="9" stroke="#E66912" strokeWidth="1.5" />
                <path d="M12 7V12L16 16" stroke="#E66912" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="stat-content">
              <div className="stat-number">{tempoDeEstudos}</div>
              <div className="stat-label">Horas de Estudo</div>
            </div>
          </div>
        </div>

        {/* Disciplinas Section */}
        <div className="disciplinas-section">
          <div className="section-header">
            <h2 className="section-title">
              Disciplinas
            </h2>
            <div className="section-subtitle">
              Escolha a disciplina
            </div>
          </div>

          {/* Lista de Disciplinas em Cards Horizontais */}
          <div className="disciplinas-list">
            {plano.disciplinasDetalhadas?.map((disciplina, index) => {
              const questoesResolvidas = disciplina.questoesResolvidas || 0;

              const temAtividade = disciplina.horasEstudo > 0 || questoesResolvidas > 0;
              const topicosConcluidos = disciplina.topicosEstudados || 0;
              const topicosTotal = disciplina.topicosTotal || disciplina.topicos?.length || 0;
              const percentualConclusao = topicosTotal > 0 ? (topicosConcluidos / topicosTotal) * 100 : 0;

              // Verificar se a disciplina está sendo estudada (tem tópicos com timer > 0)
              const estaEstudando = verificarDisciplinaEstudando(disciplina);

              let statusEstudo, statusCor;
              if (estaEstudando) {
                statusEstudo = 'Estudando';
                statusCor = '#10B981';
              } else if (percentualConclusao >= 100) {
                statusEstudo = 'Finalizado';
                statusCor = '#10B981';
              } else if (temAtividade) {
                statusEstudo = 'Em atividade';
                statusCor = '#E66912';
              } else {
                statusEstudo = 'Não iniciado';
                statusCor = 'var(--darkmode-text-secondary)';
              }

              return (
                <div
                  key={disciplina._id}
                  className="disciplina-card-horizontal"
                  onClick={() => handleVisualizarDisciplina(disciplina)}
                >
                  <div className="disciplina-main-content">
                    <div className="disciplina-header-horizontal">
                      <div className="disciplina-info">
                        <div className="disciplina-nome">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              className="disciplina-cor-indicator"
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: cores[disciplina.cor] || cores.azul,
                                flexShrink: 0
                              }}
                            ></div>
                            <span>{disciplina.nome}</span>
                          </div>
                          {statusEstudo !== 'Não iniciado' && (
                            <span
                              className="status-badge"
                              style={{
                                backgroundColor: `${statusCor}15`,
                                color: statusCor,
                                border: `1px solid ${statusCor}30`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: estaEstudando ? '4px' : '0'
                              }}
                            >
                              {estaEstudando && (
                                <span style={{
                                  width: '6px',
                                  height: '6px',
                                  backgroundColor: '#10B981',
                                  borderRadius: '50%'
                                }}></span>
                              )}
                              {statusEstudo}
                            </span>
                          )}
                        </div>
                        <div className="disciplina-meta">
                          <span className="meta-item">
                            {(() => {
                              if (topicosTotal === 0) {
                                return 'Nenhum tópico';
                              } else if (topicosTotal === 1) {
                                return '1 tópico';
                              } else {
                                return `${topicosTotal} tópicos`;
                              }
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="disciplina-actions-horizontal">
                    <button
                      className="btn-action-inline btn-editar"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditarDisciplina(disciplina);
                      }}
                    >
                      Gerenciar Tópicos
                    </button>
                    <button
                      className="btn-action-inline btn-remover"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoverDisciplina(disciplina);
                      }}
                    >
                      Remover
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Estado vazio para disciplinas */}
            {(!plano.disciplinasDetalhadas || plano.disciplinasDetalhadas.length === 0) && (
              <div className="empty-disciplinas">
                <div className="empty-icon">📚</div>
                <h3 className="empty-title">Nenhuma disciplina cadastrada</h3>
                <p className="empty-text">
                  Comece adicionando sua primeira disciplina ao plano de estudos
                </p>
                <button
                  onClick={handleNovaDisciplina}
                  className="btn-empty-state"
                >
                  + Adicionar Primeira Disciplina
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Edição */}
      {showEditModal && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            opacity: isClosing ? 0 : 1,
            visibility: 'visible'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeEditModal();
            }
          }}
        >
          <div
            className="modal-content"
            style={{
              backgroundColor: 'var(--darkmode-bg-secondary)',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              transform: isClosing ? 'translateY(30px) scale(0.98)' : 'translateY(0) scale(1)',
              opacity: isClosing ? 0 : 1
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>
              Editar Estudo
            </h2>

            <form onSubmit={handleEditSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: 'var(--darkmode-text-primary)'
                }}>
                  Nome do Estudo:
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--darkmode-border-secondary)',
                    borderRadius: '6px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--darkmode-text-link)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--darkmode-border-secondary)'}
                  required
                />
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: 'var(--darkmode-text-primary)'
                }}>
                  Descrição:
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--darkmode-border-secondary)',
                    borderRadius: '6px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    resize: 'vertical'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--darkmode-text-link)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--darkmode-border-secondary)'}
                  placeholder="Adicione uma descrição para o estudo..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={closeEditModal}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'var(--darkmode-bg-quaternary)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    color: 'var(--darkmode-text-primary)'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'var(--darkmode-text-link)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    color: 'var(--darkmode-text-primary)'
                  }}
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição de Disciplina */}
      {showEditDisciplinaModal && (
        <div
          id="edit-disciplina-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            opacity: 1,
            visibility: 'visible'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeEditDisciplinaModal();
            }
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--darkmode-bg-secondary)',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              opacity: 1,
              transform: 'scale(1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>
              Editar Disciplina
            </h2>

            <form onSubmit={handleEditDisciplinaSubmit}>
              {/* Nome e Cor lado a lado */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '20px',
                marginBottom: '20px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500',
                    color: 'var(--darkmode-text-primary)'
                  }}>
                    Nome da Disciplina:
                  </label>
                  <input
                    type="text"
                    value={formDataDisciplina.nome}
                    onChange={(e) => setFormDataDisciplina(prev => ({ ...prev, nome: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--darkmode-border-secondary)',
                      borderRadius: '6px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--darkmode-text-link)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--darkmode-border-secondary)'}
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500',
                    color: 'var(--darkmode-text-primary)'
                  }}>
                    Cor da Disciplina:
                  </label>
                  <ColorPicker
                    value={formDataDisciplina.cor}
                    onChange={(cor) => setFormDataDisciplina(prev => ({ ...prev, cor }))}
                    colors={CORES_DISCIPLINAS}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: 'var(--darkmode-text-primary)'
                }}>
                  Tópicos
                </label>

                {/* Lista de tópicos existentes */}
                <div style={{ marginBottom: '15px' }}>
                  {formDataDisciplina.topicos.map((topico, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '8px',
                        padding: '8px',
                        backgroundColor: 'var(--darkmode-bg-tertiary)',
                        borderRadius: '6px',
                        border: '1px solid var(--darkmode-border-secondary)'
                      }}
                    >
                      {editandoTopico === index ? (
                        <input
                          type="text"
                          value={topico}
                          onChange={(e) => {
                            const novoTexto = e.target.value;
                            setFormDataDisciplina(prev => ({
                              ...prev,
                              topicos: prev.topicos.map((t, i) => i === index ? novoTexto : t)
                            }));
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              setEditandoTopico(null);
                            }
                          }}
                          onBlur={() => setEditandoTopico(null)}
                          style={{
                            flex: 1,
                            padding: '6px 8px',
                            border: '1px solid var(--darkmode-text-link)',
                            borderRadius: '4px',
                            fontSize: '14px',
                            outline: 'none'
                          }}
                          autoFocus
                        />
                      ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '14px', color: 'var(--darkmode-text-primary)' }}>
                            {index + 1}. {topico}
                          </span>
                          {verificarTopicoAgendado(disciplinaSelecionada?._id, topico) && (
                            <span style={{
                              fontSize: '11px',
                              fontWeight: '600',
                              color: 'var(--orange-primary)',
                              backgroundColor: 'rgba(255, 107, 53, 0.1)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid rgba(255, 107, 53, 0.3)'
                            }}>
                              Agendada
                            </span>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => setEditandoTopico(editandoTopico === index ? null : index)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: 'var(--darkmode-text-link)',
                          color: 'var(--darkmode-text-primary)',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        {editandoTopico === index ? 'Salvar' : 'Editar'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoverTopico(index)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#EF4444',
                          color: 'var(--darkmode-text-primary)',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>

                {/* Adicionar novo tópico */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center'
                }}>
                  <input
                    type="text"
                    value={novoTopico}
                    onChange={(e) => setNovoTopico(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAdicionarTopico();
                      }
                    }}
                    placeholder="Digite um novo tópico (Ex: PDF 1 - Radegondes)"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      border: '2px solid var(--darkmode-border-secondary)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--darkmode-text-link)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--darkmode-border-secondary)'}
                  />
                  <button
                    type="button"
                    onClick={handleAdicionarTopico}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#E66912',
                      color: 'var(--darkmode-text-primary)',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  type="button"
                  onClick={closeEditDisciplinaModal}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'var(--darkmode-bg-quaternary)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    color: 'var(--darkmode-text-primary)'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'var(--darkmode-text-link)',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    color: 'var(--darkmode-text-primary)'
                  }}
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Disciplina */}
      {showNovaDisciplinaModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: isClosing ? 'fadeOut 0.25s ease-out' : 'fadeIn 0.25s ease-in'
          }}
          onClick={closeNovaDisciplinaModal}
        >
          <div
            style={{
              backgroundColor: 'var(--darkmode-bg-secondary)',
              borderRadius: '12px',
              padding: '30px',
              maxWidth: '800px',
              width: '90%',
              maxHeight: '90%',
              overflow: 'auto',
              position: 'relative',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              animation: isClosing ? 'slideOut 0.25s ease-out' : 'slideIn 0.25s ease-in'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{
              margin: '0 0 25px 0',
              fontSize: '24px',
              fontWeight: '600',
              color: 'var(--darkmode-text-primary)',
              borderBottom: '2px solid var(--darkmode-bg-quaternary)',
              paddingBottom: '15px'
            }}>
              Nova Disciplina
            </h2>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleSalvarNovaDisciplina();
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '20px',
                marginBottom: '25px'
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500',
                    color: 'var(--darkmode-text-primary)'
                  }}>
                    Nome da Disciplina:
                  </label>
                  <input
                    type="text"
                    value={formDataNovaDisciplina.nome}
                    onChange={(e) => setFormDataNovaDisciplina(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Digite o nome da disciplina (Ex: Matemática, Português, Direito Administrativo)"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid var(--darkmode-border-secondary)',
                      borderRadius: '6px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s'
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--darkmode-text-link)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--darkmode-border-secondary)'}
                    required
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '500',
                    color: 'var(--darkmode-text-primary)'
                  }}>
                    Cor da Disciplina:
                  </label>
                  <ColorPicker
                    value={formDataNovaDisciplina.cor}
                    onChange={(cor) => setFormDataNovaDisciplina(prev => ({ ...prev, cor }))}
                    colors={CORES_DISCIPLINAS}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '500',
                  color: 'var(--darkmode-text-primary)'
                }}>
                  Tópicos
                </label>

                {/* Lista de tópicos existentes */}
                <div style={{ marginBottom: '15px' }}>
                  {formDataNovaDisciplina.topicos.map((topico, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '8px',
                        padding: '8px',
                        backgroundColor: 'var(--darkmode-bg-tertiary)',
                        borderRadius: '6px',
                        border: '1px solid var(--darkmode-border-secondary)'
                      }}
                    >
                      <span style={{ flex: 1, fontSize: '14px', color: 'var(--darkmode-text-primary)' }}>
                        {index + 1}. {topico}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoverTopicoNova(index)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#EF4444',
                          color: 'var(--darkmode-text-primary)',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>

                {/* Adicionar novo tópico */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <input
                    type="text"
                    value={novoTopico}
                    onChange={(e) => setNovoTopico(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAdicionarTopicoNova();
                      }
                    }}
                    placeholder="Digite um novo tópico (Ex: PDF 1 - Radegondes)"
                    style={{
                      flex: 1,
                      padding: '10px 12px',
                      border: '1px solid var(--darkmode-border-secondary)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: 'var(--darkmode-bg-tertiary)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAdicionarTopicoNova}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#E66912',
                      color: 'var(--darkmode-text-primary)',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    Adicionar
                  </button>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                paddingTop: '20px',
                borderTop: '1px solid var(--darkmode-border-secondary)'
              }}>
                <button
                  type="button"
                  onClick={closeNovaDisciplinaModal}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'transparent',
                    border: '2px solid var(--darkmode-border-secondary)',
                    borderRadius: '6px',
                    color: 'var(--darkmode-text-secondary)',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#E66912',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'var(--darkmode-text-primary)',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  Salvar Disciplina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default PlanoDetalhes;
