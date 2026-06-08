import { useState, useEffect, useRef, useCallback } from 'react';
import { searchStudents, type Student } from '../../services/students';
import './StudentSearchInput.css';

interface StudentSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelectStudent: (student: Student) => void;
  placeholder?: string;
  disabled?: boolean;
}

const getShortId = (id: string): string => {
  return id.slice(-4);
};

const StudentSearchInput = ({ 
  value, 
  onChange, 
  onSelectStudent, 
  placeholder = "Введите ФИО",
  disabled = false 
}: StudentSearchInputProps) => {
  const [suggestions, setSuggestions] = useState<Student[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length >= 2) {
      setIsSearching(true);
      const results = await searchStudents(query);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setIsSearching(false);
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.trim().length >= 2) {
      debounceTimerRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions([]);
      setShowSuggestions(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value, performSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStudent = (student: Student) => {
    onChange(student.name);
    onSelectStudent(student);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  return (
    <div className="student-search-wrapper" ref={wrapperRef}>
      <input
        ref={inputRef}
        type="text"
        className="modal-input student-search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        onBlur={handleBlur}
        disabled={disabled}
      />
      {isSearching && (
        <div className="student-search-loading">поиск...</div>
      )}
      {showSuggestions && suggestions.length > 0 && (
        <div className="student-suggestions">
          {suggestions.map((student) => (
            <div
              key={student.id}
              className="student-suggestion-item"
              onClick={() => handleSelectStudent(student)}
            >
              <span className="student-name">{student.name}</span>
              <span className="student-id">#{getShortId(student.id)}</span>
            </div>
          ))}
        </div>
      )}
      {showSuggestions && value.trim().length >= 2 && suggestions.length === 0 && !isSearching && (
        <div className="student-suggestions empty">
          <div className="student-suggestion-item">Студент не найден</div>
        </div>
      )}
    </div>
  );
};

export default StudentSearchInput;