import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import MainLayout from '../../components/MainLayout';
import PlanoDetalhes from './PlanoDetalhes';

function PlanoDetalhesWithBreadcrumb() {
  const { id } = useParams();
  const { token } = useAuth();
  const [plano, setPlano] = useState();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlanoInfo = async () => {
      try {
        setLoading(true);
        const timestamp = new Date().getTime();
        const response = await fetch(`${API_BASE_URL}/api/planos/${id}?_t=${timestamp}`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        if (response.ok) {
          const planoData = await response.json();
          console.log('Dados do plano para breadcrumb:', planoData);
          setPlano(planoData);
        }
      } catch (error) {
        console.error('Erro ao buscar informações do plano:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id && token) {
      fetchPlanoInfo();
    }
  }, [id, token]);

  const breadcrumbItems = [
    { label: 'Estudos', path: '/planos' },
    { 
      label: (plano && plano.nome) ? plano.nome : (loading ? 'Carregando...' : 'Plano')
    }
  ];

  return (
    <MainLayout breadcrumbItems={breadcrumbItems}>
      <PlanoDetalhes />
    </MainLayout>
  );
}

export default PlanoDetalhesWithBreadcrumb;
