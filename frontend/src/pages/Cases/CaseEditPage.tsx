import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { getCaseById, updateCase } from '../../services/cases';
import { SaveIcon, DeleteIcon } from '../../components/common/Icons/Icons';
import { deleteCase } from '../../services/cases';
import { useToast } from '../../context/ToastContext';
import './caseEditPage.css';

const CaseEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError, showConfirm } = useToast();
  
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
    criteria: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Функция для обновления класса empty
  const updateEmptyClass = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    const text = element.innerText.trim();
    const isEmpty = text === '';
    
    if (isEmpty) {
      element.classList.add('empty');
    } else {
      element.classList.remove('empty');
    }
  }, []);

  // Функция для обновления содержимого contentEditable элементов
  const updateEditableContent = useCallback(() => {
    if (titleRef.current && titleRef.current.innerText !== formData.title) {
      titleRef.current.innerText = formData.title;
      updateEmptyClass(titleRef.current);
    }
    if (shortTitleRef.current && shortTitleRef.current.innerText !== formData.shortTitle) {
      shortTitleRef.current.innerText = formData.shortTitle;
      updateEmptyClass(shortTitleRef.current);
    }
    if (descriptionRef.current && descriptionRef.current.innerText !== formData.description) {
      descriptionRef.current.innerText = formData.description;
      updateEmptyClass(descriptionRef.current);
    }
    if (expectedResultRef.current && expectedResultRef.current.innerText !== formData.expectedResult) {
      expectedResultRef.current.innerText = formData.expectedResult;
      updateEmptyClass(expectedResultRef.current);
    }
    if (criteriaRef.current && criteriaRef.current.innerText !== formData.criteria) {
      criteriaRef.current.innerText = formData.criteria;
      updateEmptyClass(criteriaRef.current);
    }
  }, [formData.title, formData.shortTitle, formData.description, formData.expectedResult, formData.criteria, updateEmptyClass]);

  useEffect(() => {
    const fetchCase = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getCaseById(id);
        
        const formValues = {
          title: data.title,
          shortTitle: data.short_title || '',
          description: data.project_goals || '',
          expectedResult: data.required_result || '',
          criteria: data.grade_criteria || ''
        };
        
        setFormData(formValues);
        
        // Обновляем contentEditable элементы после установки состояния
        setTimeout(() => {
          if (titleRef.current) {
            titleRef.current.innerText = formValues.title;
            updateEmptyClass(titleRef.current);
          }
          if (shortTitleRef.current) {
            shortTitleRef.current.innerText = formValues.shortTitle;
            updateEmptyClass(shortTitleRef.current);
          }
          if (descriptionRef.current) {
            descriptionRef.current.innerText = formValues.description;
            updateEmptyClass(descriptionRef.current);
          }
          if (expectedResultRef.current) {
            expectedResultRef.current.innerText = formValues.expectedResult;
            updateEmptyClass(expectedResultRef.current);
          }
          if (criteriaRef.current) {
            criteriaRef.current.innerText = formValues.criteria;
            updateEmptyClass(criteriaRef.current);
          }
        }, 0);
        
      } catch (error) {
        console.error('Ошибка загрузки кейса:', error);
        showError('Не удалось загрузить кейс');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCase();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Следим за изменением formData и обновляем contentEditable
  useEffect(() => {
    if (!loading) {
      updateEditableContent();
    }
  }, [loading, updateEditableContent]);

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
    updateEmptyClass(element);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Введите название кейса';
    if (!formData.description.trim()) newErrors.description = 'Введите описание кейса';
    if (!formData.expectedResult.trim()) newErrors.expectedResult = 'Введите предполагаемый результат';
    if (!formData.criteria.trim()) newErrors.criteria = 'Введите критерии оценки';
    
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
        university_id: currentCase.university_id || 1,
        start_date: currentCase.start_date,
        end_date: currentCase.end_date,
        creator_id: currentCase.creator_id,
      };
      
      console.log('Отправляем на обновление:', caseForAPI);
      
      await updateCase(id!, caseForAPI);
      console.log('Кейс обновлён');
      showSuccess('Кейс успешно обновлён');
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
      showError('Не удалось обновить кейс');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
  showConfirm({
    message: 'Вы уверены, что хотите удалить этот кейс? Это действие необратимо.',
    onConfirm: async () => {
      try {
        await deleteCase(id!);
        console.log('Кейс удален:', id);
        showSuccess('Кейс успешно удалён');
        navigate('/cases');
      } catch (error: unknown) {
        console.error('Ошибка удаления:', error);
        const apiError = error as { response?: { data?: { detail?: string } } };
        const detail = apiError?.response?.data?.detail;
        if (detail && detail.includes('external links')) {
          showError('Нельзя удалить кейс, так как он используется в командах или имеет связанные данные');
        } else if (detail) {
          showError(detail);
        } else {
          showError('Не удалось удалить кейс');
        }
      }
    },
    onCancel: () => {},
    confirmText: 'Да',
    cancelText: 'Нет'
  });
};

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
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
            onBlur={() => handleContentChange('title', titleRef.current)}
            onPaste={handlePaste}
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
            onBlur={() => handleContentChange('shortTitle', shortTitleRef.current)}
            onPaste={handlePaste}
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
            onBlur={() => handleContentChange('description', descriptionRef.current)}
            onPaste={handlePaste}
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
            onBlur={() => handleContentChange('expectedResult', expectedResultRef.current)}
            onPaste={handlePaste}
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
            onBlur={() => handleContentChange('criteria', criteriaRef.current)}
            onPaste={handlePaste}
            data-placeholder="Введите критерии оценки"
          />
          {errors.criteria && <div className="error-message">{errors.criteria}</div>}
        </div>

        {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}
      </div>
    </div>
  );
};

export default CaseEditPage;