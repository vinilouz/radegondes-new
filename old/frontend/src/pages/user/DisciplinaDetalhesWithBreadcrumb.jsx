import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import MainLayout from '../../components/MainLayout';
import DisciplinaDetalhes from './DisciplinaDetalhes';

function DisciplinaDetalhesWithBreadcrumb() {
  const { planoId, disciplinaId } = useParams();
  const { user, authenticatedFetch } = useAuth();
  const [plano, setPlano] = useState();
  const [disciplina, setDisciplina] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlanoInfo = async () => {
      try {
        setLoading(true);
        const response = await authenticatedFetch(`${API_BASE_URL}/api/planos/${planoId}`);
        
        if (response && response.ok) {
          const planoData = await response.json();
          console.log('Dados do plano para breadcrumb:', planoData);
          setPlano(planoData);
          
          // Encontrar a disciplina específica
          const disciplinaEncontrada = planoData.disciplinasDetalhadas?.find(d => d._id === disciplinaId);
          console.log('Disciplina encontrada:', disciplinaEncontrada);
          setDisciplina(disciplinaEncontrada);
        }
      } catch (error) {
        console.error('Erro ao buscar informações do plano:', error);
      } finally {
        setLoading(false);
      }
    };

    if (planoId && disciplinaId && authenticatedFetch) {
      fetchPlanoInfo();
    }
  }, [planoId, disciplinaId, authenticatedFetch]);

  const breadcrumbItems = [
    { label: 'Estudos', path: '/planos' },
    { 
      label: (plano && plano.nome) ? plano.nome : (loading ? 'Carregando...' : 'Plano'), 
      path: `/planos/${planoId}` 
    },
    { 
      label: (disciplina && disciplina.nome) ? disciplina.nome : (loading ? 'Carregando...' : 'Disciplina')
    }
  ];

  return (
    <MainLayout breadcrumbItems={breadcrumbItems}>
      <DisciplinaDetalhes />
    </MainLayout>
  );
}

export default DisciplinaDetalhesWithBreadcrumb;
