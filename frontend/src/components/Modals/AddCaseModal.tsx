import { useState, useEffect, useCallback, useRef } from 'react';
import { CloseIcon, CheckIcon } from '../common/Icons/Icons';
import { getCases, type Case } from '../../services/cases';
import './Modal.css';

interface AddCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (caseSemesterId: string, caseTitle: string) => void;
  usedCaseIds?: string[];
}

const AddCaseModal = ({ isOpen, onClose, onAdd, usedCaseIds = [] }: AddCaseModalProps) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const hasFetched = useRef(false);
  const fetchCases = useCallback(async () => {
    if (!isOpen || hasFetched.current) return;
    
    try {
      setLoading(true);
      hasFetched.current = true;
      const data = await getCases(100);
      const availableCases = data.filter(c => 
        c.status_id === 3 && !usedCaseIds.includes(c.id)
      );
      
      setCases(availableCases);
    } catch (error) {
      console.error('Ошибка загрузки кейсов:', error);
    } finally {
      setLoading(false);
    }
  }, [isOpen, usedCaseIds]);

  useEffect(() => {
    if (isOpen) {
      fetchCases();
    }
  }, [isOpen, fetchCases]);
  useEffect(() => {
    if (!isOpen) {
      setSelectedCaseId(null);
      hasFetched.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
  };

  const handleSubmit = () => {
    if (selectedCaseId) {
      const foundCase = cases.find(c => c.id === selectedCaseId);
      
      if (foundCase && foundCase.case_semesters_id) {
        onAdd(foundCase.case_semesters_id, foundCase.title);
        setSelectedCaseId(null);
        onClose();
      } else {
        alert('Ошибка: не найден ID семестра для этого кейса');
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
                  key={caseItem.id}
                  className={`case-item-modal ${selectedCaseId === caseItem.id ? 'selected' : ''}`}
                  onClick={() => handleSelectCase(caseItem.id)}
                >
                  <div className="case-checkbox-modal">
                    {selectedCaseId === caseItem.id && <CheckIcon />}
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
            disabled={!selectedCaseId || cases.length === 0}
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