import { useEffect, useRef, useState } from 'react';
import { SelectorArrowIcon, CheckIcon } from '../../common/Icons/Icons';
import './caseFilters.css';

interface SemesterFilterProps {
  selectedSemesters: string[];
  onSemesterChange: (semesters: string[]) => void;
  availableSemesters: string[];
}

const SemesterFilter = ({
  selectedSemesters,
  onSemesterChange,
  availableSemesters,
}: SemesterFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(selectedSemesters);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!dropdownRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setDraft(selectedSemesters);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [selectedSemesters]);

  const toggle = (semester: string) =>
    setDraft(prev =>
      prev.includes(semester) ? prev.filter(s => s !== semester) : [...prev, semester],
    );

  const apply = () => {
    onSemesterChange(draft);
    setIsOpen(false);
  };

  const reset = () => setDraft([]);

  const displayText = (() => {
    if (selectedSemesters.length === 0) return 'Все семестры';
    if (selectedSemesters.length === 1) return selectedSemesters[0];
    return `Выбрано (${selectedSemesters.length})`;
  })();

  if (availableSemesters.length === 0) return null;

  return (
    <div className={`semester-dropdown ${isOpen ? 'open' : ''}`} ref={dropdownRef}>
      <button className="semester-selector" onClick={() => setIsOpen(v => !v)}>
        {displayText}
        <SelectorArrowIcon />
      </button>

      {isOpen && (
        <div className="semester-menu">
          {availableSemesters.map(semester => (
            <div
              key={semester}
              className={`semester-item ${draft.includes(semester) ? 'selected' : ''}`}
              onClick={() => toggle(semester)}
            >
              <span>{semester}</span>
              <div className="custom-checkbox">
                <CheckIcon />
              </div>
            </div>
          ))}

          <div className="semester-menu-buttons">
            <button className="semester-reset" onClick={reset}>Сбросить</button>
            <button className="semester-apply" onClick={apply}>Применить</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SemesterFilter;