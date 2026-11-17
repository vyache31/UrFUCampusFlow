import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import EditableField from '../../components/common/EditableField/EditableField';
import { SaveIcon } from '../../components/common/Icons/Icons';
import { createCase } from '../../services/cases';
import CaseAssistantChat from '../../components/CaseAssistantChat/CaseAssistantChat';
import type { AICaseDraft } from '../../services/aiChats';
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
  const { showSuccess, showError, showConfirm } = useToast();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'submit', string>>>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleTransferFromChat = (draft: AICaseDraft) => {
    const fields: { key: keyof FormState; value: string | null }[] = [
      { key: 'title', value: draft.title },
      { key: 'shortTitle', value: draft.short_title },
      { key: 'description', value: draft.project_goals },
      { key: 'expectedResult', value: draft.required_result },
      { key: 'criteria', value: draft.grade_criteria },
    ];
    const updates: Partial<FormState> = {};
    for (const field of fields) {
      if (field.value !== null) updates[field.key] = field.value;
    }
    const transfer = () => {
      setForm(previous => ({ ...previous, ...updates }));
      setErrors(previous => {
        const next = { ...previous };
        for (const field of fields) {
          if (field.value !== null) delete next[field.key];
        }
        return next;
      });
      showSuccess('Черновик ИИ перенесён в форму');
    };
    const replacements = fields.filter(field =>
      field.value !== null && form[field.key].trim() && form[field.key] !== field.value
    );
    if (replacements.length) {
      showConfirm({
        message: `Заменить заполненные поля: ${replacements.map(field => FIELD_LABELS[field.key]).join(', ')}?`,
        confirmText: 'Перенести',
        onConfirm: transfer,
      });
    } else {
      transfer();
    }
  };

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

      <CaseAssistantChat onTransfer={handleTransferFromChat} />
    </div>
  );
};

export default CaseCreatePage;
