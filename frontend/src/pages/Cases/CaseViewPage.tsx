import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { testCases } from '../../data/cases';
import { EditIcon } from '../../components/common/Icons/Icons';
import './caseViewPage.css';

const CaseViewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const caseData = testCases.find(c => c.id === id);

  const handleEdit = () => {
    navigate(`/cases/${id}/edit`);
  };

  const breadcrumbItems = [
    { label: 'Главная', path: '/' },
    { label: 'Все кейсы', path: '/cases' },
    { label: 'Просмотр кейса' },
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
        <div className="info-block">
          <div className="info-label">Название кейса</div>
          <div className="info-value">{caseData.title}</div>
        </div>

        <div className="info-block">
          <div className="info-label">Описание кейса</div>
          <div className="info-value-description">{caseData.description}</div>
        </div>

        <div className="info-block">
          <div className="info-label">Организация заказчика</div>
          <div className="info-value">Альфа-Банк, Департамент малого и среднего бизнеса</div>
        </div>

        <div className="info-block">
          <div className="info-label">ФИО заказчика</div>
          <div className="info-value">Кузнецов Дмитрий Андреевич</div>
        </div>

        <div className="info-block">
          <div className="info-label">Предполагаемый результат</div>
          <div className="info-value-description">
            Прототип мобильного приложения (iOS/Android) с реализованной скоринговой моделью, 
            возможностью ввода данных по клиенту и формирования заключения о кредитном риске. 
            Результат должен включать техническую документацию и презентацию для руководства.
          </div>
        </div>

        <div className="info-block">
          <div className="info-label">Критерии оценки</div>
          <div className="criteria-list">
            1. Корректность работы скоринговой модели (точность предсказания — не менее 80% на тестовых данных).<br />
            2. Удобство интерфейса (время заполнения анкеты — не более 3 минут).<br />
            3. Стабильность работы в офлайн-режиме.<br />
            4. Полнота технической документации.<br />
            5. Качество презентации и защиты решения.
          </div>
        </div>

        <div className="info-block">
          <div className="info-label">Главный руководитель образовательной программы</div>
          <div className="info-value">Смирнова Елена Викторовна</div>
        </div>

        <div className="info-block">
          <div className="info-label">Образовательная программа</div>
          <div className="info-value">09.03.04/33.01 Программная инженерия</div>
        </div>

        <div className="info-block">
          <div className="info-label">Семестр</div>
          <div className="info-value">{caseData.semester || 'Весенний'}</div>
        </div>
      </div>
    </div>
  );
};

export default CaseViewPage;