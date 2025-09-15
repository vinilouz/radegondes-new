import { useState, useMemo, useEffect } from 'react';
import { SkeletonList } from './Skeleton';

function DataTable({ data, columns, onEdit, onDelete, loading, hideControls = false, editLabel = "Editar", deleteLabel = "Excluir", hideDelete = false, initialSearchTerm = '' }) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Efeito para atualizar searchTerm quando initialSearchTerm mudar
  useEffect(() => {
    if (initialSearchTerm && initialSearchTerm !== searchTerm) {
      setSearchTerm(initialSearchTerm);
      setCurrentPage(1);
    }
  }, [initialSearchTerm]);

  const filteredData = useMemo(() => {
    if (hideControls || !searchTerm) return data;
    
    return data.filter(item =>
      columns.some(column => {
        const value = item[column.key];
        
        // Busca no valor direto
        if (value && value.toString().toLowerCase().includes(searchTerm.toLowerCase())) {
          return true;
        }
        
        // Busca em propriedades aninhadas (para objetos como instituicao.nome)
        if (typeof value === 'object' && value !== null) {
          const nestedValues = Object.values(value).join(' ');
          if (nestedValues.toLowerCase().includes(searchTerm.toLowerCase())) {
            return true;
          }
        }
        
        return false;
      })
    );
  }, [data, searchTerm, columns, hideControls]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  if (loading) {
    return <SkeletonList count={6} />;
  }

  return (
    <div className="data-table">
      {!hideControls && (
        <div className="table-controls">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
          <span className="results-count">
            {filteredData.length} resultado(s) encontrado(s)
          </span>
        </div>
      )}

      <table>
        <thead>
          <tr>
            {columns.map(column => (
              <th key={column.key}>{column.label}</th>
            ))}
            {(onEdit || onDelete) && <th>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {currentData.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="no-data">
                Nenhum registro encontrado
              </td>
            </tr>
          ) : (
            currentData.map(item => (
              <tr key={item._id}>
                {columns.map(column => (
                  <td key={column.key}>
                    {column.render ? column.render(item) : item[column.key]}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="actions">
                    {onEdit && (
                      <button 
                        onClick={() => onEdit(item)}
                        className="btn-edit"
                      >
                        {editLabel}
                      </button>
                    )}
                    {onDelete && !hideDelete && (
                      <button 
                        onClick={() => onDelete(item)}
                        className="btn-delete"
                      >
                        {deleteLabel}
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="btn-page"
          >
            Anterior
          </button>
          
          <span className="page-info">
            Página {currentPage} de {totalPages}
          </span>
          
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`btn-page ${currentPage === page ? 'active' : ''}`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="btn-page"
          >
            Próxima
          </button>
        </div>
      )}
      
      <div className="table-footer">
        Mostrando {startIndex + 1} a {Math.min(endIndex, filteredData.length)} de {filteredData.length} registros
      </div>
    </div>
  );
}

export default DataTable;
