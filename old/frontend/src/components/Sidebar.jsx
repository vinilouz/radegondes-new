import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

function Sidebar({ onOpenPerfil }) {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const userMenu = [
    { to: "/planos", label: "Cadastrar Disciplinas" },
    // { to: "/disciplinas", label: "Disciplinas" },
    { to: "/revisoes", label: "Revisões" },
    { to: "/historico", label: "Histórico" },
    { to: "/estatisticas", label: "Estatísticas" }
  ];
  
  const adminMenu = [
    { to: "/admin/usuarios", label: "Usuários" },
    { to: "/admin/categorias", label: "Categorias" },
    { to: "/admin/instituicoes", label: "Instituições" },
    { to: "/admin/disciplinas", label: "Disciplinas" }
  ];
  
  const menuItems = user?.role === 'admin' ? adminMenu : userMenu;
  
  const isActiveItem = (itemPath) => {
    const currentPath = location.pathname;
    
    if (itemPath === currentPath) {
      return true;
    }
    
    if (itemPath !== '/' && currentPath.startsWith(itemPath)) {
      const moreSpecificRoutes = menuItems.some(item => 
        item.to !== itemPath && 
        item.to.startsWith(itemPath) && 
        currentPath.startsWith(item.to)
      );
      
      return !moreSpecificRoutes;
    }
    
    return false;
  };
  
  const homeLink = user?.role === 'admin' ? '/admin' : '/planos';

  return (
    <aside className='flex align-center justify-between sidebar' style={{ position: 'relative' }}>
      <header className='flex items-center gap-2 sm:gap-3 lg:gap-4'>
        <span className="logo">
          <img
            src="/logo.png"
            className="h-8 w-auto sm:h-10 lg:h-12"
            alt="Logo"
          />
        </span>
        <h1 className="text-sm sm:text-base lg:text-lg font-medium">
          <Link to={homeLink} className="hover:opacity-80 transition-opacity">
            <span className="block sm:inline">Resumos | Concursos</span>
            <small className="block sm:inline sm:ml-1 text-xs opacity-70">@Radegondes</small>
          </Link>
        </h1>
      </header>

      <button
        className="mobile-menu-toggle"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle menu"
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          padding: '12px',
          cursor: 'pointer',
          borderRadius: '8px',
          transition: 'all 0.3s ease',
          color: 'var(--darkmode-text-primary)',
          position: 'relative',
          width: '48px',
          height: '48px'
        }}
      >
        <div className="hamburger-lines" style={{
          position: 'relative',
          width: '24px',
          height: '18px',
          margin: 'auto'
        }}>
          <span className="line line1" style={{
            position: 'absolute',
            height: '2px',
            width: '100%',
            backgroundColor: 'currentColor',
            borderRadius: '2px',
            transition: 'all 0.3s ease',
            top: '0',
            transform: isMenuOpen ? 'rotate(45deg) translate(6px, 6px)' : 'rotate(0)',
            transformOrigin: 'center'
          }}></span>
          <span className="line line2" style={{
            position: 'absolute',
            height: '2px',
            width: '100%',
            backgroundColor: 'currentColor',
            borderRadius: '2px',
            transition: 'all 0.3s ease',
            top: '8px',
            opacity: isMenuOpen ? '0' : '1',
            transform: isMenuOpen ? 'translateX(20px)' : 'translateX(0)'
          }}></span>
          <span className="line line3" style={{
            position: 'absolute',
            height: '2px',
            width: '100%',
            backgroundColor: 'currentColor',
            borderRadius: '2px',
            transition: 'all 0.3s ease',
            top: '16px',
            transform: isMenuOpen ? 'rotate(-45deg) translate(6px, -6px)' : 'rotate(0)',
            transformOrigin: 'center'
          }}></span>
        </div>
      </button>

      <nav className="desktop-nav">
        <ul className='flex align-center'>
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                to={item.to}
                className={isActiveItem(item.to) ? 'active' : ''}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div
        className="mobile-overlay"
        onClick={() => setIsMenuOpen(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 40,
          opacity: isMenuOpen ? 1 : 0,
          visibility: isMenuOpen ? 'visible' : 'hidden',
          transition: 'all 0.3s ease'
        }}
      />

      <nav
        className="mobile-nav"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '280px',
          height: '100vh',
          backgroundColor: 'var(--darkmode-bg-primary)',
          boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.3)',
          zIndex: 50,
          transform: isMenuOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          paddingTop: '80px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--darkmode-bg-elevation-2)',
          marginBottom: '8px'
        }}>
          <h3 style={{
            color: 'var(--darkmode-text-primary)',
            fontSize: '18px',
            fontWeight: '600',
            margin: 0
          }}>Navegação</h3>
        </div>

        <ul style={{
          display: 'flex',
          flexDirection: 'column',
          padding: '0 16px',
          gap: '4px'
        }}>
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                to={item.to}
                className={isActiveItem(item.to) ? 'active' : ''}
                onClick={() => setIsMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  color: isActiveItem(item.to) ? 'var(--orange-primary)' : 'var(--darkmode-text-primary)',
                  backgroundColor: isActiveItem(item.to) ? 'rgba(230, 105, 18, 0.1)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  fontSize: '16px',
                  fontWeight: isActiveItem(item.to) ? '600' : '500',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!isActiveItem(item.to)) {
                    e.target.style.backgroundColor = 'var(--darkmode-bg-elevation-1)';
                    e.target.style.transform = 'translateX(4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActiveItem(item.to)) {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.transform = 'translateX(0)';
                  }
                }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  backgroundColor: isActiveItem(item.to) ? 'var(--orange-primary)' : 'var(--darkmode-bg-elevation-2)',
                  marginRight: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  color: isActiveItem(item.to) ? 'white' : 'var(--darkmode-text-secondary)'
                }}>
                  {item.label.charAt(0)}
                </div>
                {item.label}
                {isActiveItem(item.to) && (
                  <div style={{
                    position: 'absolute',
                    right: '16px',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--orange-primary)'
                  }} />
                )}
              </Link>
            </li>
          ))}
        </ul>

        <div style={{
          marginTop: 'auto',
          padding: '24px',
          borderTop: '1px solid var(--darkmode-bg-elevation-2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            backgroundColor: 'var(--darkmode-bg-elevation-1)',
            borderRadius: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'var(--orange-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              marginRight: '12px'
            }}>
              {user?.nome ? user.nome.slice(0,2).toUpperCase() : ''}
            </div>
            <div>
              <div style={{
                color: 'var(--darkmode-text-primary)',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {user?.nome}
              </div>
              <div style={{
                color: 'var(--darkmode-text-secondary)',
                fontSize: '12px'
              }}>
                {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="user">
        <span className="flex flex-col op1 user-greeting">
          <small>Olá, {user?.nome}</small>
        </span>
        <span className='op2'>
          {user?.avatar ? (
            <img
              src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`}
              alt="Avatar"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '100%'
              }}
            />
          ) : (
            user?.nome ? user.nome.slice(0,2).toUpperCase() : ''
          )}
        </span>
        <i className="fa-light fa-angle-down user-arrow"></i>
        <nav className="user-menu">
          <ul>
            <li><a href="#" onClick={(e) => { e.preventDefault(); onOpenPerfil(); }}>Meu Perfil</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>Sair</a></li>
          </ul>
        </nav>
      </div>

      <style jsx>{`
        @media (max-width: 1024px) {
          .mobile-menu-toggle {
            display: block !important;
          }

          .mobile-menu-toggle:hover {
            background-color: var(--darkmode-bg-elevation-1) !important;
          }

          .desktop-nav {
            display: none;
          }

          .user-greeting {
            display: none;
          }

          .user-arrow {
            display: none;
          }
        }

        @media (min-width: 1025px) {
          .mobile-overlay,
          .mobile-nav {
            display: none !important;
          }
        }

        .mobile-menu-toggle:active {
          transform: scale(0.95);
        }
      `}</style>
    </aside>
  );
}

export default Sidebar;
