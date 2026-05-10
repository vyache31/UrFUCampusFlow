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
  shortTitle?: string;
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
  shortTitle,
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

  const displayTitle = shortTitle || title;
  const { fullText: fullTitle } = truncateCardTitle(displayTitle);
  
  const displayDescription = isOpen ? description : truncateCardDescription(description);

  console.log('Description:', description);
  console.log('Display description:', displayDescription);
  console.log('Is open:', isOpen);

const handleOpenFull = () => {
  if (onOpenFull) {
    onOpenFull();
  } else if (id) {
    if (type === 'case') {
      navigate(`/cases/${id}`);
    } else if (type === 'team') {
      navigate(`/teams/${id}`);
    }
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
          {type === 'case' && (
            <div className="accordion-header-center">
              <div className="status-dot"></div>
              <span className="status-text">{status}</span>
            </div>
          )}
          <div 
            className="accordion-open-btn" 
            onClick={handleOpenFull}
          >
            Открыть полностью
            <OpenFullIcon />
          </div>
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