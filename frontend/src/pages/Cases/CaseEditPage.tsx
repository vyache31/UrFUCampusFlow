import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import EditableField from '../../components/common/EditableField/EditableField';
import { SaveIcon, DeleteIcon } from '../../components/common/Icons/Icons';
import { getCaseById, updateCase, deleteCase } from '../../services/cases';
import { useToast } from '../../context/ToastContext';
import './caseEditPage.css';

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

const FIELD_LABELS: Record<keyof FormState, string> = {
  title: 'Название кейса',
  shortTitle: 'Короткое название',
  description: 'Описание кейса',
  expectedResult: 'Предполагаемый результат',
  criteria: 'Критерии оценки',
};

const FIELD_MAX_HEIGHTS: Record<keyof FormState, number> = {
  title: 53,
  shortTitle: 53,
  description: 116,
  expectedResult: 95,
  criteria: 137,
};

const CaseEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError, showConfirm } = useToast();

  const [form, setForm] = useState<FormState>({
    title: '', shortTitle: '', description: '', expectedResult: '', criteria: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'submit', string>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const data = await getCaseById(id);
        if (cancelled) return;
        setForm({
          title: data.title,
          shortTitle: data.short_title || '',
          description: data.project_goals || '',
          expectedResult: data.required_result || '',
          criteria: data.grade_criteria || '',
        });
      } catch (error) {
        console.error('Ошибка загрузки кейса:', error);
        showError('Не удалось загрузить кейс');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id, showError]);

  const updateField = (field: keyof FormState) => (value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = useCallback((): boolean => {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) nextErrors.title = 'Введите название кейса';
    if (!form.description.trim()) nextErrors.description = 'Введите описание кейса';
    if (!form.expectedResult.trim()) nextErrors.expectedResult = 'Введите предполагаемый результат';
    if (!form.criteria.trim()) nextErrors.criteria = 'Введите критерии оценки';
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [form]);

  const handleSave = async () => {
    if (!id || !validate()) return;
    try {
      setIsSaving(true);
      const current = await getCaseById(id);
      await updateCase(id, {
        title: form.title,
        short_title: form.shortTitle,
        difficulty_level_id: current.difficulty_level_id || 1,
        project_goals: form.description,
        required_result: form.expectedResult,
        grade_criteria: form.criteria,
        university_id: current.university_id || 1,
        start_date: current.start_date,
        end_date: current.end_date,
        creator_id: current.creator_id,
      });
      showSuccess('Кейс успешно обновлён');
      navigate(`/cases/${id}`);
    } catch (error) {
      console.error('Ошибка обновления кейса:', error);
      showError('Не удалось обновить кейс');
      setErrors({ submit: 'Не удалось обновить кейс' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    showConfirm({
      message: 'Вы уверены, что хотите удалить этот кейс? Это действие необратимо.',
      confirmText: 'Да',
      cancelText: 'Нет',
      onCancel: () => {},
      onConfirm: async () => {
        try {
          await deleteCase(id);
          showSuccess('Кейс успешно удалён');
          navigate('/cases');
        } catch (error) {
          console.error('Ошибка удаления:', error);
          showError('Не удалось удалить кейс');
        }
      },
    });
  };

  const breadcrumbItems = [
    { label: 'Главная', path: '/' },
    { label: 'Все кейсы', path: '/cases' },
    { label: 'Просмотр кейса', path: `/cases/${id}` },
    { label: 'Редактирование' },
  ];

  if (isLoading) {
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
          <button className="save-btn" onClick={handleSave} disabled={isSaving}>
            <SaveIcon />
            <span>{isSaving ? 'Сохранение...' : 'Сохранить'}</span>
          </button>
        </div>
      </div>

      <div className="edit-form">
        {(Object.keys(FIELD_LABELS) as Array<keyof FormState>).map(field => (
          <div key={field} className="form-field" data-field={field}>
            <label className="form-label">{FIELD_LABELS[field]}</label>
            <EditableField
              value={form[field]}
              onChange={updateField(field)}
              maxLength={FIELD_LIMITS[field]}
              maxHeight={FIELD_MAX_HEIGHTS[field]}
              className={field === 'criteria' ? 'criteria-box' : ''}
            />
            {errors[field] && <div className="error-message">{errors[field]}</div>}
          </div>
        ))}
        {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}
      </div>
    </div>
  );
};

export default CaseEditPage;