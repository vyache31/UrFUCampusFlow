import { useState, useRef, useEffect } from 'react';
import './sentCases.css';

interface ActionsDropdownProps {
  onSendToRevision: () => void;
  onActivate: () => void;
}

const ActionsDropdown = ({ onSendToRevision, onActivate }: ActionsDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div 
      className={`actions-dropdown ${isOpen ? 'open' : ''}`} 
      ref={dropdownRef}
    >
      <button 
        className="actions-selector" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="actions-text">Действия</span>
        <svg className="actions-arrow" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path 
            d="M6 9L12 15L18 9" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="actions-menu">
          <button className="actions-item" onClick={() => { onSendToRevision(); setIsOpen(false); }}>
            На доработку
          </button>
          <button className="actions-item" onClick={() => { onActivate(); setIsOpen(false); }}>
            Активировать
          </button>
        </div>
      )}
    </div>
  );
};

export default ActionsDropdown;