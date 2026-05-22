import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { getCaseById, type Case } from '../../services/cases';
import { EditIcon } from '../../components/common/Icons/Icons';
import './caseViewPage.css';

const CaseViewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCase = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getCaseById(id);
        setCaseData(data);
      } catch (err) {
        console.error('Ошибка загрузки кейса:', err);
        setError('Кейс не найден');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCase();
  }, [id]);

  const handleEdit = () => {
    navigate(`/cases/${id}/edit`);
  };

  const breadcrumbItems = [
    { label: 'Главная', path: '/' },
    { label: 'Все кейсы', path: '/cases' },
    { label: 'Просмотр кейса' },
  ];

  const getSemesterName = (statusId?: number) => {
    return statusId === 1 ? 'Осенний' : statusId === 2 ? 'Весенний' : 'Не указан';
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="loading-container">Загрузка...</div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="not-found">{error || 'Кейс не найден'}</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper case-view-page">
      <Header />
      <Breadcrumb items={breadcrumbItems} />

      <div className="case-view-header">
        <h1 className="page-title">Просмотр кейса</h1>
        <button className="edit-btn" onClick={handleEdit}>
          <EditIcon />
          <span>Редактировать</span>
        </button>
      </div>

      <div className="case-content">
        {caseData.short_title && (
          <div className="info-block">
            <div className="info-label">Короткое название</div>
            <div className="info-value">{caseData.short_title}</div>
          </div>
        )}
        <div className="info-block">
          <div className="info-label">Название кейса</div>
          <div className="info-value">{caseData.title}</div>
        </div>

        <div className="info-block">
          <div className="info-label">Описание кейса</div>
          <div className="info-value-description">{caseData.project_goals || 'Не указано'}</div>
        </div>

        <div className="info-block">
          <div className="info-label">Предполагаемый результат</div>
          <div className="info-value-description">{caseData.required_result || 'Не указан'}</div>
        </div>

        <div className="info-block">
          <div className="info-label">Критерии оценки</div>
          <div className="info-value-description">{caseData.grade_criteria || 'Не указаны'}</div>
        </div>

        <div className="info-block">
          <div className="info-label">Семестр</div>
          <div className="info-value">{getSemesterName(caseData.status_id)}</div>
        </div>
      </div>
    </div>
  );
};

export default CaseViewPage;