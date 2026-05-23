import { useState, useRef, useEffect } from 'react';
import { SelectorArrowIcon } from '../../common/Icons/Icons';
import './teamFilters.css';

interface TeamStatusFilterProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
}

const statuses = [
  { value: 'Все команды', label: 'Все команды' },
  { value: 'Интервью', label: 'Интервью' },
  { value: 'Отказ', label: 'Отказ' },
  { value: 'Работает над кейсом', label: 'Работает над кейсом' },
  { value: 'Архив', label: 'Архив' },
];

const TeamStatusFilter = ({ currentStatus, onStatusChange }: TeamStatusFilterProps) => {
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

  const getCurrentLabel = () => {
    const found = statuses.find(s => s.value === currentStatus);
    return found ? found.label : 'Все команды';
  };

  return (
    <div 
      className={`team-status-dropdown ${isOpen ? 'open' : ''}`} 
      ref={dropdownRef}
    >
      <button 
        className="team-status-selector" 
        onClick={() => setIsOpen(!isOpen)}
      >
        {getCurrentLabel()}
        <SelectorArrowIcon />
      </button>
      {isOpen && (
        <div className="team-status-menu">
          {statuses.map((status) => (
            <div
              key={status.value}
              className="team-status-item"
              onClick={() => {
                onStatusChange(status.value);
                setIsOpen(false);
              }}
            >
              {status.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamStatusFilter;