import { DeleteIcon, MarkActiveIcon, CreateIcon } from '../../common/Icons/Icons';
import './bulkActionsBar.css';

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  onMarkActive: () => void;
  onCreate: () => void;
}

const BulkActionsBar = ({ selectedCount, onDelete, onMarkActive, onCreate }: BulkActionsBarProps) => {
  return (
    <div className="action-cards-buttons">
      {/* Кнопки массовых действий появляются ТОЛЬКО когда выбраны кейсы */}
      {selectedCount > 0 && (
        <>
          <button className="card-action-btn delete" onClick={onDelete}>
            <DeleteIcon />
            Удалить выбранное
          </button>
          <button className="card-action-btn mark" onClick={onMarkActive}>
            <MarkActiveIcon />
            Отметить активным
          </button>
        </>
      )}
      
      {/* Кнопка создания кейса - всегда видна (последняя) */}
      <button className="card-action-btn create" onClick={onCreate}>
        <CreateIcon />
        Создать кейс
      </button>
    </div>
  );
};

export default BulkActionsBar;