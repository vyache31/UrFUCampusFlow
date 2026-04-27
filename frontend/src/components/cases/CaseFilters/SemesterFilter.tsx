import { useState, useRef, useEffect } from 'react';
import { SelectorArrowIcon, CheckIcon } from '../../common/Icons/Icons';
import './caseFilters.css';

interface SemesterFilterProps {
  selectedSemesters: string[];
  onSemesterChange: (semesters: string[]) => void;
  availableSemesters: string[];
}

const SemesterFilter = ({ selectedSemesters, onSemesterChange, availableSemesters }: SemesterFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState<string[]>(selectedSemesters);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setTempSelected(selectedSemesters);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [selectedSemesters]);

  const toggleSemester = (semester: string) => {
    setTempSelected(prev =>
      prev.includes(semester) ? prev.filter(s => s !== semester) : [...prev, semester]
    );
  };

  const reset = () => setTempSelected([]);
  
  const apply = () => {
    onSemesterChange(tempSelected);
    setIsOpen(false);
  };

  const getDisplayText = () => {
    if (selectedSemesters.length === 0) return 'Все семестры';
    if (selectedSemesters.length === 1) return selectedSemesters[0];
    return `Выбрано (${selectedSemesters.length})`;
  };

  if (availableSemesters.length === 0) return null;

  return (
    <div 
      className={`semester-dropdown ${isOpen ? 'open' : ''}`} 
      ref={dropdownRef}
    >
      <button 
        className="semester-selector" 
        onClick={() => setIsOpen(!isOpen)}
      >
        {getDisplayText()}
        <SelectorArrowIcon />
      </button>
      {isOpen && (
        <div className="semester-menu">
          {availableSemesters.map((semester) => (
            <div
              key={semester}
              className={`semester-item ${tempSelected.includes(semester) ? 'selected' : ''}`}
              onClick={() => toggleSemester(semester)}
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