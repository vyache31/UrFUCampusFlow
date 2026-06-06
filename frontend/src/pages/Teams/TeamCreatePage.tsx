import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { SaveIcon, PlusIcon } from '../../components/common/Icons/Icons';
import AddMemberModal from '../../components/Modals/AddMemberModal';
import AddCaseModal from '../../components/Modals/AddCaseModal';
import AddCuratorModal from '../../components/Modals/AddCuratorModal';
import { createTeam } from '../../services/teams';
import { addTeamMember } from '../../services/teamMembers';
import { assignCaseToTeam } from '../../services/teamCaseHistory';
import { assignCuratorToTeam, getAllCurators } from '../../services/curators';
import './teamCreatePage.css';

interface TeamMember {
  tempId: string;
  studentId: string;
  name: string;
  role: string;
  group: string;
  shortId?: string;
}

interface TeamCase {
  caseSemesterId: string;
  title: string;
}

interface AssignedCurator {
  id: string;
  curatorId: string;
  email: string;
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
  const [teamCase, setTeamCase] = useState<TeamCase | null>(null);
  const [curators, setCurators] = useState<AssignedCurator[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isCuratorModalOpen, setIsCuratorModalOpen] = useState(false);
  const [availableCurators, setAvailableCurators] = useState<{ id: string; email: string }[]>([]);

