import { useState, useCallback } from 'react';
import { CloseIcon, PlusIcon } from '../common/Icons/Icons';
import './Modal.css';

interface ControlPoint {
  id: string;
  name: string;
  score: number | null;
}

interface ControlPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseTitle: string;
  initialPoints?: ControlPoint[];
  onPointsChange?: (points: ControlPoint[]) => void;
}

const ControlPointsModal = ({ 
  isOpen, 
  onClose, 
  caseTitle, 
  initialPoints = [],
  onPointsChange
}: ControlPointsModalProps) => {
  const [controlPoints, setControlPoints] = useState<ControlPoint[]>(initialPoints);
  const [newPointName, setNewPointName] = useState('');
  const [newPointScore, setNewPointScore] = useState('');

  // сохранить при изменениях
  const handlePointsChange = useCallback((newPoints: ControlPoint[]) => {
    setControlPoints(newPoints);
    if (onPointsChange) {
      onPointsChange(newPoints);
    }
  }, [onPointsChange]);

  if (!isOpen) return null;

  const handleAddPoint = () => {
    if (newPointName.trim()) {
      const newPoint: ControlPoint = {
        id: Date.now().toString(),
        name: newPointName.trim(),
        score: newPointScore ? Number(newPointScore) : null
      };
      handlePointsChange([...controlPoints, newPoint]);
      setNewPointName('');
      setNewPointScore('');
    }
  };

  const handleUpdateName = (id: string, value: string) => {
    const updated = controlPoints.map(point =>
      point.id === id ? { ...point, name: value } : point
    );
    handlePointsChange(updated);
  };

  const handleUpdateScore = (id: string, value: string) => {
    const numValue = value.replace(/\D/g, '');
    let scoreValue = numValue ? Number(numValue) : null;
    
    if (scoreValue !== null && scoreValue > 100) {
      scoreValue = 100;
    }
    
    const updated = controlPoints.map(point =>
      point.id === id ? { ...point, score: scoreValue } : point
    );
    handlePointsChange(updated);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="control-points-modal" onClick={(e) => e.stopPropagation()}>
        <div className="control-points-header">
          <button className="control-points-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        
        <div className="control-points-body">
          <div className="control-points-title">Контрольные точки</div>
          <div className="control-points-subtitle">{caseTitle}</div>
          
          <div className="control-points-table">
            <div className="table-header">
              <span>Название КТ</span>
              <span>оценка</span>
            </div>
            
            <div className="table-body">
              {controlPoints.map((point) => (
                <div key={point.id} className="table-row">
                  <input
                    type="text"
                    className="point-name-input"
                    value={point.name}
                    onChange={(e) => handleUpdateName(point.id, e.target.value)}
                    placeholder="Введите название КТ"
                  />
                  <input
                    type="text"
                    className="point-score-input"
                    value={point.score !== null ? point.score : ''}
                    onChange={(e) => handleUpdateScore(point.id, e.target.value)}
                    placeholder="0-100"
                    inputMode="numeric"
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div className="add-point-row">
            <div className="add-point-fields">
              <input
                type="text"
                className="add-point-name"
                placeholder="Название контрольной точки"
                value={newPointName}
                onChange={(e) => setNewPointName(e.target.value)}
              />
              <input
                type="text"
                className="add-point-score"
                placeholder="0-100"
                value={newPointScore}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  let numValue = value ? Number(value) : null;
                  if (numValue !== null && numValue > 100) {
                    numValue = 100;
                  }
                  setNewPointScore(numValue !== null ? numValue.toString() : '');
                }}
                inputMode="numeric"
              />
            </div>
            <button className="add-point-btn" onClick={handleAddPoint}>
              <PlusIcon />
              <span>Добавить контрольную точку</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlPointsModal;