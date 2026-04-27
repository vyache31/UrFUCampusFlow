import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { testCases } from '../../data/cases';
import { testComments, type Comment } from '../../data/comments';
import { SendIcon } from '../../components/common/Icons/Icons';
import './caseCommentsPage.css';

const CaseCommentsPage = () => {
  const { id } = useParams<{ id: string }>();
  
  const caseData = testCases.find(c => c.id === id);
  
  const [comments, setComments] = useState<Comment[]>(testComments);

  const [newComment, setNewComment] = useState('');
  const commentInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (commentInputRef.current) {
      if (newComment === '') {
        commentInputRef.current.classList.add('empty');
      } else {
        commentInputRef.current.classList.remove('empty');
      }
    }
  }, [newComment]);

  const handleSendComment = () => {
    if (newComment.trim()) {
      const now = new Date();
      const formattedDate = now.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(' г.', '');
      
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        author: 'Данил Колбасенко',
        text: newComment.trim(),
        date: formattedDate
      };
      setComments([...comments, newCommentObj]);
      setNewComment('');
      if (commentInputRef.current) {
        commentInputRef.current.innerText = '';
      }
    }
  };

  const breadcrumbItems = [
    { label: 'Главная', path: '/' },
    { label: 'Все кейсы', path: '/cases' },
    { label: 'Просмотр кейса', path: `/cases/${id}` },
    { label: 'Комментарии' },
  ];

  if (!caseData) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="not-found">Кейс не найден</div>
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
        <div className="case-title">{caseData.title}</div>
      </div>

      <div className="comments-list">
        {comments.map((comment) => (
          <div key={comment.id} className="comment-item">
            <div className="comment-author">{comment.author}</div>
            <div className="comment-text">{comment.text}</div>
            <div className="comment-date">{comment.date}</div>
          </div>
        ))}
      </div>

      <div className="new-comment-section">
        <div className="new-comment-label">Оставить комментарий</div>
        <div
          ref={commentInputRef}
          className="new-comment-input empty"
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => setNewComment(e.currentTarget.innerText)}
          data-placeholder="Напишите ваш комментарий"
        >
        </div>
        <button className="send-btn" onClick={handleSendComment}>
          <SendIcon />
          <span>Отправить</span>
        </button>
      </div>
    </div>
  );
};

export default CaseCommentsPage;