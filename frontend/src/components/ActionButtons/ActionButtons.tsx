import { useNavigate } from 'react-router-dom';
import './actionButtons.css';

const ACTION_TARGETS = [
  { label: 'Сформировать отчёт', path: '/report' },
  { label: 'Создать кейс', path: '/cases/create' },
  { label: 'Создать команду', path: '/teams/create' },
  { label: 'Перейти к боту', path: '/bot-management' },
] as const;

const ActionButtons = () => {
  const navigate = useNavigate();

  return (
    <div className="action-buttons">
      {ACTION_TARGETS.map(({ label, path }) => (
        <button key={path} className="action-btn" onClick={() => navigate(path)}>
          {label}
        </button>
      ))}
    </div>
  );
};

export default ActionButtons;