import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  
  console.log('🔍 DEBUG AdminRoute - Usuário:', user);
  
  if (!user) {
    console.log('🔍 DEBUG AdminRoute - Usuário não autenticado, redirecionando para login');
    return <Navigate to="/login" replace />;
  }
  
  if (user.role !== 'admin') {
    console.log('🔍 DEBUG AdminRoute - Usuário não é admin (role:', user.role, '), redirecionando para planos');
    return <Navigate to="/planos" replace />;
  }
  
  console.log('🔍 DEBUG AdminRoute - Usuário é admin, permitindo acesso');
  return children;
};

export default AdminRoute;
