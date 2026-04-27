// src/pages/Teams/TeamCreatePage.tsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { SaveIcon, PlusIcon } from '../../components/common/Icons/Icons';
import { validateFormWithRules, teamValidationRules } from '../../utils/validation';
import './teamCreatePage.css';

interface TeamMember {
  id: string;
  name: string;
  email?: string;
}

const TeamCreatePage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    notes: '',
    status: 'Интервью'
  });
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [cases, setCases] = useState<string[]>([]);
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  
  const nameRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);

  const statusOptions = ['Интервью', 'Отказ', 'Работает над кейсом', 'Архив'];

  // Функция для ограничения высоты contenteditable элементов
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
    setupScrollableEditable(nameRef.current, 53.4);
    setupScrollableEditable(descriptionRef.current, 250);
    setupScrollableEditable(notesRef.current, 250);
  }, []);

  const validateField = (field: string, value: string): string => {
    const rules = teamValidationRules[field];
    if (!rules) return '';
    
    if (rules.required && !value.trim()) {
      return 'Поле обязательно для заполнения';
    }
    if (rules.minLength && value.trim().length > 0 && value.trim().length < rules.minLength) {
      return rules.errorMessage;
    }
    if (rules.maxLength && value.trim().length > rules.maxLength) {
      return rules.errorMessage;
    }
    return '';
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof typeof formData]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleContentChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    const element = document.querySelector(`[data-field="${field}"]`);
    if (element && value.trim() !== '') {
      element.classList.remove('empty');
    } else if (element && value.trim() === '') {
      element.classList.add('empty');
    }
    
    // Валидация при изменении
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleStatusChange = (status: string) => {
    setFormData(prev => ({ ...prev, status }));
    if (touched.status) {
      const error = validateField('status', status);
      setErrors(prev => ({ ...prev, status: error }));
    }
  };

  const handleAddMember = () => {
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: ''
    };
    setMembers([...members, newMember]);
  };

  const handleAddCase = () => {
    setCases([...cases, '']);
  };

  const handleSave = () => {
    // Отмечаем все поля как touched
    setTouched({ name: true, description: true, status: true });
    
    const formDataToValidate = {
      name: formData.name,
      description: formData.description,
      status: formData.status
    };
    
    const { isValid, errors: validationErrors } = validateFormWithRules(formDataToValidate, teamValidationRules);
    setErrors(validationErrors);
    
    if (isValid) {
      console.log('Создана новая команда:', { ...formData, members, cases });
      navigate('/teams');
    }
  };

  const breadcrumbItems = [
    { label: 'Главная', path: '/' },
    { label: 'Все команды', path: '/teams' },
    { label: 'Создание команды' },
  ];

  return (
    <div className="page-wrapper team-create-page">
      <Header />
      <Breadcrumb items={breadcrumbItems} />

      <div className="create-header">
        <h1 className="page-title">Создание команды</h1>
        <button className="save-btn" onClick={handleSave}>
          <SaveIcon />
          <span>Сохранить</span>
        </button>
      </div>

      <div className="create-form">
        {/* Название команды */}
        <div className="form-field">
          <label className="form-label">Название команды</label>
          <div
            ref={nameRef}
            className={`editable-box empty ${touched.name && errors.name ? 'error' : ''}`}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => handleContentChange('name', e.currentTarget.innerText)}
            onBlur={() => handleBlur('name')}
            data-placeholder="Введите название команды"
            data-field="name"
          >
          </div>
          {touched.name && errors.name && (
            <span className="error-message">{errors.name}</span>
          )}
        </div>

        {/* Описание команды */}
        <div className="form-field">
          <label className="form-label">Описание команды</label>
          <div
            ref={descriptionRef}
            className={`editable-box description-box empty ${touched.description && errors.description ? 'error' : ''}`}
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => handleContentChange('description', e.currentTarget.innerText)}
            onBlur={() => handleBlur('description')}
            data-placeholder="Введите описание команды"
            data-field="description"
          >
          </div>
          {touched.description && errors.description && (
            <span className="error-message">{errors.description}</span>
          )}
        </div>

        {/* Участники */}
        <div className="form-field">
          <div className="field-header">
            <label className="form-label">Участники</label>
            <button className="add-btn" onClick={handleAddMember}>
              <PlusIcon />
              <span>Добавить участника</span>
            </button>
          </div>
          {members.length > 0 && (
            <div className="members-list">
              {members.map((member) => (
                <div key={member.id} className="member-item">
                  <input
                    type="text"
                    className="member-input"
                    value={member.name}
                    onChange={(e) => {
                      setMembers(members.map(m => 
                        m.id === member.id ? { ...m, name: e.target.value } : m
                      ));
                    }}
                    placeholder="ФИО участника"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Заметки */}
        <div className="form-field">
          <label className="form-label">Заметки</label>
          <div
            ref={notesRef}
            className="editable-box notes-box empty"
            contentEditable
            suppressContentEditableWarning
            onInput={(e) => handleContentChange('notes', e.currentTarget.innerText)}
            data-placeholder="Введите заметки"
            data-field="notes"
          >
          </div>
        </div>

        {/* Кейсы */}
        <div className="form-field">
          <div className="field-header">
            <label className="form-label">Кейсы</label>
            <button className="add-btn" onClick={handleAddCase}>
              <PlusIcon />
              <span>Добавить кейс</span>
            </button>
          </div>
          {cases.length > 0 && (
            <div className="cases-list">
              {cases.map((_, index) => (
                <div key={index} className="case-item">
                  <input
                    type="text"
                    className="case-input"
                    placeholder="Выберите кейс"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Состояние команды */}
        <div className="form-field">
          <label className="form-label">Состояние команды</label>
          <div className="status-options">
            {statusOptions.map((option) => (
              <button
                key={option}
                className={`status-option ${formData.status === option ? 'active' : ''}`}
                onClick={() => handleStatusChange(option)}
              >
                <span className="status-dot"></span>
                <span>{option}</span>
              </button>
            ))}
          </div>
          {touched.status && errors.status && (
            <span className="error-message">{errors.status}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamCreatePage;