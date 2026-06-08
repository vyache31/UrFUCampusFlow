import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { SaveIcon, GenerateIcon } from '../../components/common/Icons/Icons';
import { createCase, deleteCase } from '../../services/cases';
import { generateWithAI } from '../../services/ai';
import GenerationLoader from '../../components/GenerationLoader/GenerationLoader';
import { useToast } from '../../context/ToastContext';
import './caseCreatePage.css';

const CaseCreatePage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  const titleRef = useRef<HTMLDivElement>(null);
  const shortTitleRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const expectedResultRef = useRef<HTMLDivElement>(null);
  const criteriaRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    shortTitle: '',
    description: '',
    expectedResult: '',
    criteria: ''
  });

  const [saving, setSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [tempCaseId, setTempCaseId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    setupScrollableEditable(titleRef.current, 53);
    setupScrollableEditable(shortTitleRef.current, 53); 
    setupScrollableEditable(descriptionRef.current, 116);
    setupScrollableEditable(expectedResultRef.current, 95);
    setupScrollableEditable(criteriaRef.current, 137);
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

  const updateEmptyClass = (element: HTMLDivElement | null) => {
    if (!element) return;
    const isEmpty = element.innerText.trim() === '';
    if (isEmpty) {
      element.classList.add('empty');
    } else {
      element.classList.remove('empty');
    }
  };

  useEffect(() => {
    const elements = [titleRef, shortTitleRef, descriptionRef, expectedResultRef, criteriaRef];
    elements.forEach(ref => {
      const el = ref.current;
      if (el) {
        el.addEventListener('input', () => updateEmptyClass(el));
        updateEmptyClass(el);
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      if (tempCaseId) {
        deleteCase(tempCaseId).catch(console.error);
      }
    };
  }, [tempCaseId]);

  const setEditableContent = (ref: React.RefObject<HTMLDivElement | null>, text: string) => {
    if (ref.current) {
      ref.current.innerText = text;
      updateEmptyClass(ref.current);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    
    try {
      const creator_id = localStorage.getItem('user_id') || 'b494bae1-fddf-4adc-a04e-fed2e4de25ea';
      
      const tempCase = await createCase({
        title: "Генерация кейса",
        project_goals: "Требуется генерация",
        difficulty_level_id: 1,
        university_id: 1,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        creator_id: creator_id,
      });
      
      setTempCaseId(tempCase.id);
      
      const generated = await generateWithAI(tempCase.id);
      
      const shortTitle = generated.project_description.slice(0, 50);
      const fullTitle = generated.project_description.slice(0, 100);
      
      const newFormData = {
        title: fullTitle,
        shortTitle: shortTitle,
        description: generated.project_description,
        expectedResult: generated.project_idea,
        criteria: generated.technical_details,
      };
      
      setFormData(newFormData);
      
      setEditableContent(titleRef, fullTitle);
      setEditableContent(shortTitleRef, shortTitle);
      setEditableContent(descriptionRef, generated.project_description);
      setEditableContent(expectedResultRef, generated.project_idea);
      setEditableContent(criteriaRef, generated.technical_details);
      
      await deleteCase(tempCase.id);
      setTempCaseId(null);
      
      showSuccess('Кейс успешно сгенерирован! Вы можете отредактировать и сохранить.');
      
    } catch (error) {
      console.error('Ошибка генерации:', error);
      showError('Не удалось сгенерировать кейс. Попробуйте позже.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
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
      
      const creator_id = localStorage.getItem('user_id') || 'b494bae1-fddf-4adc-a04e-fed2e4de25ea';
      
      const caseForAPI = {
        title: formData.title,
        short_title: formData.shortTitle,
        project_goals: formData.description,
        required_result: formData.expectedResult,
        grade_criteria: formData.criteria,
        difficulty_level_id: 1,
        university_id: 1,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        creator_id: creator_id,
      };
      
      await createCase(caseForAPI);
      showSuccess('Кейс успешно создан!');
      navigate('/cases');
    } catch (error) {
      console.error('Ошибка создания кейса:', error);
      showError('Не удалось создать кейс. Попробуйте позже.');
      setErrors({ submit: 'Не удалось создать кейс' });
    } finally {
      setSaving(false);
    }
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
          <button 
            className="generate-btn" 
            onClick={handleGenerate} 
            disabled={isGenerating}
          >
            <GenerateIcon />
            <span>{isGenerating ? 'Генерация...' : 'Сгенерировать'}</span>
          </button>
          <button className="save-btn" onClick={handleSave} disabled={saving}>
            <SaveIcon />
            <span>{saving ? 'Сохранение...' : 'Сохранить'}</span>
          </button>
        </div>
      </div>

      <div className="create-form">
        <div className="form-field" data-field="title">
          <label className="form-label">Название кейса</label>
          <div
            ref={titleRef}
            className="editable-box empty"
            contentEditable
            suppressContentEditableWarning
            onBeforeInput={(e) => handleBeforeInput(e, 'title')}
            onInput={() => handleContentChange('title', titleRef.current)}
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
            onPaste={handlePaste}
            data-placeholder="Введите короткое название (будет отображаться в карточке)"
          />
          {errors.shortTitle && <div className="error-message">{errors.shortTitle}</div>}
        </div>

        <div className="form-field" data-field="description">
          <label className="form-label">Описание кейса</label>
          <div
            ref={descriptionRef}
            className="editable-box description-box empty"
            contentEditable
            suppressContentEditableWarning
            onBeforeInput={(e) => handleBeforeInput(e, 'description')}
            onInput={() => handleContentChange('description', descriptionRef.current)}
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
            onPaste={handlePaste}
            data-placeholder="Введите критерии оценки"
          />
          {errors.criteria && <div className="error-message">{errors.criteria}</div>}
        </div>

        {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}
      </div>

      {isGenerating && <GenerationLoader />}
    </div>
  );
};

export default CaseCreatePage;