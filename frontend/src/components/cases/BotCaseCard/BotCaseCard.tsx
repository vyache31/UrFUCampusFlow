import { useState } from 'react';
import { ArrowDownIcon, CloseIcon } from '../../common/Icons/Icons';
import './botCaseCard.css';

interface Curator {
  id: string;
  name: string;
}

interface BotCaseCardProps {
  id: string;
  title: string;
  description: string;
  curators: Curator[];
  onAddCurator: () => void;
  onRemoveCurator: (curatorId: string) => void;
  onRemoveCase: () => void;  // добавлено
}

const BotCaseCard = ({
  title,
  description,
  curators,
  onAddCurator,
  onRemoveCurator,
  onRemoveCase,  // добавлено
}: BotCaseCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleRemoveCaseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemoveCase();
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
            <button className="add-curator-btn" onClick={onAddCurator}>
              Добавить куратора
            </button>
            <button className="remove-curator-btn" onClick={handleRemoveCaseClick}>
              <CloseIcon />
            </button>
          </div>
        </div>
        
        {isOpen && (
          <div className="bot-accordion-body">
            <p className="bot-accordion-description">{description}</p>
            
            {curators.length > 0 && (
              <div className="assigned-curators">
                <div className="curators-label">Назначенные кураторы:</div>
                <div className="curators-list">
                  {curators.map((curator) => (
                    <div key={curator.id} className="curator-tag">
                      <span>{curator.name}</span>
                      <button 
                        className="remove-curator-tag"
                        onClick={() => onRemoveCurator(curator.id)}
                      >
                        <CloseIcon />
                      </button>
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