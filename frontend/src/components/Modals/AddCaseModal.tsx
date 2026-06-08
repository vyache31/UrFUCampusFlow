import { useState, useEffect, useCallback, useRef } from 'react';
import { CloseIcon, CheckIcon } from '../common/Icons/Icons';
import { getCases, type Case } from '../../services/cases';
import { useToast } from '../../context/ToastContext';
import './Modal.css';

interface CaseWithSemester extends Case {
  case_semesters_id: string;
  semester_name: string;
}

interface AddCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (caseSemesterId: string, caseTitle: string) => void;
  usedCaseSemesterIds?: string[];
}

const AddCaseModal = ({ isOpen, onClose, onAdd, usedCaseSemesterIds = [] }: AddCaseModalProps) => {
  const { showError } = useToast();
  const [cases, setCases] = useState<CaseWithSemester[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCaseSemesterId, setSelectedCaseSemesterId] = useState<string | null>(null);
  const hasFetched = useRef(false);
  
  const fetchCases = useCallback(async () => {
    if (!isOpen || hasFetched.current) return;
    
    try {
      setLoading(true);
      hasFetched.current = true;
      const data = await getCases(100);
      
      const availableCases = data
        .filter(c => 
          c.status_id === 3 && 
          c.case_semesters_id &&
          !usedCaseSemesterIds.includes(c.case_semesters_id)
        )
        .map(c => ({
          ...c,
          case_semesters_id: c.case_semesters_id,
          semester_name: c.semester_name || 'Семестр не указан'
        } as CaseWithSemester));
      
      setCases(availableCases);
    } catch (error) {
      console.error('Ошибка загрузки кейсов:', error);
    } finally {
      setLoading(false);
    }
  }, [isOpen, usedCaseSemesterIds]);

  useEffect(() => {
    if (isOpen) {
      hasFetched.current = false;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchCases();
    }
  }, [isOpen, fetchCases]);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSelectedCaseSemesterId(null);
      }, 0);
      hasFetched.current = false;
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectCase = (caseSemesterId: string) => {
    setSelectedCaseSemesterId(caseSemesterId);
  };

  const handleSubmit = () => {
    if (selectedCaseSemesterId) {
      const foundCase = cases.find(c => c.case_semesters_id === selectedCaseSemesterId);
      
      if (foundCase) {
        onAdd(foundCase.case_semesters_id, foundCase.title);
        setSelectedCaseSemesterId(null);
        onClose();
      } else {
        showError('Ошибка: выбранный кейс не найден');
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container case-modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-bar">
          <button className="modal-close-circle" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="cases-scroll-list">
            {loading ? (
              <div className="loading-cases">Загрузка кейсов...</div>
            ) : cases.length === 0 ? (
              <div className="empty-cases-modal">Нет доступных активных кейсов</div>
            ) : (
              cases.map((caseItem) => (
                <div
                  key={caseItem.case_semesters_id}
                  className={`case-item-modal ${selectedCaseSemesterId === caseItem.case_semesters_id ? 'selected' : ''}`}
                  onClick={() => handleSelectCase(caseItem.case_semesters_id)}
                >
                  <div className="case-checkbox-modal">
                    {selectedCaseSemesterId === caseItem.case_semesters_id && <CheckIcon />}
                  </div>
                    <span className="case-title-modal">{caseItem.short_title || caseItem.title}</span>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="modal-add-btn" 
            onClick={handleSubmit}
            disabled={!selectedCaseSemesterId || cases.length === 0}
          >
            <CheckIcon />
            <span>Добавить</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCaseModal;