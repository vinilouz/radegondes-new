import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../config/api';
import { SkeletonStats } from '../../components/Skeleton';

function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalCategorias: 0,
    totalInstituicoes: 0,
    totalDisciplinas: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Dashboard Admin - Radegondes';
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Buscar estatísticas básicas
      const responses = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/admin/categorias`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/admin/instituicoes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/admin/disciplinas`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [usuarios, categorias, instituicoes, disciplinas] = await Promise.all(
        responses.map(response => response.ok ? response.json() : [])
      );

      setStats({
        totalUsuarios: usuarios.length || 0,
        totalCategorias: categorias.length || 0,
        totalInstituicoes: instituicoes.length || 0,
        totalDisciplinas: disciplinas.length || 0
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className='flex flex-col head admin-dashboard-title'>
        <h1 style={{marginBottom: '10px'}}>Dashboard</h1>
        <p>Gerencie usuários, disciplinas, editais e outras configurações do sistema</p>
      </header>

      {loading ? (
        <SkeletonStats count={4} />
      ) : (
        <>
          {/* Cards de Estatísticas */}
          <div className="admin-stats-grid">
            <Link to="/admin/usuarios" className="admin-stat-card">
              <div className="admin-stat-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
              </div>
              <div className="admin-stat-content">
                <h3>{stats.totalUsuarios}</h3>
                <p>Usuários</p>
              </div>
            </Link>
            
            <Link to="/admin/categorias" className="admin-stat-card">
              <div className="admin-stat-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
              <div className="admin-stat-content">
                <h3>{stats.totalCategorias}</h3>
                <p>Categorias</p>
              </div>
            </Link>
            
            <Link to="/admin/instituicoes" className="admin-stat-card">
              <div className="admin-stat-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10z"/>
                </svg>
              </div>
              <div className="admin-stat-content">
                <h3>{stats.totalInstituicoes}</h3>
                <p>Instituições</p>
              </div>
            </Link>
            
            <Link to="/admin/disciplinas" className="admin-stat-card">
              <div className="admin-stat-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                </svg>
              </div>
              <div className="admin-stat-content">
                <h3>{stats.totalDisciplinas}</h3>
                <p>Disciplinas</p>
              </div>
            </Link>
          </div>
        </>
      )}
    </>
  );
}

export default AdminDashboard;
