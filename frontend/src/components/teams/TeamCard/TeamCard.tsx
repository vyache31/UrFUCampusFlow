import { useState } from 'react';
import { ArrowDownIcon, OpenFullIcon } from '../../common/Icons/Icons';
import { truncateCardTitle, truncateCardDescription } from '../../../utils/truncate';
import './teamCard.css';

interface TeamCardProps {
  id: string;
  name: string;
  description: string;
  status: string;
  defaultOpen?: boolean;
  onOpenFull?: (id: string) => void;
  showCheckbox?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
}

const TeamCard = ({
  id,
  name,
  description,
  status,
  defaultOpen = false,
  onOpenFull,
  showCheckbox = false,
  isSelected = false,
  onSelect
}: TeamCardProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  const { displayText: displayName, fullText: fullName } = truncateCardTitle(name);
  const displayDescription = isOpen ? description : truncateCardDescription(description);

  const getStatusColor = () => {
    return '#C5B4E2';
  };
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(!isSelected);
  };

  const handleIconColorChange = (e: React.MouseEvent<HTMLDivElement>, isActive: boolean) => {
    const svg = e.currentTarget.querySelector('svg');
    if (svg) {
      if (isActive) {
        svg.style.filter = 'invert(85%) sepia(51%) saturate(846%) hue-rotate(1deg) brightness(100%) contrast(98%)';
      } else {
        svg.style.filter = '';
      }
    }
  };

  return (
    <div className={`team-accordion-item ${isOpen ? 'open' : ''}`}>
      <div className="team-accordion-card">
        <div className="team-accordion-header">
          <div className="team-accordion-header-left">
            {showCheckbox && (
              <div 
                className={`team-checkbox ${isSelected ? 'selected' : ''}`}
                onClick={handleCheckboxClick}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M20.5762 7.48016C20.8414 7.16195 20.7984 6.68903 20.4802 6.42385C20.1619 6.15868 19.689 6.20167 19.4239 6.51988L14.0332 12.9887C12.9503 14.2881 12.1886 15.1994 11.5279 15.796C10.8826 16.3787 10.4373 16.5639 10 16.5639C9.56276 16.5639 9.11742 16.3787 8.47213 15.796C7.81143 15.1994 7.04969 14.2881 5.96686 12.9887L4.57618 11.3199C4.31101 11.0017 3.83809 10.9587 3.51988 11.2239C3.20167 11.489 3.15868 11.9619 3.42385 12.2802L4.85312 13.9953C5.88839 15.2376 6.71748 16.2326 7.46684 16.9092C8.24089 17.6082 9.03216 18.0639 10 18.0639C10.9679 18.0639 11.7591 17.6082 12.5332 16.9092C13.2826 16.2326 14.1116 15.2377 15.1469 13.9953L20.5762 7.48016Z" fill="#202024"/>
                </svg>
              </div>
            )}
            <div className="team-accordion-toggle" onClick={() => setIsOpen(!isOpen)}>
              <ArrowDownIcon />
            </div>
            <span className="team-accordion-title" title={fullName}>
              {displayName}
            </span>
          </div>
          <div className="team-accordion-header-center">
            <div className="team-status-dot" style={{ background: getStatusColor() }}></div>
            <span className="team-status-text">{status}</span>
          </div>
          <div 
            className="team-accordion-open-btn" 
            onClick={(e) => { 
              e.stopPropagation(); 
              onOpenFull?.(id); 
            }}
            onMouseDown={(e) => {
              const target = e.currentTarget;
              target.style.background = 'transparent';
              target.style.color = '#F6CF22';
              target.style.outline = '1px solid #F6CF22';
              target.style.outlineOffset = '-1px';
              handleIconColorChange(e, true);
            }}
            onMouseUp={(e) => {
              const target = e.currentTarget;
              target.style.background = '#F9E27D';
              target.style.color = '#202024';
              target.style.outline = '';
              handleIconColorChange(e, false);
            }}
            onMouseLeave={(e) => {
              const target = e.currentTarget;
              target.style.background = '#F9E27D';
              target.style.color = '#202024';
              target.style.outline = '';
              handleIconColorChange(e, false);
            }}
            style={{
              padding: '10px 20px',
              background: '#F9E27D',
              borderRadius: '25px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '16px',
              fontWeight: '400',
              whiteSpace: 'nowrap',
              fontFamily: 'Montserrat, sans-serif',
              border: 'none',
              transition: 'all 0.2s ease'
            }}
          >
            Открыть полностью
            <OpenFullIcon />
          </div>
        </div>
        {isOpen && (
          <div className="team-accordion-body">
            <p className="team-accordion-description">{displayDescription}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamCard;