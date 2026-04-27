import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ReactionIcon, 
  ArrowDownIcon, 
  OpenFullIcon, 
  CommentIcon,
  CheckboxIcon 
} from '../../common/Icons/Icons';
import { truncateCardTitle, truncateCardDescription } from '../../../utils/truncate';
import './caseCard.css';

interface CaseCardProps {
  type: 'case' | 'team';
  id?: string;
  title: string;
  description: string;
  status?: string;
  defaultOpen?: boolean;
  likes?: number;
  dislikes?: number;
  onOpenFull?: () => void;
  onComment?: () => void;
  onLike?: () => void;
  onDislike?: () => void;
  showCheckbox?: boolean;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
}

const CaseCard = ({
  type,
  id,
  title,
  description,
  status = "На оценке",
  defaultOpen = false,
  likes: initialLikes = 2,
  dislikes: initialDislikes = 2,
  onOpenFull,
  onComment,
  onLike: onLikeProp,
  onDislike: onDislikeProp,
  showCheckbox = false,
  isSelected = false,
  onSelect
}: CaseCardProps) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);

  const showReactions = type === 'case' && status === 'На оценке';
  
  const { displayText: displayTitle, fullText: fullTitle } = truncateCardTitle(title);
  const displayDescription = isOpen ? description : truncateCardDescription(description);

  const handleOpenFull = () => {
    if (onOpenFull) {
      onOpenFull();
    } else if (id) {
      navigate(`/cases/${id}`);
    }
  };

  const handleLike = () => {
    if (liked) {
      setLikes(likes - 1);
      setLiked(false);
    } else {
      setLikes(likes + 1);
      setLiked(true);
      if (disliked) {
        setDislikes(dislikes - 1);
        setDisliked(false);
      }
    }
    onLikeProp?.();
  };

  const handleDislike = () => {
    if (disliked) {
      setDislikes(dislikes - 1);
      setDisliked(false);
    } else {
      setDislikes(dislikes + 1);
      setDisliked(true);
      if (liked) {
        setLikes(likes - 1);
        setLiked(false);
      }
    }
    onDislikeProp?.();
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(!isSelected);
  };

  const handleToggleAccordion = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className={`accordion-item ${isOpen ? 'open' : ''}`}>
      <div className="accordion-card">
        <div className="accordion-header">
          <div className="accordion-header-left">
            {showCheckbox && (
              <div 
                className={`case-checkbox ${isSelected ? 'selected' : ''}`}
                onClick={handleCheckboxClick}
              >
                <CheckboxIcon />
              </div>
            )}
            <div className="accordion-toggle" onClick={handleToggleAccordion}>
              <ArrowDownIcon />
            </div>
            <span className="accordion-title" title={fullTitle}>
              {displayTitle}
            </span>
          </div>
          <button 
            className="accordion-open-btn" 
            onClick={handleOpenFull}
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
            onMouseDown={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#F6CF22';
              e.currentTarget.style.outline = '1px solid #F6CF22';
              e.currentTarget.style.outlineOffset = '-1px';
              
              const svg = e.currentTarget.querySelector('svg');
              if (svg) {
                svg.style.filter = 'invert(85%) sepia(51%) saturate(846%) hue-rotate(1deg) brightness(100%) contrast(98%)';
              }
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.background = '#F9E27D';
              e.currentTarget.style.color = '#202024';
              e.currentTarget.style.outline = '';
              
              const svg = e.currentTarget.querySelector('svg');
              if (svg) {
                svg.style.filter = '';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F9E27D';
              e.currentTarget.style.color = '#202024';
              e.currentTarget.style.outline = '';
              
              const svg = e.currentTarget.querySelector('svg');
              if (svg) {
                svg.style.filter = '';
              }
            }}
          >
            Открыть полностью
            <OpenFullIcon />
          </button>
        </div>
        {isOpen && (
          <div className="accordion-body">
            <p className="accordion-description">{displayDescription}</p>
            {showReactions && (
              <div className="accordion-footer">
                <button className="comments-btn" onClick={(e) => { e.stopPropagation(); onComment?.(); }}>
                  <CommentIcon />
                  Комментарии
                </button>
                <div className="reactions">
                  <button className={`reaction-btn like ${liked ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleLike(); }}>
                    <ReactionIcon />
                    <span className="count">{likes}</span>
                  </button>
                  <button className={`reaction-btn dislike ${disliked ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleDislike(); }}>
                    <span style={{ display: 'inline-block', transform: 'rotate(180deg)' }}>
                      <ReactionIcon />
                    </span>
                    <span className="count">{dislikes}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseCard;