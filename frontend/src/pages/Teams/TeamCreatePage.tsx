import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { SaveIcon, PlusIcon } from '../../components/common/Icons/Icons';
import AddMemberModal from '../../components/Modals/AddMemberModal';
import AddCaseModal from '../../components/Modals/AddCaseModal';
import { validateFormWithRules, teamValidationRules } from '../../utils/validation';
import './teamCreatePage.css';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  university: string;
  group: string;
}

interface TeamCase {
  id: string;
  title: string;
}

const TeamCreatePage = () => {
  const navigate = useNavigate();
  
  const nameRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    notes: '',
    status: 'Интервью'
  });

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [teamCases, setTeamCases] = useState<TeamCase[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);

  // Лимиты для полей
  const fieldLimits: Record<string, number> = {
    name: 100,
    description: 2000,
    notes: 500
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

  // Настройка скролла
  useEffect(() => {
    setupScrollableEditable(nameRef.current, 53);
    setupScrollableEditable(descriptionRef.current, 250);
    setupScrollableEditable(notesRef.current, 250);
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

  const handleStatusChange = (status: string) => {
    setFormData(prev => ({ ...prev, status }));
    if (errors.status) {
      setErrors(prev => ({ ...prev, status: '' }));
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
    const elements = [nameRef, descriptionRef, notesRef];
    elements.forEach(ref => {
      const el = ref.current;
      if (el) {
        el.addEventListener('input', () => updateEmptyClass(el));
        updateEmptyClass(el);
      }
    });
  }, []);

  const handleAddMember = (member: { name: string; role: string; university: string; group: string }) => {
    const newMember: TeamMember = {
      id: Date.now().toString(),
      ...member
    };
    setMembers([...members, newMember]);
  };

  const handleAddCase = (caseId: string, caseTitle: string) => {
    if (!teamCases.some(c => c.id === caseId)) {
      setTeamCases([...teamCases, { id: caseId, title: caseTitle }]);
    }
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
  };

  const handleRemoveCase = (id: string) => {
    setTeamCases(teamCases.filter(c => c.id !== id));
  };

  const handleSave = () => {
    const formDataToValidate = {
      name: formData.name,
      description: formData.description,
      status: formData.status
    };
    
    const { isValid, errors: validationErrors } = validateFormWithRules(formDataToValidate, teamValidationRules);
    
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
    console.log('Создана новая команда:', { ...formData, members, cases: teamCases });
    navigate('/teams');
  };

  const breadcrumbItems = [
    { label: 'Главная', path: '/' },
    { label: 'Все команды', path: '/teams' },
    { label: 'Создание команды' },
  ];

  const statusOptions = ['Интервью', 'Отказ', 'Работает над кейсом', 'Архив'];

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
        <div className="form-field" data-field="name">
          <label className="form-label">Название команды</label>
          <div
            ref={nameRef}
            className="editable-box empty"
            contentEditable
            suppressContentEditableWarning
            onBeforeInput={(e) => handleBeforeInput(e, 'name')}
            onInput={() => handleContentChange('name', nameRef.current)}
            data-placeholder="Введите название команды"
          />
          {errors.name && <div className="error-message">{errors.name}</div>}
        </div>

        {/* Описание команды */}
        <div className="form-field" data-field="description">
          <label className="form-label">Описание команды</label>
          <div
            ref={descriptionRef}
            className="editable-box description-box empty"
            contentEditable
            suppressContentEditableWarning
            onBeforeInput={(e) => handleBeforeInput(e, 'description')}
            onInput={() => handleContentChange('description', descriptionRef.current)}
            data-placeholder="Введите описание команды"
          />
          {errors.description && <div className="error-message">{errors.description}</div>}
        </div>

        {/* Участники */}
        <div className="form-field">
          <div className="field-header">
            <label className="form-label">Участники</label>
            <button className="add-btn" onClick={() => setIsMemberModalOpen(true)}>
              <PlusIcon />
              <span>Добавить участника</span>
            </button>
          </div>
          {members.length > 0 && (
            <div className="members-list">
              {members.map((member) => (
                <div key={member.id} className="member-item">
                  <div className="member-info">
                    <span className="member-name">{member.name}</span>
                    <span className="member-role">{member.role}</span>
                    <span className="member-university">{member.university}, {member.group}</span>
                  </div>
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Заметки */}
        <div className="form-field" data-field="notes">
          <label className="form-label">Заметки</label>
          <div
            ref={notesRef}
            className="editable-box notes-box empty"
            contentEditable
            suppressContentEditableWarning
            onBeforeInput={(e) => handleBeforeInput(e, 'notes')}
            onInput={() => handleContentChange('notes', notesRef.current)}
            data-placeholder="Введите заметки"
          />
          {errors.notes && <div className="error-message">{errors.notes}</div>}
        </div>

        {/* Кейсы */}
        <div className="form-field">
          <div className="field-header">
            <label className="form-label">Кейсы</label>
            <button className="add-btn" onClick={() => setIsCaseModalOpen(true)}>
              <PlusIcon />
              <span>Добавить кейс</span>
            </button>
          </div>
          {teamCases.length > 0 && (
            <div className="cases-list">
              {teamCases.map((teamCase) => (
                <div key={teamCase.id} className="case-item">
                  <span className="case-title">{teamCase.title}</span>
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveCase(teamCase.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Состояние команды */}
        <div className="form-field" data-field="status">
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
          {errors.status && <div className="error-message">{errors.status}</div>}
        </div>
      </div>

      {/* Модалки */}
      <AddMemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onAdd={handleAddMember}
      />
      
      <AddCaseModal
        isOpen={isCaseModalOpen}
        onClose={() => setIsCaseModalOpen(false)}
        onAdd={handleAddCase}
      />
    </div>
  );
};

export default TeamCreatePage;