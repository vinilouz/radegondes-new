import { useState, useRef, useEffect } from 'react';

const ColorPicker = ({ value, onChange, colors, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);

  const selectedColor = colors.find(c => c.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleColorSelect = (colorValue) => {
    onChange(colorValue);
    setIsOpen(false);
  };

  return (
    <div className={`color-picker ${className}`} ref={pickerRef}>
      <div 
        className="color-picker-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div 
          className="color-circle"
          style={{ backgroundColor: selectedColor?.color || 'var(--darkmode-text-secondary)' }}
        ></div>
        <span className="color-label">{selectedColor?.label || 'Selecione uma cor'}</span>
        <span className="color-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>
      
      {isOpen && (
        <div className="color-picker-dropdown">
          {colors.map(color => (
            <div
              key={color.value}
              className={`color-option ${value === color.value ? 'selected' : ''}`}
              onClick={() => handleColorSelect(color.value)}
            >
              <div 
                className="color-circle"
                style={{ backgroundColor: color.color }}
              ></div>
              <span className="color-label">{color.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
