import { useNavigate } from 'react-router-dom';
import './actionButtons.css';

const ActionButtons = () => {
  const navigate = useNavigate();

  const handleReport = () => {
    navigate('/report');
  };

  const handleCreateCase = () => {
    navigate('/cases/create');
  };

  const handleCreateTeam = () => {
    navigate('/teams/create');
  };

  const handleGoToBot = () => {
    navigate('/bot-management');
  };

  return (
    <div className="action-buttons">
      <button className="action-btn" onClick={handleReport}>Сформировать отчёт</button>
      <button className="action-btn" onClick={handleCreateCase}>Создать кейс</button>
      <button className="action-btn" onClick={handleCreateTeam}>Создать команду</button>
      <button className="action-btn" onClick={handleGoToBot}>Перейти к боту</button>
    </div>
  );
};

export default ActionButtons;