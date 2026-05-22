import { useState } from 'react';
import { CloseIcon, CheckIcon, PlusIcon } from '../common/Icons/Icons';
import './Modal.css';

interface Curator {
  id: string;
  name: string;
}

interface AddCuratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  curators: Curator[];
  selectedCurators: string[];
  onToggleCurator: (id: string) => void;
  onAddCurator: (name: string) => void;
  onReset: () => void;
  onApply: () => void;
}

const AddCuratorModal = ({
  isOpen,
  onClose,
  curators,
  selectedCurators,
  onToggleCurator,
  onAddCurator,
  onReset,
  onApply,
}: AddCuratorModalProps) => {
  const [newCuratorName, setNewCuratorName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const handleAddCurator = () => {
    if (newCuratorName.trim()) {
      onAddCurator(newCuratorName.trim());
      setNewCuratorName('');
      setShowAddForm(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-bar">
          <button className="modal-close-circle" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="curator-list">
            {curators.map((curator) => (
              <div
                key={curator.id}
                className={`curator-item ${selectedCurators.includes(curator.id) ? 'selected' : ''}`}
                onClick={() => onToggleCurator(curator.id)}
              >
                <span>{curator.name}</span>
                <div className="custom-checkbox">
                  <CheckIcon />
                </div>
              </div>
            ))}
          </div>

          {showAddForm ? (
            <div className="add-curator-form">
              <input
                type="text"
                className="curator-input"
                placeholder="Введите имя куратора"
                value={newCuratorName}
                onChange={(e) => setNewCuratorName(e.target.value)}
                autoFocus
              />
              <div className="add-curator-actions">
                <button className="cancel-add-btn" onClick={() => setShowAddForm(false)}>
                  Отмена
                </button>
                <button className="confirm-add-btn" onClick={handleAddCurator}>
                  Добавить
                </button>
              </div>
            </div>
          ) : (
            <button className="add-new-curator-btn" onClick={() => setShowAddForm(true)}>
              <PlusIcon />
              <span>Добавить куратора</span>
            </button>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="modal-reset-btn" onClick={onReset}>
            Сбросить
          </button>
          <button className="modal-apply-btn" onClick={onApply}>
            Применить
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCuratorModal;