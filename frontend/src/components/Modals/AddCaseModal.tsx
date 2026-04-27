import { useState } from 'react';
import { CloseIcon, CheckIcon } from '../common/Icons/Icons';
import { testCases } from '../../data/cases';
import './Modal.css';

interface AddCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (caseId: string, caseTitle: string) => void;
}

const AddCaseModal = ({ isOpen, onClose, onAdd }: AddCaseModalProps) => {
  const [selectedCases, setSelectedCases] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleToggleCase = (caseId: string) => {
    setSelectedCases(prev =>
      prev.includes(caseId)
        ? prev.filter(id => id !== caseId)
        : [...prev, caseId]
    );
  };

  const handleSubmit = () => {
    selectedCases.forEach(caseId => {
      const foundCase = testCases.find(c => c.id === caseId);
      if (foundCase) {
        onAdd(caseId, foundCase.title);
      }
    });
    setSelectedCases([]);
    onClose();
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
          <div className="cases-list-modal">
            {testCases.map((caseItem) => (
              <div
                key={caseItem.id}
                className={`case-item-modal ${selectedCases.includes(caseItem.id) ? 'selected' : ''}`}
                onClick={() => handleToggleCase(caseItem.id)}
              >
                <div className="case-checkbox-modal">
                  {selectedCases.includes(caseItem.id) && <CheckIcon />}
                </div>
                <span className="case-title-modal">{caseItem.title}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="modal-add-btn" onClick={handleSubmit}>
            <CheckIcon />
            <span>Добавить</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCaseModal;