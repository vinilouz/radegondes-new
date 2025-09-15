import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Breadcrumb = ({ customItems = [] }) => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  // Mapeamento de rotas para nomes amigáveis
  const routeNames = {
    'dashboard': 'Dashboard',
    'planos': 'Estudos',
    'disciplinas': 'Disciplinas',
    'revisoes': 'Revisões',
    'historico': 'Histórico',
    'estatisticas': 'Estatísticas',
    'simulados': 'Simulados',
    'planejamentos': 'Planejamentos',
    'admin': 'Administração',
    'categorias': 'Categorias',
    'editais': 'Editais',
    'instituicoes': 'Instituições',
    'cargos': 'Cargos',
    'gerenciar-usuarios': 'Gerenciar Usuários',
    'admin-dashboard': 'Dashboard Admin',
    'novo': 'Novo',
    'editar': 'Editar'
  };

  // Se existem items customizados, usar eles em vez do pathname
  if (customItems.length > 0) {
    return (
      <nav className="breadcrumb-nav">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/dashboard" className="breadcrumb-link">
              <i className="fas fa-home"></i>
              <span>Início</span>
            </Link>
          </li>
          {customItems.map((item, index) => (
            <li key={index} className={`breadcrumb-item ${index === customItems.length - 1 ? 'active' : ''}`}>
              <i className="fas fa-chevron-right breadcrumb-separator"></i>
              {item.path && index < customItems.length - 1 ? (
                <Link to={item.path} className="breadcrumb-link">
                  {item.icon && <i className={item.icon}></i>}
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span className="breadcrumb-current">
                  {item.icon && <i className={item.icon}></i>}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  }

  // Gerar breadcrumb automaticamente baseado na URL
  const breadcrumbItems = [];
  
  // Sempre incluir o home
  breadcrumbItems.push({
    path: '/dashboard',
    label: 'Início',
    icon: 'fas fa-home'
  });

  // Construir items baseado no pathname
  let currentPath = '';
  pathnames.forEach((name, index) => {
    currentPath += `/${name}`;
    const isLast = index === pathnames.length - 1;
    
    // Pular IDs numéricos no breadcrumb
    if (/^[0-9a-fA-F]{24}$/.test(name)) {
      return;
    }

    breadcrumbItems.push({
      path: isLast ? null : currentPath,
      label: routeNames[name] || name.charAt(0).toUpperCase() + name.slice(1),
      icon: getIconForRoute(name)
    });
  });

  return (
    <nav className="breadcrumb-nav">
      <ol className="breadcrumb">
        {breadcrumbItems.map((item, index) => (
          <li key={index} className={`breadcrumb-item ${index === breadcrumbItems.length - 1 ? 'active' : ''}`}>
            {index > 0 && <i className="fas fa-chevron-right breadcrumb-separator"></i>}
            {item.path ? (
              <Link to={item.path} className="breadcrumb-link">
                {item.icon && <i className={item.icon}></i>}
                <span>{item.label}</span>
              </Link>
            ) : (
              <span className="breadcrumb-current">
                {item.icon && <i className={item.icon}></i>}
                <span>{item.label}</span>
              </span>
            )}
          </li>
        ))}
      </ol>
      
      <style>{`
        .breadcrumb-nav {
          margin-bottom: 24px;
          padding: 0;
        }

        .breadcrumb {
          display: flex;
          align-items: center;
          list-style: none;
          margin: 0;
          padding: 12px 0;
          background: transparent;
          border-radius: 8px;
          flex-wrap: wrap;
          gap: 4px;
        }

        .breadcrumb-item {
          display: flex;
          align-items: center;
          font-size: 14px;
        }

        .breadcrumb-separator {
          margin: 0 8px;
          color: var(--darkmode-text-tertiary);
          font-size: 10px;
        }

        .breadcrumb-link {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--darkmode-text-secondary);
          text-decoration: none;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s ease;
          font-weight: 500;
        }

        .breadcrumb-link:hover {
          color: var(--orange-primary);
          background: var(--darkmode-bg-tertiary);
        }

        .breadcrumb-current {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--darkmode-text-primary);
          font-weight: 600;
          padding: 4px 8px;
        }

        .breadcrumb-item i {
          font-size: 12px;
        }

        .breadcrumb-item.active .breadcrumb-current {
          color: var(--orange-primary);
        }

        @media (max-width: 768px) {
          .breadcrumb {
            padding: 8px 0;
          }
          
          .breadcrumb-item span {
            display: none;
          }
          
          .breadcrumb-item:last-child span {
            display: inline;
          }
          
          .breadcrumb-separator {
            margin: 0 4px;
          }
        }
      `}</style>
    </nav>
  );
};

// Função para retornar ícones baseado na rota
const getIconForRoute = (route) => {
  const icons = {
    'dashboard': 'fas fa-tachometer-alt',
    'planos': 'fas fa-clipboard-list',
    'disciplinas': 'fas fa-book',
    'revisoes': 'fas fa-redo-alt',
    'historico': 'fas fa-history',
    'estatisticas': 'fas fa-chart-bar',
    'simulados': 'fas fa-tasks',
    'planejamentos': 'fas fa-calendar-alt',
    'admin': 'fas fa-cog',
    'categorias': 'fas fa-tags',
    'editais': 'fas fa-file-alt',
    'instituicoes': 'fas fa-university',
    'cargos': 'fas fa-briefcase',
    'gerenciar-usuarios': 'fas fa-users',
    'admin-dashboard': 'fas fa-chart-line',
    'novo': 'fas fa-plus',
    'editar': 'fas fa-edit'
  };
  
  return icons[route] || 'fas fa-folder';
};

export default Breadcrumb;
