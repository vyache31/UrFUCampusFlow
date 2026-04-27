// src/pages/Cases/CaseCreatePage.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { SaveIcon, GenerateIcon } from '../../components/common/Icons/Icons';
import { validateForm } from '../../utils/validation';
import './caseCreatePage.css';

const CaseCreatePage = () => {
  const navigate = useNavigate();
  
  // Refs для contentEditable элементов
  const titleRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const customerOrgRef = useRef<HTMLDivElement>(null);
  const customerNameRef = useRef<HTMLDivElement>(null);
  const expectedResultRef = useRef<HTMLDivElement>(null);
  const criteriaRef = useRef<HTMLDivElement>(null);
  const programHeadRef = useRef<HTMLDivElement>(null);
  const educationProgramRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    customerOrg: '',
    customerName: '',
    expectedResult: '',
    criteria: '',
    programHead: '',
    educationProgram: '',
    semester: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Лимиты для полей
  const fieldLimits: Record<string, number> = {
    title: 100,
    description: 2000,
    customerOrg: 200,
    customerName: 100,
    expectedResult: 1000,
    criteria: 2000,
    programHead: 100,
    educationProgram: 150
  };

  // Функция для ограничения высоты
  const setupScrollableEditable = (element: HTMLDivElement | null, maxHeight: number) => {
    if (!element) return;
    
    const checkHeight = () => {
      const scrollHeight = element.scrollHeight;
      
      if (scrollHeight > maxHeight) {
        element.style.maxHeight = maxHeight + 'px';
        element.style.overflowY = 'auto';
        element.classList.add('with-scroll');
      } else {
        element.style.maxHeight = 'none';
        element.style.overflowY = 'visible';
        element.classList.remove('with-scroll');
      }
    };
    
    element.addEventListener('input', checkHeight);
    element.addEventListener('paste', () => setTimeout(checkHeight, 10));
    element.addEventListener('keydown', () => setTimeout(checkHeight, 10));
    
    const observer = new MutationObserver(checkHeight);
    observer.observe(element, { childList: true, subtree: true, characterData: true });
    
    setTimeout(checkHeight, 100);
  };

  // Настройка скролла
  useEffect(() => {
    setupScrollableEditable(titleRef.current, 53);
    setupScrollableEditable(descriptionRef.current, 116);
    setupScrollableEditable(customerOrgRef.current, 53);
    setupScrollableEditable(customerNameRef.current, 53);
    setupScrollableEditable(expectedResultRef.current, 95);
    setupScrollableEditable(criteriaRef.current, 137);
    setupScrollableEditable(programHeadRef.current, 53);
    setupScrollableEditable(educationProgramRef.current, 53);
  }, []);

  const handleBeforeInput = (e: React.FormEvent<HTMLDivElement>, field: string) => {
    const target = e.currentTarget;
    const maxLength = fieldLimits[field];
    if (!maxLength) return;
    
    const currentLength = target.innerText.length;
    const inputEvent = e.nativeEvent as InputEvent;
    const insertedText = inputEvent.data || '';
    
    if (currentLength + insertedText.length > maxLength) {
      e.preventDefault();
      setErrors(prev => ({ ...prev, [field]: `Максимум ${maxLength} символов` }));
    } else if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleContentChange = (field: string, element: HTMLDivElement | null) => {
    if (!element) return;
    const value = element.innerText;
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

  const updateEmptyClass = (element: HTMLDivElement | null) => {
    if (!element) return;
    const isEmpty = element.innerText.trim() === '';
    if (isEmpty) {
      element.classList.add('empty');
    } else {
      element.classList.remove('empty');
    }
  };

  // Дополнительный эффект для отслеживания empty
  useEffect(() => {
    const elements = [titleRef, descriptionRef, customerOrgRef, customerNameRef, expectedResultRef, criteriaRef, programHeadRef, educationProgramRef];
    elements.forEach(ref => {
      const el = ref.current;
      if (el) {
        el.addEventListener('input', () => updateEmptyClass(el));
        updateEmptyClass(el);
      }
    });
  }, []);

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
    console.log('Создан новый кейс:', formData);
    navigate('/cases');
  };

  const handleGenerate = () => {
    console.log('Генерация кейса с помощью AI');
  };

  const breadcrumbItems = [
    { label: 'Главная', path: '/' },
    { label: 'Все кейсы', path: '/cases' },
    { label: 'Создание кейса' },
  ];

  return (
    <div className="page-wrapper case-create-page">
      <Header />
      <Breadcrumb items={breadcrumbItems} />

      <div className="create-header">
        <h1 className="page-title">Создание кейса</h1>
        <div className="create-actions">
          <button className="generate-btn" onClick={handleGenerate}>
            <GenerateIcon />
            <span>Сгенерировать</span>
          </button>
          <button className="save-btn" onClick={handleSave}>
            <SaveIcon />
            <span>Сохранить</span>
          </button>
        </div>
      </div>

      <div className="create-form">
        {/* Название кейса */}
        <div className="form-field" data-field="title">
          <label className="form-label">Название кейса</label>
          <div
            ref={titleRef}
            className="editable-box empty"
            contentEditable
            suppressContentEditableWarning
            onBeforeInput={(e) => handleBeforeInput(e, 'title')}
            onInput={() => handleContentChange('title', titleRef.current)}
            data-placeholder="Введите название кейса"
          />
          {errors.title && <div className="error-message">{errors.title}</div>}
        </div>

        {/* Описание кейса */}
        <div className="form-field" data-field="description">
          <label className="form-label">Описание кейса</label>
          <div
            ref={descriptionRef}
            className="editable-box empty"
            contentEditable
            suppressContentEditableWarning
            onBeforeInput={(e) => handleBeforeInput(e, 'description')}
            onInput={() => handleContentChange('description', descriptionRef.current)}
            data-placeholder="Введите описание кейса"
          />
          {errors.description && <div className="error-message">{errors.description}</div>}
        </div>

        {/* Организация заказчика */}
        <div className="form-field" data-field="customerOrg">
          <label className="form-label">Организация заказчика</label>
          <div
            ref={customerOrgRef}
            className="editable-box empty"
            contentEditable
            suppressContentEditableWarning
            onBeforeInput={(e) => handleBeforeInput(e, 'customerOrg')}
            onInput={() => handleContentChange('customerOrg', customerOrgRef.current)}
            data-placeholder="Введите организацию заказчика"
          />
          {errors.customerOrg && <div className="error-message">{errors.customerOrg}</div>}
        </div>

        {/* ФИО заказчика */}
        <div className="form-field" data-field="customerName">
          <label className="form-label">ФИО заказчика</label>
          <div
            ref={customerNameRef}
            className="editable-box empty"
            contentEditable
            suppressContentEditableWarning
            onBeforeInput={(e) => handleBeforeInput(e, 'customerName')}
            onInput={() => handleContentChange('customerName', customerNameRef.current)}
            data-placeholder="Введите ФИО заказчика"
          />
          {errors.customerName && <div className="error-message">{errors.customerName}</div>}
        </div>

        {/* Предполагаемый результат */}
        <div className="form-field" data-field="expectedResult">
          <label className="form-label">Предполагаемый результат</label>
          <div
            ref={expectedResultRef}
            className="editable-box empty"
            contentEditable
            suppressContentEditableWarning
            onBeforeInput={(e) => handleBeforeInput(e, 'expectedResult')}
            onInput={() => handleContentChange('expectedResult', expectedResultRef.current)}
            data-placeholder="Введите предполагаемый результат"
          />
          {errors.expectedResult && <div className="error-message">{errors.expectedResult}</div>}
        </div>

        {/* Критерии оценки */}
        <div className="form-field" data-field="criteria">
          <label className="form-label">Критерии оценки</label>
          <div
            ref={criteriaRef}
            className="editable-box criteria-box empty"
            contentEditable
            suppressContentEditableWarning
            onBeforeInput={(e) => handleBeforeInput(e, 'criteria')}
            onInput={() => handleContentChange('criteria', criteriaRef.current)}
            data-placeholder="Введите критерии оценки"
          />
          {errors.criteria && <div className="error-message">{errors.criteria}</div>}
        </div>

        {/* Главный руководитель */}
        <div className="form-field" data-field="programHead">
          <label className="form-label">Главный руководитель образовательной программы</label>
          <div
            ref={programHeadRef}
            className="editable-box empty"
            contentEditable
            suppressContentEditableWarning
            onBeforeInput={(e) => handleBeforeInput(e, 'programHead')}
            onInput={() => handleContentChange('programHead', programHeadRef.current)}
            data-placeholder="Введите ФИО руководителя"
          />
          {errors.programHead && <div className="error-message">{errors.programHead}</div>}
        </div>

        {/* Образовательная программа */}
        <div className="form-field" data-field="educationProgram">
          <label className="form-label">Образовательная программа</label>
          <div
            ref={educationProgramRef}
            className="editable-box empty"
            contentEditable
            suppressContentEditableWarning
            onBeforeInput={(e) => handleBeforeInput(e, 'educationProgram')}
            onInput={() => handleContentChange('educationProgram', educationProgramRef.current)}
            data-placeholder="Введите образовательную программу"
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

export default CaseCreatePage;