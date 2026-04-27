import { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { testCases } from '../../data/cases';
import { SendIcon } from '../../components/common/Icons/Icons';
import './caseCommentsPage.css';

interface Comment {
  id: string;
  author: string;
  text: string;
  date: string;
}

const CaseCommentsPage = () => {
  const { id } = useParams<{ id: string }>();
  
  const caseData = testCases.find(c => c.id === id);
  
  const [comments, setComments] = useState<Comment[]>([
    {
      id: '1',
      author: 'Елена Колбасенко',
      text: 'Ребята, я посмотрела их заявку на проект. Состав хороший: дизайнер, фронтенд, два бэкендера и аналитик, но для ИИ-сервиса этого мало — нет отдельного ML-инженера. Аналитик в такой связке не сможет ни модель обучить, ни метрики качества предсказаний закрыть. Плюс в описании проекта ни слова про источники данных (биржевые API, новости, макроэкономику) и про то, как они собираются бороться с переобучением модели. Пока выглядит как простое приложение-обёртка, а не реальный инвестиционный советник.',
      date: '13 марта 2026 в 13:00'
    },
    {
      id: '2',
      author: 'Данил Колбасенко',
      text: 'Ирина, согласен про ML-инженера, но на учебный проект можно отмашку дать, если они используют готовый LLM API или библиотеку вроде Prophet для прогнозов. Меня больше волнует юридика: сервис подбора портфеля даёт рекомендации — значит, нужна оговорка «не инвестиционная консультация». Это они в описание не включили. И да, тестировать на исторических данных недостаточно, нужен хотя бы бумажный трейдинг.',
      date: '13 марта 2026 в 13:00'
    },
    {
      id: '3',
      author: 'Андрей Колбасенко',
      text: 'Коллеги, давайте честно: без риск-профилирования клиента это просто генератор случайных активов. Я не вижу в их описании ни блока с опросником (консервативный/агрессивный профиль), ни HRP-стратегии, ни даже простого ребаланса. Два бэкендера — ок, пусть один пилит сбор и очистку данных (pandas, апишки), второй — движок оптимизации портфеля (например, PyPortfolioOpt). Но кто будет рассчитывать корреляцию активов и drawdown? Фронтендеру вообще придётся тянуть графики доходности и heatmap. А дизайнеру — делать не красивую кнопку, а понятный onboarding по рискам. Этот проект в текущем описании скорее пет-проект для дашборда, а не MVP.',
      date: '13 марта 2026 в 13:00'
    },
    {
      id: '4',
      author: 'Данил Колбасенко',
      text: 'Ок, тогда так: принимаем описание как черновик. На защите спросим: 1) кто отвечает за backtesting и какую метрику выбрали (Sharpe, Sortino, Calmar), 2) где в команде человек с матстатом, 3) почему в описании проекта нет RAG-подхода к новостям. Без ответов проект не утвердим.',
      date: '13 марта 2026 в 13:00'
    }
  ]);

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