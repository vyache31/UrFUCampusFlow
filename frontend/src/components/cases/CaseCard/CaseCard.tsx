import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ReactionIcon,
  ArrowDownIcon,
  OpenFullIcon,
  CommentIcon,
  CheckboxIcon,
} from '../../common/Icons/Icons';
import { truncateCardTitle, truncateCardDescription } from '../../../utils/truncate';
import {
  getFormReactions,
  getMyReaction,
  createReaction,
  updateReaction,
  type Reaction,
} from '../../../services/evaluationReactions';
import { subscribeToRealtime } from '../../../services/realtime';
import { useToast } from '../../../context/ToastContext';
import './CaseCard.css';

type ReactionType = 'LIKE' | 'DISLIKE';

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

interface ReactionButtonsProps {
  likes: number;
  dislikes: number;
  liked: boolean;
  disliked: boolean;
  disabled: boolean;
  onReact: (type: ReactionType) => void;
}

const ReactionButtons = ({
  likes,
  dislikes,
  liked,
  disliked,
  disabled,
  onReact,
}: ReactionButtonsProps) => (
  <div className="reactions">
    <button
      className={`reaction-btn like ${liked ? 'active' : ''}`}
      onClick={e => {
        e.stopPropagation();
        onReact('LIKE');
      }}
      disabled={disabled}
    >
      <ReactionIcon />
      <span className="count">{likes}</span>
    </button>
    <button
      className={`reaction-btn dislike ${disliked ? 'active' : ''}`}
      onClick={e => {
        e.stopPropagation();
        onReact('DISLIKE');
      }}
      disabled={disabled}
    >
      <span style={{ display: 'inline-block', transform: 'rotate(180deg)' }}>
        <ReactionIcon />
      </span>
      <span className="count">{dislikes}</span>
    </button>
  </div>
);

const CaseCard = ({
  type,
  id,
  title,
  shortTitle,
  description,
  status = 'На оценке',
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
  onSelect,
}: CaseCardProps) => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [userReaction, setUserReaction] = useState<Reaction | null>(null);
  const [isReacting, setIsReacting] = useState(false);

  const showReactions = type === 'case' && status === 'На оценке' && Boolean(evaluationFormId);

  const loadReactions = useCallback(async () => {
    if (!evaluationFormId) return;
    try {
      const [all, mine] = await Promise.all([
        getFormReactions(evaluationFormId),
        getMyReaction(evaluationFormId),
      ]);
      setLikes(all.filter(r => r.reaction === 'LIKE').length);
      setDislikes(all.filter(r => r.reaction === 'DISLIKE').length);
      setUserReaction(mine);
    } catch (error) {
      console.error('Ошибка загрузки реакций:', error);
    }
  }, [evaluationFormId]);

  useEffect(() => {
    if (showReactions) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadReactions();
    }
  }, [loadReactions, showReactions]);

  useEffect(() => {
    if (!showReactions || !evaluationFormId) return;
    return subscribeToRealtime(event => {
      if (event.type !== 'reaction_updated') return;
      if (event.like.evaluation_form_id !== evaluationFormId) return;
      void loadReactions();
    });
  }, [evaluationFormId, loadReactions, showReactions]);

  const handleReaction = async (reactionType: ReactionType) => {
    if (!evaluationFormId || isReacting) return;
    if (userReaction?.reaction === reactionType) return;

    setIsReacting(true);
    try {
      const next = userReaction
        ? await updateReaction(userReaction.id, reactionType)
        : await createReaction(evaluationFormId, reactionType);

      setUserReaction(next);
      showSuccess(userReaction ? 'Реакция обновлена' : 'Реакция добавлена');
      await loadReactions();

      (reactionType === 'LIKE' ? onLikeProp : onDislikeProp)?.();
    } catch (error) {
      console.error('Ошибка при реакции:', error);
      showError('Не удалось отправить реакцию');
    } finally {
      setIsReacting(false);
    }
  };

  const handleOpenFull = () => {
    if (onOpenFull) return onOpenFull();
    if (!id) return;
    navigate(type === 'case' ? `/cases/${id}` : `/teams/${id}`);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(!isSelected);
  };

  const handleToggleAccordion = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(v => !v);
  };

  const displayTitle = shortTitle || title;
  const { fullText: fullTitle } = truncateCardTitle(displayTitle);
  const displayDescription = isOpen ? description : truncateCardDescription(description);

  const liked = userReaction?.reaction === 'LIKE';
  const disliked = userReaction?.reaction === 'DISLIKE';

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

          <div className="accordion-header-center">
            <div className="status-dot" />
            <span className="status-text">{status}</span>
          </div>

          <div className="accordion-open-btn" onClick={handleOpenFull}>
            Открыть полностью
            <OpenFullIcon />
          </div>
        </div>

        {isOpen && (
          <div className="accordion-body">
            <p className="accordion-description">{displayDescription}</p>

            {showReactions && (
              <div className="accordion-footer">
                <button
                  className="comments-btn"
                  onClick={e => {
                    e.stopPropagation();
                    onComment?.();
                  }}
                >
                  <CommentIcon />
                  Комментарии
                </button>

                <ReactionButtons
                  likes={likes}
                  dislikes={dislikes}
                  liked={liked}
                  disliked={disliked}
                  disabled={isReacting}
                  onReact={handleReaction}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseCard;