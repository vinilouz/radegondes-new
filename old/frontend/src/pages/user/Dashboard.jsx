import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    console.log('🔍 DEBUG Dashboard - Usuário:', user);
    if (user) {
      console.log('🔍 DEBUG Dashboard - Role do usuário:', user.role);
      if (user.role === 'admin') {
        console.log('🔍 DEBUG Dashboard - Redirecionando admin para /admin');
        navigate('/admin', { replace: true });
      } else {
        console.log('🔍 DEBUG Dashboard - Redirecionando usuário normal para /planos');
        navigate('/planos', { replace: true });
      }
    } else {
      console.log('🔍 DEBUG Dashboard - Usuário ainda não carregado');
    }
  }, [navigate, user]);

  return null;
}

export default Dashboard;
