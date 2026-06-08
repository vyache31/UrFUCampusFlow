import { useState } from 'react';
import { ArrowDownIcon, CloseIcon } from '../../common/Icons/Icons';
import './botCaseCard.css';

interface BotInterview {
  id: string;
  team_name: string;
  date_time: string;
  tg_user_id: number;
}

interface BotCaseCardProps {
  id: string;
  title: string;
  description: string;
  interviews: BotInterview[];
  onRemoveCase: () => void;
  onRemoveInterview?: (interviewId: string) => void;
}

const BotCaseCard = ({
  title,
  description,
  interviews,
  onRemoveCase,
  onRemoveInterview,
}: BotCaseCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleRemoveCaseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveCase();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`bot-accordion-item ${isOpen ? 'open' : ''}`}>
      <div className="bot-accordion-card">
        <div className="bot-accordion-header">
          <div className="bot-accordion-header-left">
            <button className="bot-accordion-toggle" onClick={handleToggle}>
              <ArrowDownIcon />
            </button>
            <span className="bot-accordion-title">{title}</span>
          </div>
          <div className="bot-accordion-header-right">
            <button className="remove-curator-btn" onClick={handleRemoveCaseClick}>
              <CloseIcon />
            </button>
          </div>
        </div>
        
        {isOpen && (
          <div className="bot-accordion-body">
            <p className="bot-accordion-description">{description}</p>
            
            {/* Интервью */}
            {interviews && interviews.length > 0 && (
              <div className="interviews-section">
                <div className="interviews-title">Записи на интервью</div>
                <div className="interviews-table">
                  <div className="interviews-header">
                    <span>Команда</span>
                    <span>Дата и время</span>
                    <span></span>
                  </div>
                  {interviews.map((interview) => (
                    <div key={interview.id} className="interview-row">
                      <span className="interview-team">{interview.team_name}</span>
                      <span className="interview-datetime">{formatDate(interview.date_time)}</span>
                      {onRemoveInterview && (
                        <button 
                          className="remove-interview-btn"
                          onClick={() => onRemoveInterview(interview.id)}
                        >
                          <CloseIcon />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BotCaseCard;