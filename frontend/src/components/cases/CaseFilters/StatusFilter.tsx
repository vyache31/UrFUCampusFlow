import { useEffect, useRef, useState } from 'react';
import { SelectorArrowIcon } from '../../common/Icons/Icons';
import './caseFilters.css';

interface StatusFilterProps {
  currentStatus: string;
  onStatusChange: (status: string) => void;
}

const STATUSES = [
  { value: 'Все кейсы', label: 'Все кейсы' },
  { value: 'Черновик', label: 'Черновик' },
  { value: 'На оценке', label: 'На оценке' },
  { value: 'Активный', label: 'Активные кейсы' },
  { value: 'На доработке', label: 'На доработке' },
  { value: 'Архивирован', label: 'В архиве' },
] as const;

const DEFAULT_STATUS = 'Все кейсы';

const StatusFilter = ({ currentStatus, onStatusChange }: StatusFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const currentLabel =
    STATUSES.find(s => s.value === currentStatus)?.label ?? DEFAULT_STATUS;

  return (
    <div className={`status-dropdown ${isOpen ? 'open' : ''}`} ref={dropdownRef}>
      <button className="status-selector" onClick={() => setIsOpen(v => !v)}>
        {currentLabel}
        <SelectorArrowIcon />
      </button>

      {isOpen && (
        <div className="status-menu">
          {STATUSES.map(status => (
            <div
              key={status.value}
              className="status-item"
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

export default StatusFilter;