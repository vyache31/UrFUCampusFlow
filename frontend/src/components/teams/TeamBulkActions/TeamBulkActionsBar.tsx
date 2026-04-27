import { DeleteIcon, CreateIcon } from '../../common/Icons/Icons';
import './teamBulkActionsBar.css';

interface TeamBulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  onCreate: () => void;
}

const TeamBulkActionsBar = ({ selectedCount, onDelete, onCreate }: TeamBulkActionsBarProps) => {
  return (
    <div className="team-action-cards-buttons">
      {selectedCount > 0 && (
        <button className="team-card-action-btn delete" onClick={onDelete}>
          <DeleteIcon />
          Удалить выбранное
        </button>
      )}
      <button className="team-card-action-btn create" onClick={onCreate}>
        <CreateIcon />
        Создать команду
      </button>
    </div>
  );
};

export default TeamBulkActionsBar;