import { DeleteIcon, CreateIcon } from '../../common/Icons/Icons';
import './bulkActionsBar.css';

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  onCreate: () => void;
}

const BulkActionsBar = ({ selectedCount, onDelete, onCreate }: BulkActionsBarProps) => {
  const hasSelection = selectedCount > 0;

  return (
    <div className="action-cards-buttons">
      {hasSelection && (
        <button className="card-action-btn delete" onClick={onDelete}>
          <DeleteIcon />
          Удалить выбранное
        </button>
      )}

      <button className="card-action-btn create" onClick={onCreate}>
        <CreateIcon />
        Создать кейс
      </button>
    </div>
  );
};

export default BulkActionsBar;