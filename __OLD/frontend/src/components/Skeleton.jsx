import React from 'react';

const Skeleton = ({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '4px',
  variant = 'default',
  count = 1,
  className = '' 
}) => {
  const skeletons = Array(count).fill(0);
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'card':
        return {
          width: '100%',
          height: '120px',
          borderRadius: '8px'
        };
      case 'avatar':
        return {
          width: '40px',
          height: '40px',
          borderRadius: '50%'
        };
      case 'text':
        return {
          width: width,
          height: '16px',
          borderRadius: '4px'
        };
      case 'title':
        return {
          width: width,
          height: '24px',
          borderRadius: '4px'
        };
      case 'button':
        return {
          width: width,
          height: '36px',
          borderRadius: '6px'
        };
      case 'stat-card':
        return {
          width: '100%',
          height: '80px',
          borderRadius: '8px'
        };
      case 'list-item':
        return {
          width: '100%',
          height: '60px',
          borderRadius: '6px'
        };
      default:
        return {
          width: width,
          height: height,
          borderRadius: borderRadius
        };
    }
  };

  return (
    <>
      <style>
        {`
          .skeleton {
            background: linear-gradient(90deg, var(--darkmode-bg-secondary) 25%, var(--darkmode-bg-tertiary) 50%, var(--darkmode-bg-secondary) 75%);
            background-size: 200% 100%;
            animation: skeleton-loading 1.5s infinite;
            display: inline-block;
            margin-bottom: ${variant === 'text' || variant === 'title' ? '8px' : '0'};
          }
          
          @keyframes skeleton-loading {
            0% {
              background-position: 200% 0;
            }
            100% {
              background-position: -200% 0;
            }
          }
          
          .skeleton-container {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          
          .skeleton-card {
            background: var(--darkmode-bg-secondary);
            border: 1px solid var(--darkmode-border-secondary);
            border-radius: 12px;
            padding: 20px;
          }
          
          .skeleton-stat-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
          }
          
          .skeleton-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
        `}
      </style>
      
      {count === 1 ? (
        <div 
          className={`skeleton ${className}`}
          style={getVariantStyles()}
        />
      ) : (
        <div className="skeleton-container">
          {skeletons.map((_, index) => (
            <div 
              key={index}
              className={`skeleton ${className}`}
              style={getVariantStyles()}
            />
          ))}
        </div>
      )}
    </>
  );
};

// Componente específico para loading de cards de estatísticas
export const SkeletonStats = ({ count = 4 }) => (
  <>
    <style>
      {`
        .skeleton-stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 20px 0;
        }
      `}
    </style>
    <div className="skeleton-stats-grid">
      {Array(count).fill(0).map((_, index) => (
        <Skeleton key={index} variant="stat-card" />
      ))}
    </div>
  </>
);

// Componente específico para loading de listas
export const SkeletonList = ({ count = 3 }) => (
  <div className="skeleton-list">
    {Array(count).fill(0).map((_, index) => (
      <Skeleton key={index} variant="list-item" />
    ))}
  </div>
);

// Componente específico para loading de cards
export const SkeletonCards = ({ count = 3 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
    {Array(count).fill(0).map((_, index) => (
      <div key={index} className="skeleton-card">
        <Skeleton variant="title" width="70%" />
        <Skeleton variant="text" width="50%" />
        <div style={{ marginTop: '12px' }}>
          <Skeleton variant="text" width="90%" />
          <Skeleton variant="text" width="60%" />
        </div>
      </div>
    ))}
  </div>
);

// Componente específico para loading de página de disciplina
export const SkeletonDisciplina = () => (
  <div>
    <div style={{ marginBottom: '20px' }}>
      <Skeleton variant="title" width="40%" />
      <Skeleton variant="text" width="60%" />
    </div>
    <SkeletonStats count={4} />
    <div style={{ marginTop: '30px' }}>
      <Skeleton variant="title" width="30%" />
      <SkeletonList count={5} />
    </div>
  </div>
);

export default Skeleton;
