import { useState, useEffect } from 'react';
import { CloseIcon, CheckIcon } from '../common/Icons/Icons';
import { getCases, type Case } from '../../services/cases';
import './Modal.css';

interface AddCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (caseId: string, caseTitle: string) => void;
  existingCaseIds?: string[];
}

const AddCaseModal = ({ isOpen, onClose, onAdd, existingCaseIds = [] }: AddCaseModalProps) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchCases = async () => {
        try {
          setLoading(true);
          const data = await getCases(100);
          const availableCases = data.filter(c => 
            c.status_id === 3 && !existingCaseIds.includes(c.id)
          );
          setCases(availableCases);
        } catch (error) {
          console.error('Ошибка загрузки кейсов:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchCases();
    }
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) {
      setSelectedCaseId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectCase = (caseId: string) => {
    setSelectedCaseId(caseId);
  };

  const handleSubmit = () => {
    if (selectedCaseId) {
      const foundCase = cases.find(c => c.id === selectedCaseId);
      if (foundCase) {
        onAdd(selectedCaseId, foundCase.title);
        setSelectedCaseId(null);
        onClose();
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
            style={{ opacity: !selectedCaseId || cases.length === 0 ? 0.5 : 1 }}
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
