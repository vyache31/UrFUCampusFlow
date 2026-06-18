import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { SendIcon } from '../../components/common/Icons/Icons';
import { getCaseById } from '../../services/cases';
import { 
  getEvaluationFormByCaseId,
  getEvaluationComments, 
  addEvaluationComment,
  type Comment as ApiComment,
  type ApiError
} from '../../services/evaluationComments';
import { getCurrentUserEmail } from '../../services/auth';
import { useToast } from '../../context/ToastContext';
import './caseCommentsPage.css';

interface DisplayComment {
  id: string;
  author: string;
  text: string;
  date: string;
  createdAt: string;
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).replace(' г.', '');
};

const CaseCommentsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { showSuccess, showError } = useToast();
  
  const [caseTitle, setCaseTitle] = useState<string>('');
  const [evaluationFormId, setEvaluationFormId] = useState<string | null>(null);
  const [comments, setComments] = useState<DisplayComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const commentInputRef = useRef<HTMLDivElement>(null);
  const currentUserEmail = getCurrentUserEmail();

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        const caseData = await getCaseById(id);
        setCaseTitle(caseData.title);
        
        try {
          const evaluationForm = await getEvaluationFormByCaseId(id);
          setEvaluationFormId(evaluationForm.id);
          
          const commentsData = await getEvaluationComments(evaluationForm.id);
          const formattedComments: DisplayComment[] = commentsData.map((comment: ApiComment) => ({
            id: comment.id,
            author: comment.user_email || 'Пользователь',
            text: comment.comment_text,
            date: formatDate(comment.created_at),
            createdAt: comment.created_at
          }));
          
          formattedComments.sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          setComments(formattedComments);
        } catch (err: unknown) {
          const error = err as ApiError;
          if (error?.response?.status === 404) {
            console.log('Форма оценки не найдена (кейс не на стадии оценки)');
          } else {
            console.error('Ошибка загрузки комментариев:', err);
            showError('Не удалось загрузить комментарии');
          }
          setComments([]);
        }
      } catch (error) {
        console.error('Ошибка загрузки кейса:', error);
        showError('Не удалось загрузить информацию о кейсе');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, showError]);

  useEffect(() => {
    if (commentInputRef.current) {
      if (newComment === '') {
        commentInputRef.current.classList.add('empty');
      } else {
        commentInputRef.current.classList.remove('empty');
      }
    }
  }, [newComment]);

  const handleSendComment = async () => {
    if (!newComment.trim()) return;
    if (!evaluationFormId) {
      showError('Комментарии доступны только для кейсов на стадии оценки');
      return;
    }
    
    try {
      setSending(true);
      
      const newApiComment = await addEvaluationComment(evaluationFormId, newComment.trim());
      
      const newDisplayComment: DisplayComment = {
        id: newApiComment.id,
        author: currentUserEmail || 'Вы',
        text: newApiComment.comment_text,
        date: formatDate(newApiComment.created_at),
        createdAt: newApiComment.created_at
      };
      
      setComments([...comments, newDisplayComment]);
      setNewComment('');
      if (commentInputRef.current) {
        commentInputRef.current.innerText = '';
      }
      showSuccess('Комментарий добавлен');
    } catch (err: unknown) {
      const error = err as ApiError;
      console.error('Ошибка отправки комментария:', error);
      if (error?.response?.status === 404) {
        showError('Форма оценки не найдена');
      } else {
        showError('Не удалось отправить комментарий');
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  const breadcrumbItems = [
    { label: 'Главная', path: '/' },
    { label: 'Все кейсы', path: '/cases' },
    { label: 'Просмотр кейса', path: `/cases/${id}` },
    { label: 'Комментарии' },
  ];

  if (loading) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="loading-container">Загрузка комментариев...</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper case-comments-page">
      <Header />
      <Breadcrumb items={breadcrumbItems} />

      <div className="comments-header">
        <h1 className="page-title">Комментарии</h1>
      </div>

      <div className="case-title-section">
        <div className="case-title">{caseTitle}</div>
      </div>

      <div className="comments-list">
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-author">{comment.author}</div>
              <div className="comment-text">{comment.text}</div>
              <div className="comment-date">{comment.date}</div>
            </div>
          ))
        ) : (
          <div className="empty-comments">
            {evaluationFormId 
              ? 'Пока нет комментариев. Будьте первым!'
              : 'Комментарии доступны только для кейсов на стадии оценки'}
          </div>
        )}
      </div>

      {evaluationFormId && (
        <div className="new-comment-section">
          <div className="new-comment-label">Оставить комментарий</div>
          <div
            ref={commentInputRef}
            className="new-comment-input empty"
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => setNewComment(e.currentTarget.innerText)}
            onKeyDown={handleKeyDown}
            data-placeholder="Напишите ваш комментарий"
          />
          <button 
            className="send-btn" 
            onClick={handleSendComment} 
            disabled={sending || !newComment.trim()}
          >
            <SendIcon />
            <span>{sending ? 'Отправка...' : 'Отправить'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default CaseCommentsPage;