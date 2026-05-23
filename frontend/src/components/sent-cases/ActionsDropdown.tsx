import { useState, useRef, useEffect } from 'react';
import './sentCases.css';

interface ActionsDropdownProps {
  availableActions: string[];
  isMixed: boolean;
  onSendToReview: () => void;
  onApprove: () => void;
  onSendToRevision: () => void;
  onArchive: () => void;
}

const ActionsDropdown = ({ 
  availableActions, 
  isMixed, 
  onSendToReview, 
  onApprove, 
  onSendToRevision, 
  onArchive 
}: ActionsDropdownProps) => {
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

  const getActionButton = (action: string) => {
    switch (action) {
      case 'Отправить на оценку':
        return (
          <button 
            key={action}
            className="actions-item" 
            onClick={() => { onSendToReview(); setIsOpen(false); }}
          >
            Отправить на оценку
          </button>
        );
      case 'Одобрить':
        return (
          <button 
            key={action}
            className="actions-item" 
            onClick={() => { onApprove(); setIsOpen(false); }}
          >
            Одобрить
          </button>
        );
      case 'Отправить на доработку':
        return (
          <button 
            key={action}
            className="actions-item" 
            onClick={() => { onSendToRevision(); setIsOpen(false); }}
          >
            Отправить на доработку
          </button>
        );
      case 'Архивировать':
        return (
          <button 
            key={action}
            className="actions-item" 
            onClick={() => { onArchive(); setIsOpen(false); }}
          >
            Архивировать
          </button>
        );
      default:
        return null;
    }
  };

  const hasActions = availableActions.length > 0 && !isMixed && availableActions[0] !== '';
  
  // Определяем класс для меню в зависимости от количества действий
  const menuClass = hasActions 
    ? (availableActions.length === 1 ? 'single-item' : 'multiple-items')
    : '';

  return (
    <div 
      className={`actions-dropdown ${isOpen ? 'open' : ''}`} 
      ref={dropdownRef}
    >
      <button 
        className="actions-selector" 
        onClick={() => setIsOpen(!isOpen)}
        disabled={!hasActions}
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
      {isOpen && hasActions && (
        <div className={`actions-menu ${menuClass}`}>
          {availableActions.map(action => getActionButton(action))}
        </div>
      )}
      {isOpen && !hasActions && (
        <div className="actions-menu">
          <div className="actions-empty">Нет подходящих действий</div>
        </div>
      )}
    </div>
  );
};

export default ActionsDropdown;