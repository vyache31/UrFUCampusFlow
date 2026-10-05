import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import EditableField from '../../components/common/EditableField/EditableField';
import { SaveIcon, GenerateIcon } from '../../components/common/Icons/Icons';
import { createCase } from '../../services/cases';
import { generateWithAI } from '../../services/ai';
import GenerationLoader from '../../components/GenerationLoader/GenerationLoader';
import { useToast } from '../../context/ToastContext';
import './caseCreatePage.css';

interface FormState {
  title: string;
  shortTitle: string;
  description: string;
  expectedResult: string;
  criteria: string;
}

const FIELD_LIMITS: Record<keyof FormState, number> = {
  title: 100,
  shortTitle: 50,
  description: 2000,
  expectedResult: 1000,
  criteria: 2000,
};

const FIELD_PLACEHOLDERS: Record<keyof FormState, string> = {
  title: 'Введите название кейса',
  shortTitle: 'Введите короткое название (будет отображаться в карточке)',
  description: 'Введите описание кейса',
  expectedResult: 'Введите предполагаемый результат',
  criteria: 'Введите критерии оценки',
};

const FIELD_LABELS: Record<keyof FormState, string> = {
  title: 'Название кейса',
  shortTitle: 'Короткое название',
  description: 'Описание кейса',
  expectedResult: 'Предполагаемый результат',
  criteria: 'Критерии оценки',
};

const INITIAL_FORM: FormState = {
  title: '',
  shortTitle: '',
  description: '',
  expectedResult: '',
  criteria: '',
};

const CaseCreatePage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'submit', string>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const updateField = (field: keyof FormState) => (value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) nextErrors.title = 'Введите название кейса';
    if (!form.description.trim()) nextErrors.description = 'Введите описание кейса';
    if (!form.expectedResult.trim()) nextErrors.expectedResult = 'Введите предполагаемый результат';
    if (!form.criteria.trim()) nextErrors.criteria = 'Введите критерии оценки';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      setIsSaving(true);
      await createCase({
        title: form.title,
        short_title: form.shortTitle,
        project_goals: form.description,
        required_result: form.expectedResult,
        grade_criteria: form.criteria,
        difficulty_level_id: 1,
        university_id: 1,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        creator_id: localStorage.getItem('user_id') ?? '',
      });
      showSuccess('Кейс успешно создан!');
      navigate('/cases');
    } catch (error) {
      console.error('Ошибка создания кейса:', error);
      showError('Не удалось создать кейс');
      setErrors({ submit: 'Не удалось создать кейс' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const creatorId = localStorage.getItem('user_id') ?? '';
      const tempCase = await createCase({
        title: 'Генерация кейса',
        project_goals: 'Требуется генерация',
        difficulty_level_id: 1,
        university_id: 1,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        creator_id: creatorId,
      });

      const generated = await generateWithAI(tempCase.id);
      const shortTitle = generated.project_description.slice(0, 50);
      const fullTitle = generated.project_description.slice(0, 100);

      setForm({
        title: fullTitle,
        shortTitle,
        description: generated.project_description,
        expectedResult: generated.project_idea,
        criteria: generated.technical_details,
      });

      const { deleteCase } = await import('../../services/cases');
      await deleteCase(tempCase.id);
      showSuccess('Кейс успешно сгенерирован! Отредактируйте и сохраните.');
    } catch (error) {
      console.error('Ошибка генерации:', error);
      showError('Не удалось сгенерировать кейс');
    } finally {
      setIsGenerating(false);
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
          <button className="generate-btn" onClick={handleGenerate} disabled={isGenerating}>
            <GenerateIcon />
            <span>{isGenerating ? 'Генерация...' : 'Сгенерировать'}</span>
          </button>
          <button className="save-btn" onClick={handleSave} disabled={isSaving}>
            <SaveIcon />
            <span>{isSaving ? 'Сохранение...' : 'Сохранить'}</span>
          </button>
        </div>
      </div>

      <div className="create-form">
        {(Object.keys(FIELD_LABELS) as Array<keyof FormState>).map(field => (
          <div key={field} className="form-field" data-field={field}>
            <label className="form-label">{FIELD_LABELS[field]}</label>
            <EditableField
              value={form[field]}
              onChange={updateField(field)}
              placeholder={FIELD_PLACEHOLDERS[field]}
              maxLength={FIELD_LIMITS[field]}
              maxHeight={
                field === 'description' ? 116
                : field === 'expectedResult' ? 95
                : field === 'criteria' ? 137
                : 53
              }
              className={field === 'criteria' ? 'criteria-box' : ''}
            />
            {errors[field] && <div className="error-message">{errors[field]}</div>}
          </div>
        ))}
        {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}
      </div>

      {isGenerating && <GenerationLoader />}
    </div>
  );
};

export default CaseCreatePage;