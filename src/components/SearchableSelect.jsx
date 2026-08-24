import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  name,
  placeholder = "Select...",
  required = false,
  disabled = false,
  className = "form-input",
  style = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const limit = 5;
  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
        setPage(1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options based on search query
  const filteredOptions = options.filter(opt => 
    opt.label && opt.label.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredOptions.length / limit);
  const paginatedOptions = filteredOptions.slice((page - 1) * limit, page * limit);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  const handleSelect = (optValue) => {
    onChange({ target: { name, value: optValue } });
    setIsOpen(false);
    setSearchQuery('');
    setPage(1);
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    onChange({ target: { name, value: '' } });
  };

  return (
    <div className="searchable-select-container" ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Hidden input for HTML form validation */}
      <input type="hidden" name={name} value={value || ''} required={required} />
      
      <div 
        className={`${className} searchable-select-trigger ${disabled ? 'disabled' : ''}`}
        style={{ 
          ...style,
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: disabled ? '#f8fafc' : '#fff',
          minHeight: '40px'
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span style={{ color: selectedOption ? 'inherit' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          {value && !disabled && (
            <X 
              size={14} 
              style={{ color: '#94a3b8', cursor: 'pointer' }} 
              onClick={clearSelection}
            />
          )}
          <ChevronDown size={16} style={{ color: '#64748b' }} />
        </div>
      </div>

      {isOpen && (
        <div className="searchable-select-dropdown" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          backgroundColor: '#fff',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          zIndex: 50,
          overflow: 'hidden'
        }}>
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={16} style={{ color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1); // Reset page on search
              }}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                fontSize: '0.875rem'
              }}
              autoFocus
            />
          </div>

          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {paginatedOptions.length > 0 ? (
              paginatedOptions.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  style={{
                    padding: '0.5rem 1rem',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    backgroundColor: String(value) === String(opt.value) ? 'var(--primary-color)' : 'transparent',
                    color: String(value) === String(opt.value) ? '#fff' : 'inherit',
                  }}
                  onMouseEnter={(e) => {
                    if (String(value) !== String(opt.value)) e.target.style.backgroundColor = '#f1f5f9';
                  }}
                  onMouseLeave={(e) => {
                    if (String(value) !== String(opt.value)) e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
                No options found
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '0.5rem',
              borderTop: '1px solid var(--border-color)',
              backgroundColor: '#f8fafc'
            }}>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setPage(Math.max(1, page - 1)); }}
                disabled={page === 1}
                style={{
                  padding: '0.25rem 0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: page === 1 ? 0.5 : 1
                }}
              >
                <ChevronLeft size={14} />
              </button>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Page {page} of {totalPages}
              </span>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); setPage(Math.min(totalPages, page + 1)); }}
                disabled={page === totalPages}
                style={{
                  padding: '0.25rem 0.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  backgroundColor: '#fff',
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: page === totalPages ? 0.5 : 1
                }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
