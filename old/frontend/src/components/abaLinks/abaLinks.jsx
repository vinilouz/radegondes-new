import React from "react";


function AbaLinks({ links, setLinks }) {
  const adicionarLink = () => {
    setLinks([...links, { titulo: '', url: '' }]);
  };

  const removerLink = (index) => {
    const novosLinks = links.filter((_, i) => i !== index);
    setLinks(novosLinks.length > 0 ? novosLinks : [{ titulo: '', url: '' }]);
  };

  const atualizarLink = (index, campo, valor) => {
    const novosLinks = [...links];
    novosLinks[index][campo] = valor;
    setLinks(novosLinks);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h4 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'var(--darkmode-text-primary)',
          margin: 0
        }}>
          Links de Estudo
        </h4>
        <button
          onClick={adicionarLink}
          style={{
            padding: '8px 12px',
            backgroundColor: 'var(--orange-primary)',
            color: 'var(--darkmode-bg-secondary)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500'
          }}
        >
          + Adicionar Link
        </button>
      </div>

      {links.map((link, index) => (
        <div key={index} style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          padding: '15px',
          backgroundColor: 'var(--darkmode-bg-tertiary)',
          borderRadius: '6px',
          border: '1px solid var(--darkmode-border-secondary)'
        }}>
          <div style={{
            flex: '0 0 200px',
            minWidth: '200px'
          }}>
            <input
              type="text"
              placeholder="Título do link"
              value={link.titulo}
              onChange={(e) => atualizarLink(index, 'titulo', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--darkmode-border-secondary)',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          <div className="flex-1">
            <input
              type="url"
              placeholder="https://exemplo.com"
              value={link.url}
              onChange={(e) => atualizarLink(index, 'url', e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--darkmode-border-secondary)',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          {links.length > 1 && (
            <button
              onClick={() => removerLink(index)}
              style={{
                padding: '8px 10px',
                backgroundColor: 'var(--darkmode-button-danger)',
                color: 'var(--darkmode-bg-secondary)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                flexShrink: 0
              }}
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
export default AbaLinks;