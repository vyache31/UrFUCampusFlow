import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ReactionIcon, 
  ArrowDownIcon, 
  OpenFullIcon, 
  CommentIcon,
  CheckboxIcon 
} from '../../common/Icons/Icons';
import { truncateCardTitle, truncateCardDescription } from '../../../utils/truncate';
import { 
  getFormReactions, 
  getMyReaction, 
  createReaction, 
  updateReaction,
  type Reaction 
} from '../../../services/evaluationReactions';
import { useToast } from '../../../context/ToastContext';
import './CaseCard.css';

interface CaseCardProps {
  type: 'case' | 'team';
  id?: string;
  title: string;
  shortTitle?: string;
  description: string;
  status?: string;
  defaultOpen?: boolean;
  evaluationFormId?: string;
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
  evaluationFormId,
  likes: initialLikes = 0,
  dislikes: initialDislikes = 0,
  onOpenFull,
  onComment,
  onLike: onLikeProp,
  onDislike: onDislikeProp,
  showCheckbox = false,
  isSelected = false,
  onSelect
}: CaseCardProps) => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [userReaction, setUserReaction] = useState<Reaction | null>(null);
  const [loadingReaction, setLoadingReaction] = useState(false);

  const showReactions = type === 'case' && status === 'На оценке' && evaluationFormId;

  useEffect(() => {
    if (showReactions && evaluationFormId) {
      loadReactions();
    }
  }, [evaluationFormId]);

  const loadReactions = async () => {
    try {
      const allReactions = await getFormReactions(evaluationFormId!);
      const likesCount = allReactions.filter(r => r.reaction === 'LIKE').length;
      const dislikesCount = allReactions.filter(r => r.reaction === 'DISLIKE').length;
      setLikes(likesCount);
      setDislikes(dislikesCount);
      
      const myReaction = await getMyReaction(evaluationFormId!);
      setUserReaction(myReaction);
    } catch (error) {
      console.error('Ошибка загрузки реакций:', error);
    }
  };

  const handleReaction = async (reactionType: 'LIKE' | 'DISLIKE') => {
    if (!evaluationFormId || loadingReaction) return;
    
    setLoadingReaction(true);
    
    try {
      let newReaction: Reaction | null = null;
      
      if (userReaction) {
        if (userReaction.reaction === reactionType) {
          setLoadingReaction(false);
          return;
        } else {
          newReaction = await updateReaction(userReaction.id, reactionType);
          setUserReaction(newReaction);
          showSuccess('Реакция обновлена');
        }
      } else {
        newReaction = await createReaction(evaluationFormId, reactionType);
        setUserReaction(newReaction);
        showSuccess('Реакция добавлена');
      }
      
      await loadReactions();
      
      if (reactionType === 'LIKE') {
        onLikeProp?.();
      } else {
        onDislikeProp?.();
      }
      
    } catch (error) {
      console.error('Ошибка при реакции:', error);
      showError('Не удалось отправить реакцию');
    } finally {
      setLoadingReaction(false);
    }
  };

  const handleLike = () => {
    handleReaction('LIKE');
  };

  const handleDislike = () => {
    handleReaction('DISLIKE');
  };

  const liked = userReaction?.reaction === 'LIKE';
  const disliked = userReaction?.reaction === 'DISLIKE';

  const displayTitle = shortTitle || title;
  const { fullText: fullTitle } = truncateCardTitle(displayTitle);
  
  const displayDescription = isOpen ? description : truncateCardDescription(description);

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
          {(type === 'case' || type === 'team') && (
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
                  <button className={`reaction-btn like ${liked ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleLike(); }} disabled={loadingReaction}>
                    <ReactionIcon />
                    <span className="count">{likes}</span>
                  </button>
                  <button className={`reaction-btn dislike ${disliked ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleDislike(); }} disabled={loadingReaction}>
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