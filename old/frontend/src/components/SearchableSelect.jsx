import { useState, useRef, useEffect } from 'react';

function SearchableSelect({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Selecione uma opção...",
  displayKey = "nome",
  valueKey = "_id",
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);

  // Filtrar opções baseado no termo de busca
  const filteredOptions = options.filter(option =>
    option[displayKey]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Encontrar a opção selecionada
  const selectedOption = options.find(option => option[valueKey] === value);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOptionClick = (option) => {
    onChange(option[valueKey]);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div className="searchable-select" ref={selectRef} style={{ position: 'relative', width: '100%' }}>
      <div 
        className={`select-input ${disabled ? 'disabled' : ''}`}
        onClick={handleInputClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1
        }}
      >
        <span style={{ 
          color: selectedOption ? 'var(--darkmode-text-primary)' : 'var(--darkmode-text-secondary)',
          fontSize: '13px'
        }}>
          {selectedOption ? selectedOption[displayKey] : placeholder}
        </span>
        <span style={{ 
          fontSize: '12px', 
          color: 'var(--darkmode-text-secondary)',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>
          ▼
        </span>
      </div>

      {isOpen && !disabled && (
        <div 
          className="select-dropdown"
        >
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Buscar..."
            autoFocus
            className="searchable-select-input"
            style={{
              width: '100%',
              padding: '8px 12px 8px 35px',
              border: 'none',
              borderBottom: '1px solid #E6691230',
              outline: 'none',
              fontSize: '13px',
              backgroundColor: '#E6691215',
              color: 'var(--darkmode-text-primary)',
              backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='%23E66912' viewBox='0 0 16 16'%3e%3cpath d='M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z'/%3e%3c/svg%3e\")",
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'left 10px center',
              backgroundSize: '14px'
            }}
          />
          
          <div className="options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(option => (
                <div
                  key={option[valueKey]}
                  onClick={() => handleOptionClick(option)}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    borderBottom: '1px solid #E6691215',
                    transition: 'background-color 0.2s ease',
                    backgroundColor: option[valueKey] === value ? '#E66912' : 'transparent',
                    color: option[valueKey] === value ? 'var(--darkmode-text-primary)' : 'var(--darkmode-text-primary)'
                  }}
                  className="option-item"
                >
                  {option[displayKey]}
                </div>
              ))
            ) : (
              <div style={{
                padding: '10px 12px',
                fontSize: '13px',
                color: 'var(--darkmode-text-secondary)',
                fontStyle: 'italic'
              }}>
                Nenhuma opção encontrada
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;