  useEffect(() => {
    const fetchCurators = async () => {
      const curatorsList = await getAllCurators();
      setAvailableCurators(curatorsList);
    };
    fetchCurators();
  }, []);

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
    setupScrollableEditable(nameRef.current, 53);
    setupScrollableEditable(descriptionRef.current, 250);
    setupScrollableEditable(notesRef.current, 250);
  }, []);

  const handleBeforeInput = (e: React.FormEvent<HTMLDivElement>, field: string) => {
    const target = e.currentTarget;
    const maxLength = field === 'name' ? 100 : field === 'description' ? 2000 : 500;
    
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

  const handleAddMember = (member: { 
    studentId: string; 
    name: string; 
    role: string; 
    group: string;
    shortId: string;
    universityId: number;
  }) => {
    const newMember: TeamMember = {
      tempId: Date.now().toString(),
      studentId: member.studentId,
      name: member.name,
      role: member.role,
      group: member.group,
      shortId: member.shortId
    };
    setMembers([...members, newMember]);
  };

  const handleAddCase = (caseSemesterId: string, caseTitle: string) => {
    if (teamCase) {
      alert('Можно выбрать только один кейс. Сначала удалите текущий кейс.');
      return;
    }
    setTeamCase({ caseSemesterId, title: caseTitle });
  };

  const handleAddCurator = (curatorId: string) => {
    const curator = availableCurators.find(c => c.id === curatorId);
    if (curator && !curators.some(c => c.curatorId === curatorId)) {
      setCurators([...curators, { id: Date.now().toString(), curatorId: curator.id, email: curator.email }]);
    }
  };

  const handleRemoveCurator = (tempId: string) => {
    setCurators(curators.filter(c => c.id !== tempId));
  };

  const handleRemoveMember = (tempId: string) => {
    setMembers(members.filter(m => m.tempId !== tempId));
  };

  const handleRemoveCase = () => {
    setTeamCase(null);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Введите название команды';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Название команды должно быть не менее 3 символов';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Название команды должно быть не более 100 символов';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Введите описание команды';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Описание команды должно быть не менее 10 символов';
    } else if (formData.description.trim().length > 2000) {
      newErrors.description = 'Описание команды должно быть не более 2000 символов';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[data-field="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    try {
      setSaving(true);
      
      const university_id = localStorage.getItem('university_id') 
        ? Number(localStorage.getItem('university_id')) 
        : 1;
      
      const teamForAPI = {
        name: formData.name,
        description: formData.description,
        notes: formData.notes,
        university_id: university_id,
        status: formData.status,
      };
      
      console.log('Создаем команду:', teamForAPI);
      const newTeam = await createTeam(teamForAPI);
      console.log('Команда создана:', newTeam);
      
      if (members.length > 0) {
        console.log(`Добавляем ${members.length} участников...`);
        
        for (const member of members) {
          try {
            await addTeamMember(newTeam.id, {
              student_id: member.studentId,
              position: member.role,
              joined_at: new Date().toISOString()
            });
            console.log(`Участник ${member.name} добавлен`);
          } catch (err) {
            console.error(`Ошибка добавления участника ${member.name}:`, err);
          }
        }
      }
      
      if (teamCase && newTeam.id) {
        console.log(`Добавляем кейс ${teamCase.title}...`);
        try {
          await assignCaseToTeam(newTeam.id, {
            case_semesters_id: teamCase.caseSemesterId,
            started_at: new Date().toISOString(),
            is_current: true
          });
          console.log(`Кейс ${teamCase.title} добавлен`);
        } catch (err) {
          console.error(`Ошибка добавления кейса ${teamCase.title}:`, err);
        }
      }
      
      if (curators.length > 0 && teamCase) {
        console.log(`Добавляем ${curators.length} кураторов...`);
        
        for (const curator of curators) {
          try {
            await assignCuratorToTeam(newTeam.id, curator.curatorId);
            console.log(`Куратор ${curator.email} назначен команде`);
          } catch (err) {
            console.error(`Ошибка назначения куратора ${curator.email}:`, err);
          }
        }
      }
      
      navigate('/teams');
    } catch (error) {
      console.error('Ошибка создания команды:', error);
      const err = error as { response?: { data?: unknown } };
      if (err.response?.data) {
        console.log('Детали ошибки:', err.response.data);
        setErrors({ submit: JSON.stringify(err.response.data) });
      } else {
        setErrors({ submit: 'Не удалось создать команду' });
      }
    } finally {
      setSaving(false);
    }
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
        <button className="save-btn" onClick={handleSave} disabled={saving}>
          <SaveIcon />
          <span>{saving ? 'Сохранение...' : 'Сохранить'}</span>
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
                <div key={member.tempId} className="member-item">
                  <div className="member-info">
                    <span className="member-name">{member.name}</span>
                    <span className="member-role">{member.role}</span>
                    <span className="member-group">{member.group}</span>
                    {member.shortId && <span className="member-short-id">#{member.shortId}</span>}
                  </div>
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveMember(member.tempId)}
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
            <label className="form-label">Кейс</label>
            <button 
              className="add-btn" 
              onClick={() => setIsCaseModalOpen(true)}
              disabled={!!teamCase}
              style={{ opacity: teamCase ? 0.5 : 1 }}
            >
              <PlusIcon />
              <span>Добавить кейс</span>
            </button>
          </div>
          <div className="cases-list">
            {teamCase ? (
              <div className="case-item">
                <span className="case-title">{teamCase.title}</span>
                <button 
                  className="remove-btn"
                  onClick={handleRemoveCase}
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="empty-cases-placeholder">
                Нет выбранного кейса. Нажмите "Добавить кейс" чтобы назначить.
              </div>
            )}
          </div>
        </div>

        <div className="form-field">
          <div className="field-header">
            <label className="form-label">Кураторы</label>
            <button className="add-btn" onClick={() => setIsCuratorModalOpen(true)}>
              <PlusIcon />
              <span>Добавить куратора</span>
            </button>
          </div>
          {curators.length > 0 ? (
            <div className="curators-list">
              {curators.map((curator) => (
                <div key={curator.id} className="curator-item">
                  <span className="curator-name">{curator.email}</span>
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveCurator(curator.id)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-curators">Нет назначенных кураторов</div>
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

        {errors.submit && <div className="error-message submit-error">{errors.submit}</div>}
      </div>

      {/* Модальные окна */}
      <AddMemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onAdd={handleAddMember}
      />
      
      <AddCaseModal
        isOpen={isCaseModalOpen}
        onClose={() => setIsCaseModalOpen(false)}
        onAdd={handleAddCase}
        usedCaseIds={teamCase ? [teamCase.caseSemesterId] : []}
      />

      <AddCuratorModal
        isOpen={isCuratorModalOpen}
        onClose={() => setIsCuratorModalOpen(false)}
        onAssign={handleAddCurator}
      />
    </div>
  );
};

export default TeamCreatePage;