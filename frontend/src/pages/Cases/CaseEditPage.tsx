import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { getCaseById, updateCase } from '../../services/cases';
import { SaveIcon, DeleteIcon } from '../../components/common/Icons/Icons';
import { deleteCase } from '../../services/cases';
import './caseEditPage.css';

const CaseEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const titleRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const expectedResultRef = useRef<HTMLDivElement>(null);
  const criteriaRef = useRef<HTMLDivElement>(null);
  const shortTitleRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    shortTitle: '',
    description: '',
    expectedResult: '',
    criteria: '',
    semester: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchCase = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getCaseById(id);
        
        const semesterValue = data.status_id === 1 ? 'Осенний' : data.status_id === 2 ? 'Весенний' : '';
        
        const formValues = {
          title: data.title,
          shortTitle: data.short_title || '',
          description: data.project_goals || '',
          expectedResult: data.required_result || '',
          criteria: data.grade_criteria || '',
          semester: semesterValue
        };
        
        setFormData(formValues);
        
        if (titleRef.current) titleRef.current.innerText = formValues.title;
        if (shortTitleRef.current) shortTitleRef.current.innerText = formValues.shortTitle;
        if (descriptionRef.current) descriptionRef.current.innerText = formValues.description;
        if (expectedResultRef.current) expectedResultRef.current.innerText = formValues.expectedResult;
        if (criteriaRef.current) criteriaRef.current.innerText = formValues.criteria;
        
      } catch (error) {
        console.error('Ошибка загрузки кейса:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCase();
  }, [id]);

  const fieldLimits: Record<string, number> = {
    title: 100,
    shortTitle: 50,
    description: 2000,
    expectedResult: 1000,
    criteria: 2000,
  };

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

  useEffect(() => {
    if (!loading) {
      setupScrollableEditable(titleRef.current, 53);
      setupScrollableEditable(shortTitleRef.current, 53);
      setupScrollableEditable(descriptionRef.current, 116);
      setupScrollableEditable(expectedResultRef.current, 95);
      setupScrollableEditable(criteriaRef.current, 137);
    }
  }, [loading]);

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
      const text = element.innerText.trim();
      const isEmpty = text === '';
    
    if (isEmpty) {
      element.classList.add('empty');
    } else {
      element.classList.remove('empty');
    }
};

useEffect(() => {
  if (!loading) {
    const elements = [
      { ref: titleRef, field: 'title' },
      { ref: shortTitleRef, field: 'shortTitle' },
      { ref: descriptionRef, field: 'description' },
      { ref: expectedResultRef, field: 'expectedResult' },
      { ref: criteriaRef, field: 'criteria' },
    ];
    
    setTimeout(() => {
      elements.forEach(({ ref }) => {
        const el = ref.current;
        if (el) {
          updateEmptyClass(el);
        }
      });
    }, 50);
  }
}, [loading, formData]);

const handleSave = async () => {
  const newErrors: Record<string, string> = {};
  if (!formData.title.trim()) newErrors.title = 'Введите название кейса';
  if (!formData.description.trim()) newErrors.description = 'Введите описание кейса';
  if (!formData.expectedResult.trim()) newErrors.expectedResult = 'Введите предполагаемый результат';
  if (!formData.criteria.trim()) newErrors.criteria = 'Введите критерии оценки';
  if (!formData.semester) newErrors.semester = 'Выберите семестр';
  
  if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }
  
  try {
    setSaving(true);
    const currentCase = await getCaseById(id!);
    
    const caseForAPI = {
      title: formData.title,
      short_title: formData.shortTitle,
      difficulty_level_id: currentCase.difficulty_level_id || 1,
      project_goals: formData.description,
      required_result: formData.expectedResult,
      grade_criteria: formData.criteria,
      status_id: formData.semester === 'Осенний' ? 1 : 2,
      university_id: currentCase.university_id || 1,
      start_date: currentCase.start_date,
      end_date: currentCase.end_date,
      creator_id: currentCase.creator_id,
    };
    
    console.log('Отправляем на обновление:', caseForAPI);
    
    await updateCase(id!, caseForAPI);
    console.log('Кейс обновлён');
    navigate(`/cases/${id}`);
    } catch (error) {
      console.error('Ошибка обновления кейса:', error);
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: unknown } };
        console.log('Детали ошибки:', axiosError.response?.data);
        setErrors({ submit: 'Ошибка валидации. Проверьте поля.' });
      } else {
        setErrors({ submit: 'Не удалось обновить кейс' });
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Вы уверены, что хотите удалить этот кейс? Это действие необратимо.')) {
      try {
        await deleteCase(id!);
        console.log('Кейс удален:', id);
        navigate('/cases');
      } catch (error) {
        console.error('Ошибка удаления:', error);
        alert('Не удалось удалить кейс. Попробуйте позже.');
      }
    }
  };

  const breadcrumbItems = [
    { label: 'Главная', path: '/' },
    { label: 'Все кейсы', path: '/cases' },
    { label: 'Просмотр кейса', path: `/cases/${id}` },
    { label: 'Редактирование' },
  ];

  if (loading) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="loading-container">Загрузка...</div>
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
          <button className="save-btn" onClick={handleSave} disabled={saving}>
            <SaveIcon />
            <span>{saving ? 'Сохранение...' : 'Сохранить'}</span>
          </button>
        </div>
      </div>

      <div className="edit-form">
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

        <div className="form-field" data-field="shortTitle">
          <label className="form-label">Короткое название</label>
          <div
            ref={shortTitleRef}
            className="editable-box empty"
            contentEditable
            suppressContentEditableWarning
            onBeforeInput={(e) => handleBeforeInput(e, 'shortTitle')}
            onInput={() => handleContentChange('shortTitle', shortTitleRef.current)}
            data-placeholder="Введите короткое название (будет отображаться в карточке)"
          />
          {errors.shortTitle && <div className="error-message">{errors.shortTitle}</div>}
        </div>

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

        {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}
      </div>
    </div>
  );
};

export default CaseEditPage;