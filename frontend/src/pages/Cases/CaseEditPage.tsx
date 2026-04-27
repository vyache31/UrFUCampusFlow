import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import EditableField from '../../components/common/EditableField/EditableField';
import { testCases } from '../../data/cases';
import { SaveIcon, DeleteIcon } from '../../components/common/Icons/Icons';
import { validateForm } from '../../utils/validation';
import './caseEditPage.css';

const CaseEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const caseData = testCases.find(c => c.id === id);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    customerOrg: 'Альфа-Банк, Департамент малого и среднего бизнеса',
    customerName: 'Кузнецов Дмитрий Андреевич',
    expectedResult: 'Прототип мобильного приложения (iOS/Android) с реализованной скоринговой моделью, возможностью ввода данных по клиенту и формирования заключения о кредитном риске. Результат должен включать техническую документацию и презентацию для руководства.',
    criteria: '1. Корректность работы скоринговой модели (точность предсказания — не менее 80% на тестовых данных).\n2. Удобство интерфейса (время заполнения анкеты — не более 3 минут).\n3. Стабильность работы в офлайн-режиме.\n4. Полнота технической документации.\n5. Качество презентации и защиты решения.',
    programHead: 'Смирнова Елена Викторовна',
    educationProgram: '09.03.04/33.01 Программная инженерия',
    semester: 'Весенний'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const limits = {
    title: 100,
    description: 2000,
    customerOrg: 200,
    customerName: 100,
    expectedResult: 1000,
    criteria: 2000,
    programHead: 100,
    educationProgram: 150
  };

  const fieldHeights = {
    title: 53,
    description: 116,
    customerOrg: 53,
    customerName: 53,
    expectedResult: 95,
    criteria: 137,
    programHead: 53,
    educationProgram: 53
  };

  useEffect(() => {
    if (caseData) {
      let semesterValue = 'Весенний';
      if (caseData.semester) {
        if (caseData.semester.includes('Осень')) {
          semesterValue = 'Осенний';
        } else if (caseData.semester.includes('Весна')) {
          semesterValue = 'Весенний';
        }
      }
      
      setFormData(prev => ({
        ...prev,
        title: caseData.title,
        description: caseData.description,
        semester: semesterValue
      }));
    }
  }, [caseData]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSemesterChange = (newSemester: string) => {
    setFormData(prev => ({ ...prev, semester: newSemester }));
    if (errors.semester) {
      setErrors(prev => ({ ...prev, semester: '' }));
    }
  };

  const handleSave = () => {
    const { isValid, errors: validationErrors } = validateForm(formData);
    
    if (!isValid) {
      setErrors(validationErrors);
      const firstErrorField = Object.keys(validationErrors)[0];
      const errorElement = document.querySelector(`[data-field="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setErrors({});
    console.log('Сохраненные данные:', formData);
    navigate(`/cases/${id}`);
  };

  const handleDelete = () => {
    if (window.confirm('Вы уверены, что хотите удалить этот кейс?')) {
      console.log('Удален кейс:', id);
      navigate('/cases');
    }
  };

  const breadcrumbItems = [
    { label: 'Главная', path: '/' },
    { label: 'Все кейсы', path: '/cases' },
    { label: 'Просмотр кейса', path: `/cases/${id}` },
    { label: 'Редактирование' },
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
    <div className="page-wrapper case-edit-page">
      <Header />
      <Breadcrumb items={breadcrumbItems} />

      <div className="edit-header">
        <h1 className="page-title">Редактирование кейса</h1>
        <div className="edit-actions">
          <button className="delete-btn" onClick={handleDelete}>
            <DeleteIcon />
            <span>Удалить</span>
          </button>
          <button className="save-btn" onClick={handleSave}>
            <SaveIcon />
            <span>Сохранить</span>
          </button>
        </div>
      </div>

      <div className="edit-form">
        <div className="form-field" data-field="title">
          <label className="form-label">Название кейса</label>
          <EditableField
            value={formData.title}
            onChange={(v) => handleFieldChange('title', v)}
            maxLength={limits.title}
            maxHeight={fieldHeights.title}
          />
          {errors.title && <div className="error-message">{errors.title}</div>}
        </div>

        <div className="form-field" data-field="description">
          <label className="form-label">Описание кейса</label>
          <EditableField
            value={formData.description}
            onChange={(v) => handleFieldChange('description', v)}
            maxLength={limits.description}
            maxHeight={fieldHeights.description}
          />
          {errors.description && <div className="error-message">{errors.description}</div>}
        </div>

        <div className="form-field" data-field="customerOrg">
          <label className="form-label">Организация заказчика</label>
          <EditableField
            value={formData.customerOrg}
            onChange={(v) => handleFieldChange('customerOrg', v)}
            maxLength={limits.customerOrg}
            maxHeight={fieldHeights.customerOrg}
          />
          {errors.customerOrg && <div className="error-message">{errors.customerOrg}</div>}
        </div>

        <div className="form-field" data-field="customerName">
          <label className="form-label">ФИО заказчика</label>
          <EditableField
            value={formData.customerName}
            onChange={(v) => handleFieldChange('customerName', v)}
            maxLength={limits.customerName}
            maxHeight={fieldHeights.customerName}
          />
          {errors.customerName && <div className="error-message">{errors.customerName}</div>}
        </div>

        <div className="form-field" data-field="expectedResult">
          <label className="form-label">Предполагаемый результат</label>
          <EditableField
            value={formData.expectedResult}
            onChange={(v) => handleFieldChange('expectedResult', v)}
            maxLength={limits.expectedResult}
            maxHeight={fieldHeights.expectedResult}
          />
          {errors.expectedResult && <div className="error-message">{errors.expectedResult}</div>}
        </div>

        <div className="form-field" data-field="criteria">
          <label className="form-label">Критерии оценки</label>
          <EditableField
            value={formData.criteria}
            onChange={(v) => handleFieldChange('criteria', v)}
            maxLength={limits.criteria}
            maxHeight={fieldHeights.criteria}
          />
          {errors.criteria && <div className="error-message">{errors.criteria}</div>}
        </div>

        <div className="form-field" data-field="programHead">
          <label className="form-label">Главный руководитель образовательной программы</label>
          <EditableField
            value={formData.programHead}
            onChange={(v) => handleFieldChange('programHead', v)}
            maxLength={limits.programHead}
            maxHeight={fieldHeights.programHead}
          />
          {errors.programHead && <div className="error-message">{errors.programHead}</div>}
        </div>

        <div className="form-field" data-field="educationProgram">
          <label className="form-label">Образовательная программа</label>
          <EditableField
            value={formData.educationProgram}
            onChange={(v) => handleFieldChange('educationProgram', v)}
            maxLength={limits.educationProgram}
            maxHeight={fieldHeights.educationProgram}
          />
          {errors.educationProgram && <div className="error-message">{errors.educationProgram}</div>}
        </div>

        {/* Семестр */}
        <div className="form-field form-field-row" data-field="semester">
          <label className="form-label">Семестр</label>
          <div className="semester-wrapper">
            <div className="semester-toggle">
              <button
                className={`semester-option ${formData.semester === 'Осенний' ? 'active' : ''}`}
                onClick={() => handleSemesterChange('Осенний')}
              >
                Осенний
              </button>
              <button
                className={`semester-option ${formData.semester === 'Весенний' ? 'active' : ''}`}
                onClick={() => handleSemesterChange('Весенний')}
              >
                Весенний
              </button>
            </div>
            {errors.semester && <div className="error-message semester-error">{errors.semester}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseEditPage;