import { DeleteIcon, CreateIcon } from '../../common/Icons/Icons';
import './bulkActionsBar.css';

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  onCreate: () => void;
}

const BulkActionsBar = ({ selectedCount, onDelete, onCreate }: BulkActionsBarProps) => {
  return (
    <div className="action-cards-buttons">
      {selectedCount > 0 && (
        <>
          <button className="card-action-btn delete" onClick={onDelete}>
            <DeleteIcon />
            Удалить выбранное
          </button>
        </>
      )}
      
      <button className="card-action-btn create" onClick={onCreate}>
        <CreateIcon />
        Создать кейс
      </button>
    </div>
  );
};

export default BulkActionsBar;