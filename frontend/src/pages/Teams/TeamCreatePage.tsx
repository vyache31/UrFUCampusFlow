import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import EditableField from '../../components/common/EditableField/EditableField';
import { SaveIcon, PlusIcon } from '../../components/common/Icons/Icons';
import AddMemberModal from '../../components/Modals/AddMemberModal';
import AddCaseModal from '../../components/Modals/AddCaseModal';
import AddCuratorModal from '../../components/Modals/AddCuratorModal';
import { createTeam } from '../../services/teams';
import { addTeamMember } from '../../services/teamMembers';
import { assignCaseToTeam } from '../../services/teamCaseHistory';
import { assignCuratorToTeam, getAllCurators } from '../../services/curators';
import { useToast } from '../../context/ToastContext';
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

const FIELD_LIMITS = {
  name: 100,
  description: 2000,
  notes: 500,
};

const TeamCreatePage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

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

  const updateField = (field: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleStatusChange = (status: string) => {
    setFormData(prev => ({ ...prev, status }));
  };

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
    showSuccess(`Участник ${member.name} добавлен`);
  };

  const handleAddCase = (caseSemesterId: string, caseTitle: string) => {
    if (teamCase) {
      showError('Можно выбрать только один кейс. Сначала удалите текущий кейс.');
      return;
    }
    setTeamCase({ caseSemesterId, title: caseTitle });
    showSuccess('Кейс добавлен');
  };

  const handleAddCurator = (curatorId: string) => {
    const curator = availableCurators.find(c => c.id === curatorId);
    if (curator && !curators.some(c => c.curatorId === curatorId)) {
      setCurators([...curators, { id: Date.now().toString(), curatorId: curator.id, email: curator.email }]);
      showSuccess(`Куратор ${curator.email} добавлен`);
    }
  };

  const handleRemoveCurator = (tempId: string) => {
    setCurators(curators.filter(c => c.id !== tempId));
  };

  const handleRemoveMember = (tempId: string) => {
    const removedMember = members.find(m => m.tempId === tempId);
    setMembers(members.filter(m => m.tempId !== tempId));
    if (removedMember) {
      showSuccess(`Участник ${removedMember.name} удалён`);
    }
  };

  const handleRemoveCase = () => {
    if (teamCase) {
      const caseTitle = teamCase.title;
      setTeamCase(null);
      showSuccess(`Кейс "${caseTitle}" удалён`);
    }
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

      const newTeam = await createTeam(teamForAPI);

      if (members.length > 0) {
        for (const member of members) {
          try {
            await addTeamMember(newTeam.id, {
              student_id: member.studentId,
              position: member.role,
              joined_at: new Date().toISOString()
            });
          } catch (err) {
            console.error(`Ошибка добавления участника ${member.name}:`, err);
          }
        }
      }

      if (teamCase && newTeam.id) {
        try {
          await assignCaseToTeam(newTeam.id, {
            case_semesters_id: teamCase.caseSemesterId,
            started_at: new Date().toISOString(),
            is_current: true
          });
        } catch (err) {
          console.error(`Ошибка добавления кейса ${teamCase.title}:`, err);
        }
      }

      if (curators.length > 0 && teamCase) {
        for (const curator of curators) {
          try {
            await assignCuratorToTeam(newTeam.id, curator.curatorId);
          } catch (err) {
            console.error(`Ошибка назначения куратора ${curator.email}:`, err);
          }
        }
      }

      showSuccess('Команда успешно создана!');
      navigate('/teams');
    } catch (error) {
      console.error('Ошибка создания команды:', error);
      const err = error as { response?: { data?: unknown } };
      if (err.response?.data) {
        setErrors({ submit: JSON.stringify(err.response.data) });
      } else {
        setErrors({ submit: 'Не удалось создать команду' });
      }
      showError('Не удалось создать команду');
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
          <EditableField
            value={formData.name}
            onChange={updateField('name')}
            placeholder="Введите название команды"
            maxLength={FIELD_LIMITS.name}
            maxHeight={53}
          />
          {errors.name && <div className="error-message">{errors.name}</div>}
        </div>

        {/* Описание команды */}
        <div className="form-field" data-field="description">
          <label className="form-label">Описание команды</label>
          <EditableField
            value={formData.description}
            onChange={updateField('description')}
            placeholder="Введите описание команды"
            maxLength={FIELD_LIMITS.description}
            maxHeight={250}
            className="description-box"
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
          <EditableField
            value={formData.notes}
            onChange={updateField('notes')}
            placeholder="Введите заметки"
            maxLength={FIELD_LIMITS.notes}
            maxHeight={250}
            className="notes-box"
          />
          {errors.notes && <div className="error-message">{errors.notes}</div>}
        </div>

        {/* Кейс */}
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

        {/* Кураторы */}
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

      <AddMemberModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        onAdd={handleAddMember}
      />

      <AddCaseModal
        isOpen={isCaseModalOpen}
        onClose={() => setIsCaseModalOpen(false)}
        onAdd={handleAddCase}
        usedCaseSemesterIds={teamCase ? [teamCase.caseSemesterId] : []}
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