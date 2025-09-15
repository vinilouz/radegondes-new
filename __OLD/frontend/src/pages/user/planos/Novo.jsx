import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config/api';

function Novo() {
  const { token, user } = useAuth();
  
  useEffect(() => {
    document.title = 'Novo Plano - Radegondes';
    fetchCategorias();
    fetchInstituicoes();
  }, []);

  // Fechar dropdowns quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      // @ts-ignore
      const target = event.target;
      if (!target.closest('.dropdown-container')) {
        setShowInstituicoesList(false);
        setShowCategoriasList(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const estados = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
    "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
    "SP", "SE", "TO"
  ];

  const regioes = {
    Norte: ["AC", "AP", "AM", "PA", "RO", "RR", "TO"],
    Nordeste: ["AL", "BA", "CE", "MA", "PB", "PE", "PI", "RN", "SE"],
    "Centro-Oeste": ["DF", "GO", "MT", "MS"],
    Sul: ["PR", "RS", "SC"],
    Sudeste: ["ES", "MG", "RJ", "SP"],
    Federal: ["DF"]
  };

  const [estadosAtivos, setEstadosAtivos] = useState([]); // string[]
  const [regiaoAtiva, setRegiaoAtiva] = useState(null); // string | null
  const [categorias, setCategorias] = useState([]); // any[]
  const [categoriasAtivas, setCategoriasAtivas] = useState([]); // string[]
  const [tiposAtivos, setTiposAtivos] = useState([]); // string[]
  const [instituicoes, setInstituicoes] = useState([]); // any[]
  const [instituicoesSelecionadas, setInstituicoesSelecionadas] = useState([]); // array de IDs
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState([]); // array de IDs  
  const [textoSearch, setTextoSearch] = useState('');
  const [showInstituicoesList, setShowInstituicoesList] = useState(false);
  const [showCategoriasList, setShowCategoriasList] = useState(false);
  const [instituicaoExpandida, setInstituicaoExpandida] = useState(null);
  const [cargosSelecionados, setCargosSelecionados] = useState([]); // array de objetos {instituicao, cargo}
  const [editaisStats, setEditaisStats] = useState({}); // objeto para armazenar {nomeEdital: {disciplinas: X, topicos: Y}}

  const tiposInstituicao = [
    "Concurso Público",
    "Enem", 
    "Vestibular",
    "Residência Médica",
    "OAB",
    "Concurso Militar",
    "Outros"
  ];

  const fetchCategorias = async () => {
    try {
      console.log('Iniciando busca de categorias...');
      console.log('Token:', token ? 'Presente' : 'Ausente');
      console.log('URL:', `${API_BASE_URL}/api/categorias`);
      
      const response = await fetch(`${API_BASE_URL}/api/categorias`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Response status categorias:', response.status);
      console.log('Response ok categorias:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Categorias carregadas:', data);
        console.log('Número de categorias:', data.length);
        setCategorias(data);
      } else {
        console.error('Erro na resposta categorias:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Erro detalhado categorias:', errorText);
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const fetchInstituicoes = async () => {
    try {
      console.log('Iniciando busca de instituições...');
      console.log('Token:', token ? 'Presente' : 'Ausente');
      console.log('URL:', `${API_BASE_URL}/api/instituicoes`);
      
      const response = await fetch(`${API_BASE_URL}/api/instituicoes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Instituições carregadas:', data);
        console.log('Número de instituições:', data.length);
        setInstituicoes(data);
      } else {
        console.error('Erro na resposta:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Erro detalhado:', errorText);
      }
    } catch (error) {
      console.error('Erro ao buscar instituições:', error);
    }
  };

  const fetchEditalStats = async (nomeEdital) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/edital/${encodeURIComponent(nomeEdital)}/stats`);
      
      if (response.ok) {
        const stats = await response.json();
        setEditaisStats(prev => ({
          ...prev,
          [nomeEdital]: {
            disciplinas: stats.disciplinas,
            topicos: stats.topicos
          }
        }));
      } else {
        console.error('Erro ao buscar estatísticas do edital:', nomeEdital);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas do edital:', error);
    }
  };

  const handleRegiaoClick = (regiao) => {
    const estadosRegiao = regioes[regiao];
    
    // Se a região já está ativa, desativá-la
    if (regiaoAtiva === regiao) {
      setRegiaoAtiva(null);
      setEstadosAtivos([]);
    } else {
      // Ativar a nova região
      setRegiaoAtiva(regiao);
      setEstadosAtivos(estadosRegiao);
    }
  };

    const handleEstadoClick = (estado) => {
    // Limpar região ativa quando clicamos em estado individual
    setRegiaoAtiva(null);
    
    // @ts-ignore
    setEstadosAtivos(prev => {
      if (prev.includes(estado)) {
        return prev.filter(uf => uf !== estado);
      } else {
        return [...prev, estado];
      }
    });
  };

  const handleCategoriaChipClick = (categoriaId) => {
    // @ts-ignore
    setCategoriasAtivas(prev => {
      if (prev.includes(categoriaId)) {
        return prev.filter(id => id !== categoriaId);
      } else {
        return [...prev, categoriaId];
      }
    });
  };

  const handleTipoClick = (tipo) => {
    // @ts-ignore
    setTiposAtivos(prev => {
      if (prev.includes(tipo)) {
        return prev.filter(t => t !== tipo);
      } else {
        return [...prev, tipo];
      }
    });
  };

  const handleInstituicaoClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('=== CLIQUE NA INSTITUIÇÃO ===');
    console.log('Estado atual do dropdown:', showInstituicoesList);
    console.log('Número de instituições carregadas:', instituicoes.length);
    console.log('Primeiro item das instituições:', instituicoes[0]);
    setShowInstituicoesList(!showInstituicoesList);
    setShowCategoriasList(false); // Fechar o outro dropdown
    console.log('Novo estado do dropdown será:', !showInstituicoesList);
  };

  const handleCategoriaClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Clique na categoria, estado atual:', showCategoriasList);
    setShowCategoriasList(!showCategoriasList);
    setShowInstituicoesList(false); // Fechar o outro dropdown
  };

  const handleInstituicaoSelect = (instituicao) => {
    // @ts-ignore
    setInstituicoesSelecionadas(prev => {
      if (prev.some(inst => inst._id === instituicao._id)) {
        return prev.filter(inst => inst._id !== instituicao._id);
      } else {
        return [...prev, instituicao];
      }
    });
  };

  const handleCategoriaSelect = (categoria) => {
    // @ts-ignore
    setCategoriasSelecionadas(prev => {
      if (prev.some(cat => cat._id === categoria._id)) {
        return prev.filter(cat => cat._id !== categoria._id);
      } else {
        return [...prev, categoria];
      }
    });
  };

  const toggleInstituicao = (instituicaoId) => {
    setInstituicaoExpandida(
      instituicaoExpandida === instituicaoId ? null : instituicaoId
    );
  };

  const handleCargoClick = (instituicao, cargo) => {
    const cargoKey = `${instituicao._id}-${cargo}`;
    // @ts-ignore
    setCargosSelecionados(prev => {
      const jaExiste = prev.some(item => item.id === cargoKey);
      if (jaExiste) {
        return prev.filter(item => item.id !== cargoKey);
      } else {
        // Buscar estatísticas do edital quando adicionado
        fetchEditalStats(cargo);
        
        return [...prev, {
          id: cargoKey,
          // @ts-ignore
          instituicao: { 
            nome: instituicao.nome, 
            sigla: instituicao.sigla,
            _id: instituicao._id
          },
          cargo: cargo
        }];
      }
    });
  };

  const removerCargo = (cargoId) => {
    // @ts-ignore
    setCargosSelecionados(prev => prev.filter(item => item.id !== cargoId));
  };

  const calcularTotais = () => {
    let totalDisciplinas = 0;
    let totalTopicos = 0;
    
    cargosSelecionados.forEach(item => {
      const stats = editaisStats[item.cargo];
      if (stats) {
        totalDisciplinas += stats.disciplinas;
        totalTopicos += stats.topicos;
      }
    });
    
    return { totalDisciplinas, totalTopicos };
  };

  const criarPlano = async () => {
    if (cargosSelecionados.length === 0) {
      alert('Selecione pelo menos um edital para criar o plano.');
      return;
    }

    try {
      // Lógica de nomeação dos planos
      const instituicoesUnicas = [...new Set(cargosSelecionados.map(item => item.instituicao.sigla))];
      let nomePlano;

      if (instituicoesUnicas.length === 1) {
        // Se todos os cargos são da mesma instituição, usar o nome da instituição
        const instituicaoNome = cargosSelecionados[0].instituicao.nome;
        nomePlano = `Plano ${instituicaoNome}`;
      } else {
        // Se são de instituições diferentes, usar o nome do usuário
        const nomeUsuario = user?.nome || 'Usuário';
        
        // Buscar quantos planos já existem para gerar numeração
        const planosResponse = await fetch(`${API_BASE_URL}/api/planos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        let numeroPlano = 1;
        if (planosResponse.ok) {
          const planosExistentes = await planosResponse.json();
          // Contar planos que começam com "Plano {nomeUsuario}"
          const planosDoUsuario = planosExistentes.filter(plano => 
            plano.nome.startsWith(`Plano ${nomeUsuario}`)
          );
          numeroPlano = planosDoUsuario.length + 1;
        }

        nomePlano = numeroPlano === 1 ? `Plano ${nomeUsuario}` : `Plano ${nomeUsuario} ${numeroPlano}`;
      }

      const response = await fetch(`${API_BASE_URL}/api/planos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          nome: nomePlano,
          cargos: cargosSelecionados.map(item => ({
            instituicao: {
              nome: item.instituicao.nome,
              sigla: item.instituicao.sigla,
              _id: item.instituicao._id
            },
            cargo: item.cargo
          }))
        })
      });

      if (response.ok) {
        // Redirecionar para a lista de planos
        window.location.href = '/planos';
      } else {
        const errorData = await response.json();
        console.error('Erro do servidor:', errorData);
        alert(errorData.message || 'Erro ao criar plano.');
      }
    } catch (error) {
      console.error('Erro ao criar plano:', error);
      alert('Erro ao criar plano. Tente novamente.');
    }
  };

  const isCargoSelecionado = (instituicao, cargo) => {
    const cargoKey = `${instituicao._id}-${cargo}`;
    // @ts-ignore
    return cargosSelecionados.some(item => item.id === cargoKey);
  };

  // Função para filtrar instituições em tempo real
  const getInstituicoesFiltradas = () => {
    // @ts-ignore
    return instituicoes.filter(instituicao => {
      // Filtro: apenas instituições com cargos
      if (!instituicao.cargos || instituicao.cargos.length === 0) {
        return false;
      }

      // Filtro por estados (se algum estado estiver selecionado)
      if (estadosAtivos.length > 0) {
        // @ts-ignore
        if (!estadosAtivos.includes(instituicao.estado)) {
          return false;
        }
      }

      // Filtro por tipos de instituição (se algum tipo estiver selecionado)
      if (tiposAtivos.length > 0) {
        // @ts-ignore
        if (!tiposAtivos.includes(instituicao.tipo)) {
          return false;
        }
      }

      // Filtro por categorias (se alguma categoria estiver selecionada)
      if (categoriasSelecionadas.length > 0) {
        // @ts-ignore
        const instituicaoTemCategoria = categoriasSelecionadas.some(catSelecionada => 
          // @ts-ignore
          instituicao.categoria && instituicao.categoria._id === catSelecionada._id
        );
        if (!instituicaoTemCategoria) {
          return false;
        }
      }

      // Filtro por instituições específicas (se alguma instituição estiver selecionada)
      if (instituicoesSelecionadas.length > 0) {
        // @ts-ignore
        const instituicaoEstaSelecionada = instituicoesSelecionadas.some(instSelecionada => 
          // @ts-ignore
          instSelecionada._id === instituicao._id
        );
        if (!instituicaoEstaSelecionada) {
          return false;
        }
      }

      // Filtro por texto de busca
      if (textoSearch.trim() !== '') {
        const termo = textoSearch.toLowerCase();
        const nomeMatch = instituicao.nome.toLowerCase().includes(termo);
        const siglaMatch = instituicao.sigla.toLowerCase().includes(termo);
        const cidadeMatch = instituicao.cidade.toLowerCase().includes(termo);
        const tipoMatch = instituicao.tipo.toLowerCase().includes(termo);
        // @ts-ignore
        const cargoMatch = instituicao.cargos.some(cargo => 
          cargo.toLowerCase().includes(termo)
        );
        
        if (!nomeMatch && !siglaMatch && !cidadeMatch && !tipoMatch && !cargoMatch) {
          return false;
        }
      }

      return true;
    });
  };

  return (
    <div className="novo-plano-page">
      <header className='flex flex-col head'>
        <h1>Novo Plano</h1>
      </header>
      
      {/* Seleção de Estados */}
      <div className="regions">
        <div className="flex justify-between item states">
          <span 
            onClick={() => handleRegiaoClick('Norte')}
            className={regiaoAtiva === 'Norte' ? 'active' : ''}
            style={{ cursor: 'pointer' }}
          >
            Norte
          </span>
          <span 
            onClick={() => handleRegiaoClick('Nordeste')}
            className={regiaoAtiva === 'Nordeste' ? 'active' : ''}
            style={{ cursor: 'pointer' }}
          >
            Nordeste
          </span>
          <span 
            onClick={() => handleRegiaoClick('Centro-Oeste')}
            className={regiaoAtiva === 'Centro-Oeste' ? 'active' : ''}
            style={{ cursor: 'pointer' }}
          >
            Centro-Oeste
          </span>
          <span 
            onClick={() => handleRegiaoClick('Sul')}
            className={regiaoAtiva === 'Sul' ? 'active' : ''}
            style={{ cursor: 'pointer' }}
          >
            Sul
          </span>
          <span 
            onClick={() => handleRegiaoClick('Sudeste')}
            className={regiaoAtiva === 'Sudeste' ? 'active' : ''}
            style={{ cursor: 'pointer' }}
          >
            Sudeste
          </span>
          <span 
            onClick={() => handleRegiaoClick('Federal')}
            className={regiaoAtiva === 'Federal' ? 'active' : ''}
            style={{ cursor: 'pointer' }}
          >
            Federal
          </span>
        </div>
        <div className="flex flex-wrap gap-2 item uf">
          {/* @ts-ignore */}
          {estados.map(uf => (
            <span 
              key={uf} 
              className={estadosAtivos.includes(uf) ? 'active' : ''}
              onClick={() => handleEstadoClick(uf)}
              style={{ cursor: 'pointer' }}
            >
              {uf}
            </span>
          ))}
        </div>
      </div>

      {/* Seleção de Tipos de Instituições */}
      <div className="regions">
        <div className="flex flex-wrap gap-2 item uf">
          {/* @ts-ignore */}
          {tiposInstituicao.map(tipo => (
            <span 
              key={tipo} 
              className={tiposAtivos.includes(tipo) ? 'active' : ''}
              onClick={() => handleTipoClick(tipo)}
              style={{ cursor: 'pointer' }}
            >
              {tipo}
            </span>
          ))}
        </div>
      </div>

      {/* Campos de Busca */}
      <div className="regions">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }} className="item uf">
          {/* Instituições */}
          <div className="dropdown-container" style={{ position: 'relative' }}>
            <input
              type="text"
              value={
                // @ts-ignore
                instituicoesSelecionadas.map(inst => inst.sigla).join(', ')
              }
              onClick={handleInstituicaoClick}
              placeholder="Selecionar instituições..."
              style={{
                width: '100%',
                padding: '8px 40px 8px 12px',
                border: '1px solid #E6691230',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#E6691215',
                color: 'var(--darkmode-text-primary)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='%23E66912' viewBox='0 0 16 16'%3e%3cpath d='m7.247 11.14 4.796-5.481c.566-.647.106-1.659-.753-1.659H1.698a1 1 0 0 0-.753 1.659l4.796 5.48a1 1 0 0 0 1.506 0z'/%3e%3c/svg%3e\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '12px'
              }}
              onMouseEnter={(e) => {
                // @ts-ignore
                e.target.style.backgroundColor = '#E6691225';
                // @ts-ignore
                e.target.style.borderColor = '#E6691240';
              }}
              onMouseLeave={(e) => {
                // @ts-ignore
                e.target.style.backgroundColor = '#E6691215';
                // @ts-ignore
                e.target.style.borderColor = '#E6691230';
              }}
              readOnly
            />
            {showInstituicoesList && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#E6691215',
                border: '1px solid #E6691230',
                borderTop: 'none',
                borderRadius: '0 0 4px 4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}>
                {/* @ts-ignore */}
                {instituicoes.map(instituicao => (
                  <div
                    key={instituicao._id}
                    onClick={() => handleInstituicaoSelect(instituicao)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--darkmode-border-secondary)',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--darkmode-text-primary)'
                    }}
                    onMouseEnter={(e) => {
                      // @ts-ignore
                      e.target.style.backgroundColor = 'var(--darkmode-bg-tertiary)'
                    }}
                    onMouseLeave={(e) => {
                      // @ts-ignore
                      e.target.style.backgroundColor = 'var(--darkmode-bg-secondary)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        // @ts-ignore
                        instituicoesSelecionadas.some(inst => inst._id === instituicao._id)
                      }
                      onChange={() => {}} // Controlado pelo onClick do div pai
                      style={{ pointerEvents: 'none' }}
                    />
                    {/* @ts-ignore */}
                    {instituicao.sigla} - {instituicao.nome}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Categoria */}
          <div className="dropdown-container" style={{ position: 'relative' }}>
            <input
              type="text"
              value={
                // @ts-ignore
                categoriasSelecionadas.map(cat => cat.nome).join(', ')
              }
              onClick={handleCategoriaClick}
              placeholder="Selecionar categorias..."
              style={{
                width: '100%',
                padding: '8px 40px 8px 12px',
                border: '1px solid #E6691230',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#E6691215',
                color: 'var(--darkmode-text-primary)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='%23E66912' viewBox='0 0 16 16'%3e%3cpath d='m7.247 11.14 4.796-5.481c.566-.647.106-1.659-.753-1.659H1.698a1 1 0 0 0-.753 1.659l4.796 5.48a1 1 0 0 0 1.506 0z'/%3e%3c/svg%3e\")",
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '12px'
              }}
              onMouseEnter={(e) => {
                // @ts-ignore
                e.target.style.backgroundColor = '#E6691225';
                // @ts-ignore
                e.target.style.borderColor = '#E6691240';
              }}
              onMouseLeave={(e) => {
                // @ts-ignore
                e.target.style.backgroundColor = '#E6691215';
                // @ts-ignore
                e.target.style.borderColor = '#E6691230';
              }}
              readOnly
            />
            {showCategoriasList && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: '#E6691215',
                border: '1px solid #E6691230',
                borderTop: 'none',
                borderRadius: '0 0 4px 4px',
                maxHeight: '200px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}>
                {/* @ts-ignore */}
                {categorias.map(categoria => (
                  <div
                    key={categoria._id}
                    onClick={() => handleCategoriaSelect(categoria)}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--darkmode-border-secondary)',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--darkmode-text-primary)'
                    }}
                    onMouseEnter={(e) => {
                      // @ts-ignore
                      e.target.style.backgroundColor = 'var(--darkmode-bg-tertiary)'
                    }}
                    onMouseLeave={(e) => {
                      // @ts-ignore
                      e.target.style.backgroundColor = 'var(--darkmode-bg-secondary)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        // @ts-ignore
                        categoriasSelecionadas.some(cat => cat._id === categoria._id)
                      }
                      onChange={() => {}} // Controlado pelo onClick do div pai
                      style={{ pointerEvents: 'none' }}
                    />
                    {/* @ts-ignore */}
                    {categoria.nome}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Campo de Texto */}
          <div>
            <input
              type="text"
              value={textoSearch}
              onChange={(e) => setTextoSearch(e.target.value)}
              placeholder="Digite termos para busca..."
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #E6691230',
                borderRadius: '4px',
                fontSize: '14px',
                backgroundColor: '#E6691215',
                color: 'var(--darkmode-text-primary)',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                // @ts-ignore
                e.target.style.backgroundColor = '#E6691225';
                // @ts-ignore
                e.target.style.borderColor = '#E66912';
              }}
              onBlur={(e) => {
                // @ts-ignore
                e.target.style.backgroundColor = '#E6691215';
                // @ts-ignore
                e.target.style.borderColor = '#E6691230';
              }}
            />
          </div>
        </div>
      </div>
      
      <div className="flex w-100 planos">
        <section style={{ flex: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
              Instituições disponíveis para estudo
            </h3>
            <div style={{ 
              fontSize: '14px', 
              color: 'var(--darkmode-text-secondary)',
              backgroundColor: 'var(--darkmode-bg-tertiary)',
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid var(--darkmode-border-secondary)'
            }}>
              {getInstituicoesFiltradas().length} de {instituicoes.filter(inst => inst.cargos && inst.cargos.length > 0).length} instituições
            </div>
          </div>
          
          <div className="instituicoes-list">
            {/* @ts-ignore */}
            {getInstituicoesFiltradas().map(instituicao => (
              <div 
                key={instituicao._id} 
                className="instituicao-card"
                style={{
                  border: '1px solid var(--darkmode-border-secondary)',
                  borderRadius: '8px',
                  marginBottom: '15px',
                  backgroundColor: 'var(--darkmode-bg-secondary)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div 
                  className="instituicao-header"
                  onClick={() => toggleInstituicao(instituicao._id)}
                  style={{
                    padding: '15px 20px',
                    cursor: 'pointer',
                    borderBottom: instituicaoExpandida === instituicao._id ? '1px solid var(--darkmode-border-secondary)' : 'none',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: instituicaoExpandida === instituicao._id ? 'var(--darkmode-bg-tertiary)' : 'var(--darkmode-bg-secondary)'
                  }}
                >
                  <div>
                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
                      {/* @ts-ignore */}
                      {instituicao.sigla} - {instituicao.nome}
                    </h4>
                    <p style={{ margin: '5px 0 0 0', color: 'var(--darkmode-text-secondary)', fontSize: '14px' }}>
                      {/* @ts-ignore */}
                      {instituicao.cidade}, {instituicao.estado} • {instituicao.tipo}
                    </p>
                  </div>
                  <div style={{ fontSize: '18px', color: 'var(--darkmode-text-secondary)' }}>
                    {instituicaoExpandida === instituicao._id ? '−' : '+'}
                  </div>
                </div>
                
                {/* @ts-ignore */}
                {instituicaoExpandida === instituicao._id && instituicao.cargos && instituicao.cargos.length > 0 && (
                  <div className="cargos-list" style={{ padding: '15px 20px' }}>
                    <h5 style={{ margin: '0 0 15px 0', fontSize: '14px', color: 'var(--darkmode-text-primary)', fontWeight: '600' }}>
                      Editais disponíveis:
                    </h5>
                    <div className="cargos-grid" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* @ts-ignore */}
                      {instituicao.cargos.map((cargo, index) => {
                        const selecionado = isCargoSelecionado(instituicao, cargo);
                        return (
                          <div
                            key={index}
                            className="cargo-item"
                            onClick={() => handleCargoClick(instituicao, cargo)}
                            style={{
                              padding: '10px 15px',
                              border: selecionado ? '2px solid var(--orange-primary)' : '1px solid var(--darkmode-border-secondary)',
                              borderRadius: '20px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              backgroundColor: selecionado ? 'var(--darkmode-bg-elevation-1)' : 'var(--darkmode-bg-tertiary)',
                              fontSize: '13px',
                              fontWeight: selecionado ? '600' : '400',
                              color: selecionado ? 'var(--orange-primary)' : 'var(--darkmode-text-primary)',
                              textAlign: 'center'
                            }}
                            onMouseEnter={(e) => {
                              if (!selecionado) {
                                // @ts-ignore
                                e.target.style.backgroundColor = 'var(--darkmode-bg-elevation-1)';
                                // @ts-ignore
                                e.target.style.borderColor = 'var(--darkmode-border-tertiary)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!selecionado) {
                                // @ts-ignore
                                e.target.style.backgroundColor = 'var(--darkmode-bg-tertiary)';
                                // @ts-ignore
                                e.target.style.borderColor = 'var(--darkmode-border-secondary)';
                              }
                            }}
                          >
                            {cargo}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* @ts-ignore */}
                {instituicaoExpandida === instituicao._id && (!instituicao.cargos || instituicao.cargos.length === 0) && (
                  <div style={{ padding: '15px 20px', color: 'var(--darkmode-text-secondary)', fontStyle: 'italic', fontSize: '14px' }}>
                    Nenhum edital cadastrado para esta instituição.
                  </div>
                )}
              </div>
            ))}
          </div>

          {getInstituicoesFiltradas().length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--darkmode-text-secondary)' }}>
              <p>
                {instituicoes.length === 0 
                  ? 'Nenhuma instituição cadastrada ainda.' 
                  : 'Nenhuma instituição encontrada com os filtros aplicados.'
                }
              </p>
            </div>
          )}
        </section>
        
        <aside style={{ flex: 1, marginLeft: '20px' }}>
          <div style={{ 
            backgroundColor: 'var(--darkmode-bg-secondary)', 
            borderRadius: '8px',
            border: '1px solid var(--darkmode-border-secondary)'
          }}>
            {cargosSelecionados.length > 0 ? (
              <div>
                {/* Agrupar cargos por instituição */}
                {(() => {
                  // @ts-ignore
                  const cargosAgrupados = cargosSelecionados.reduce((acc, item) => {
                    // @ts-ignore
                    const siglaInstituicao = item.instituicao.sigla;
                    if (!acc[siglaInstituicao]) {
                      acc[siglaInstituicao] = {
                        // @ts-ignore
                        instituicao: item.instituicao,
                        cargos: []
                      };
                    }
                    // @ts-ignore
                    acc[siglaInstituicao].cargos.push(item);
                    return acc;
                  }, {});

                  return Object.values(cargosAgrupados).map((grupo) => (
                    <div
                      // @ts-ignore
                      key={grupo.instituicao.sigla}
                      style={{
                        marginBottom: '15px',
                        padding: '20px',
                        backgroundColor: 'var(--darkmode-bg-secondary)',
                        borderRadius: '8px',
                        border: '1px solid var(--darkmode-border-secondary)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        position: 'relative'
                      }}
                    >
                      {/* Header com logo e nome da instituição */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: '12px',
                        paddingBottom: '12px',
                        borderBottom: '1px solid var(--darkmode-border-secondary)'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          backgroundColor: 'var(--darkmode-bg-tertiary)',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '12px',
                          border: '1px solid var(--darkmode-border-secondary)'
                        }}>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--darkmode-text-secondary)' }}>
                            {/* @ts-ignore */}
                            {grupo.instituicao.sigla}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 style={{ 
                            margin: 0, 
                            fontSize: '16px', 
                            fontWeight: '600',
                            color: 'var(--darkmode-text-primary)'
                          }}>
                            {/* @ts-ignore */}
                            {grupo.instituicao.nome}
                          </h4>
                          <div style={{
                            fontSize: '12px',
                            color: 'var(--darkmode-text-secondary)',
                            marginTop: '4px'
                          }}>
                            {/* @ts-ignore */}
                            {grupo.cargos.length} cargo{grupo.cargos.length > 1 ? 's' : ''} selecionado{grupo.cargos.length > 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      
                      {/* Lista de cargos da instituição */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* @ts-ignore */}
                        {grupo.cargos.map((item) => (
                          <div
                            // @ts-ignore
                            key={item.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 12px',
                              backgroundColor: 'var(--darkmode-bg-tertiary)',
                              borderRadius: '4px',
                              fontSize: '14px',
                              fontWeight: '500',
                              color: 'var(--darkmode-text-primary)',
                              border: '1px solid var(--darkmode-border-secondary)'
                            }}
                          >
                            <span>
                              {/* @ts-ignore */}
                              {item.cargo}
                              {editaisStats[item.cargo] && (
                                <span style={{ 
                                  color: 'var(--darkmode-text-secondary)', 
                                  fontSize: '12px', 
                                  marginLeft: '8px',
                                  fontWeight: 'normal'
                                }}>
                                  ({editaisStats[item.cargo].disciplinas} disciplinas / {editaisStats[item.cargo].topicos} tópicos)
                                </span>
                              )}
                            </span>
                            <button
                              onClick={() => removerCargo(
                                // @ts-ignore
                                item.id
                              )}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--darkmode-button-danger)',
                                cursor: 'pointer',
                                fontSize: '16px',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%'
                              }}
                              onMouseEnter={(e) => {
                                // @ts-ignore
                                e.target.style.backgroundColor = 'var(--darkmode-bg-tertiary)';
                              }}
                              onMouseLeave={(e) => {
                                // @ts-ignore
                                e.target.style.backgroundColor = 'transparent';
                              }}
                              title="Remover cargo"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ));
                })()}
                
                {/* Botão Criar Plano */}
                <div style={{ padding: '0 20px 20px' }}>
                  <button
                    onClick={criarPlano}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: 'var(--orange-primary)',
                      color: 'var(--darkmode-text-primary)',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      // @ts-ignore
                      e.target.style.backgroundColor = 'var(--orange-primary-hover)';
                    }}
                    onMouseLeave={(e) => {
                      // @ts-ignore
                      e.target.style.backgroundColor = 'var(--orange-primary)';
                    }}
                  >
                    Criar Plano com {cargosSelecionados.length} Edita{cargosSelecionados.length > 1 ? 'is' : 'l'}
                  </button>
                  
                  {/* Resumo de totais */}
                  {cargosSelecionados.length > 0 && (() => {
                    const { totalDisciplinas, totalTopicos } = calcularTotais();
                    return (
                      <div style={{
                        marginTop: '12px',
                        padding: '10px',
                        backgroundColor: 'var(--darkmode-bg-tertiary)',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: 'var(--darkmode-text-secondary)',
                        textAlign: 'center',
                        border: '1px solid var(--darkmode-border-secondary)'
                      }}>
                        <strong style={{ color: 'var(--darkmode-text-primary)' }}>Total: {totalDisciplinas} disciplina{totalDisciplinas !== 1 ? 's' : ''} • {totalTopicos} tópico{totalTopicos !== 1 ? 's' : ''}</strong>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div style={{ 
                textAlign: 'center', 
                color: 'var(--darkmode-text-secondary)', 
                padding: '40px 20px',
                backgroundColor: 'var(--darkmode-bg-tertiary)',
                borderRadius: '8px',
                border: '1px solid var(--darkmode-border-secondary)'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>
                  📋
                </div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: 'var(--darkmode-text-primary)' }}>
                  Nenhum cargo selecionado
                </h4>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4', color: 'var(--darkmode-text-secondary)' }}>
                  Selecione os editais das instituições para criar seu plano de estudos personalizado.
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export default Novo;
