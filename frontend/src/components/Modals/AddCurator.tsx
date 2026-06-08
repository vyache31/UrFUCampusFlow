import { useState, useEffect } from 'react';
import { CloseIcon, CheckIcon } from '../common/Icons/Icons';
import { getAllCurators } from '../../services/curators';
import './Modal.css';

interface AddCuratorProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (curatorId: string) => void;
  existingCuratorIds?: string[];
}

const AddCurator =({ isOpen, onClose, onAssign, existingCuratorIds = [] }: AddCuratorProps) => {
  const [curators, setCurators] = useState<{ id: string; email: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCuratorId, setSelectedCuratorId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchCurators = async () => {
        setLoading(true);
        const allCurators = await getAllCurators();
        // Исключаем уже назначенных кураторов
        const available = allCurators.filter(c => !existingCuratorIds.includes(c.id));
        setCurators(available);
        setLoading(false);
      };
      fetchCurators();
    }
  }, [isOpen, existingCuratorIds]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (selectedCuratorId) {
      onAssign(selectedCuratorId);
      setSelectedCuratorId(null);
      onClose();
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
            {loading ? (
              <div className="loading-curators">Загрузка...</div>
            ) : curators.length === 0 ? (
              <div className="empty-curators-modal">
                Нет доступных кураторов. Сначала создайте куратора через Swagger (POST /users/ с role_id=3)
              </div>
            ) : (
              curators.map((curator) => (
                <div
                  key={curator.id}
                  className={`curator-item ${selectedCuratorId === curator.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCuratorId(curator.id)}
                >
                  <div>
                    <div className="curator-email">{curator.email}</div>
                  </div>
                  <div className="custom-checkbox">
                    {selectedCuratorId === curator.id && <CheckIcon />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="modal-add-btn" 
            onClick={handleSubmit}
            disabled={!selectedCuratorId || curators.length === 0}
          >
            <CheckIcon />
            <span>Назначить</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCurator;