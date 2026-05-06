import { useState, useEffect } from 'react';
import { CloseIcon, CheckIcon } from '../common/Icons/Icons';
import { getCases, type Case } from '../../services/cases';
import './Modal.css';

interface AddCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (caseId: string, caseTitle: string) => void;
}

const AddCaseModal = ({ isOpen, onClose, onAdd }: AddCaseModalProps) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchCases = async () => {
        try {
          setLoading(true);
          const data = await getCases();
          setCases(data);
        } catch (error) {
          console.error('Ошибка загрузки кейсов:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchCases();
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
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="cases-scroll-list">
            {loading ? (
              <div className="loading-cases">Загрузка кейсов...</div>
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
                  <span className="case-title-modal">{caseItem.title}</span>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="modal-add-btn" 
            onClick={handleSubmit}
            disabled={!selectedCaseId}
            style={{ opacity: !selectedCaseId ? 0.5 : 1 }}
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