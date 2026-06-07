import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { SaveIcon, PlusIcon, DeleteIcon } from '../../components/common/Icons/Icons';
import { getTeamById, updateTeam, deleteTeam } from '../../services/teams';
import { getTeamMembers, addTeamMember, endTeamMember, type TeamMember } from '../../services/teamMembers';
import { getTeamHistory, assignCaseToTeam, endCurrentCase, type TeamCaseHistory } from '../../services/teamCaseHistory';
import AddMemberModal from '../../components/Modals/AddMemberModal';
import AddCaseModal from '../../components/Modals/AddCaseModal';
import './teamEditPage.css';
import { getTeamCurators, assignCuratorToTeam, unassignCuratorFromTeam, type Curator } from '../../services/curators';
import AddCurator from '../../components/Modals/AddCurator';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface LocalMember {
  tempId: string;
  studentId: string;
  name: string;
  role: string;
  group: string;
  isExisting: boolean;
  memberId?: string;
  shortId?: string;
}

interface LocalCase {
  tempId: string;
  caseSemesterId: string;
  title: string;
  historyId?: string;
  isExisting: boolean;
}

const TeamEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const { showSuccess, showError, showConfirm } = useToast();
  const navigate = useNavigate();
  
  const nameRef = useRef<HTMLDivElement>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    notes: '',
    status: ''
  });
  
  const [members, setMembers] = useState<LocalMember[]>([]);
  const [originalMembers, setOriginalMembers] = useState<LocalMember[]>([]);
  const [teamCase, setTeamCase] = useState<LocalCase | null>(null);
  const [originalCaseId, setOriginalCaseId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);

  const [curators, setCurators] = useState<Curator[]>([]);
  const [isCuratorModalOpen, setIsCuratorModalOpen] = useState(false);

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        const [teamData, membersData, historyData] = await Promise.all([
          getTeamById(id),
          getTeamMembers(id).catch(() => []),
          getTeamHistory(id).catch(() => []),
        ]);
        
        setFormData({
          name: teamData.name,
          description: teamData.description || '',
          notes: teamData.notes || '',
          status: teamData.status
        });
        
        if (nameRef.current) nameRef.current.innerText = teamData.name;
        if (descriptionRef.current) descriptionRef.current.innerText = teamData.description || '';
        if (notesRef.current) notesRef.current.innerText = teamData.notes || '';
        
        const existingMembers: LocalMember[] = membersData.map((member: TeamMember) => ({
          tempId: member.id,
          studentId: member.student_id,
          name: member.student_name,
          role: member.position,
          group: (member as { group?: string }).group || '',
          isExisting: true,
          memberId: member.id
        }));
        setMembers(existingMembers);
        setOriginalMembers(JSON.parse(JSON.stringify(existingMembers)));
        
        const currentActiveCase = historyData.find((h: TeamCaseHistory) => h.is_current === true);
        
        if (currentActiveCase) {
          setTeamCase({
            tempId: currentActiveCase.id,
            caseSemesterId: currentActiveCase.case_semesters_id,
            title: currentActiveCase.case_title,
            historyId: currentActiveCase.id,
            isExisting: true
          });
          setOriginalCaseId(currentActiveCase.case_semesters_id);
        } else {
          setTeamCase(null);
          setOriginalCaseId(null);
        }
        
      } catch (err) {
        console.error('Ошибка загрузки данных команды:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamData();
  }, [id]);

  useEffect(() => {
    const fetchCurators = async () => {
      if (!id) return;
      try {
        const data = await getTeamCurators(id);
        setCurators(data.filter(c => c.is_current === true));
      } catch (error) {
        console.error('Ошибка загрузки кураторов:', error);
      }
    };
    fetchCurators();
  }, [id]);

  const handleAssignCurator = async (curatorId: string) => {
    if (!id) return;
    try {
      const newAssignment = await assignCuratorToTeam(id, curatorId);
      const userResponse = await api.get(`/users/${curatorId}`);
      setCurators([...curators, { ...newAssignment, email: userResponse.data.email }]);
      showSuccess('Куратор успешно назначен');
    } catch (error) {
      console.error('Ошибка назначения куратора:', error);
      showError('Не удалось назначить куратора');
    }
  };

  const handleUnassignCurator = (assignmentId: string) => {
    if (!id) return;
    
    showConfirm({
      message: 'Открепить куратора от команды?',
      onConfirm: async () => {
        try {
          await unassignCuratorFromTeam(id, assignmentId);
          setCurators(curators.filter(c => c.id !== assignmentId));
          showSuccess('Куратор успешно откреплён');
        } catch (error) {
          console.error('Ошибка открепления куратора:', error);
          showError('Не удалось открепить куратора');
        }
      },
      onCancel: () => {},
      confirmText: 'Да',
      cancelText: 'Нет'
    });
  };

  const existingCuratorIds = curators.map(c => c.user_id);

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
    const observer = new MutationObserver(checkHeight);
    observer.observe(element, { childList: true, subtree: true, characterData: true });
    setTimeout(checkHeight, 100);
  };

  useEffect(() => {
    if (!loading) {
      setupScrollableEditable(nameRef.current, 53);
      setupScrollableEditable(descriptionRef.current, 250);
      setupScrollableEditable(notesRef.current, 250);
    }
  }, [loading]);

  const handleContentChange = (field: string, element: HTMLDivElement | null) => {
    if (!element) return;
    const value = element.innerText;
    setFormData(prev => ({ ...prev, [field]: value }));
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
    const newMember: LocalMember = {
      tempId: Date.now().toString(),
      studentId: member.studentId,
      name: member.name,
      role: member.role,
      group: member.group,
      shortId: member.shortId,
      isExisting: false
    };
    setMembers([...members, newMember]);
  };

  const handleAddCase = (caseSemesterId: string, caseTitle: string) => {
    if (teamCase && teamCase.isExisting) {
      showError('У команды уже есть активный кейс. Сначала завершите текущий кейс.');
      return;
    }
    
    if (teamCase && !teamCase.isExisting) {
      showConfirm({
        message: 'Заменить текущий выбранный кейс?',
        onConfirm: () => {
          const newCase: LocalCase = {
            tempId: Date.now().toString(),
            caseSemesterId,
            title: caseTitle,
            isExisting: false
          };
          setTeamCase(newCase);
        },
        onCancel: () => {},
        confirmText: 'Да',
        cancelText: 'Нет'
      });
      return;
    }
    
    const newCase: LocalCase = {
      tempId: Date.now().toString(),
      caseSemesterId,
      title: caseTitle,
      isExisting: false
    };
    setTeamCase(newCase);
  };

  const handleRemoveMember = (tempId: string) => {
    setMembers(members.filter(m => m.tempId !== tempId));
  };

  const handleRemoveCase = () => {
    if (!teamCase) return;
    
    if (teamCase.isExisting) {
      showConfirm({
        message: 'Вы уверены, что хотите завершить текущий кейс? Он переместится в историю команды.',
        onConfirm: () => {
          setTeamCase(null);
          showSuccess('Кейс завершён и перемещён в историю');
        },
        onCancel: () => {},
        confirmText: 'Да',
        cancelText: 'Нет'
      });
    } else {
      setTeamCase(null);
    }
  };

  const handleSave = async () => {
    if (!id) return;
    
    if (!formData.name.trim()) {
      setErrors({ name: 'Введите название команды' });
      showError('Введите название команды');
      return;
    }
    
    try {
      setSaving(true);
      
      await updateTeam(id, {
        name: formData.name,
        description: formData.description,
        notes: formData.notes,
        status: formData.status,
        university_id: 1
      });
      
      const originalMemberIds = originalMembers.map(m => m.memberId).filter((id): id is string => !!id);
      const currentMemberIds = members.filter(m => m.isExisting).map(m => m.memberId).filter((id): id is string => !!id);
      const removedMemberIds = originalMemberIds.filter(id => !currentMemberIds.includes(id));
      
      for (const memberId of removedMemberIds) {
        try {
          await endTeamMember(id, memberId);
        } catch (err) {
          console.error(`Ошибка завершения членства ${memberId}:`, err);
        }
      }
      
      const newMembers = members.filter(m => !m.isExisting);
      for (const member of newMembers) {
        try {
          await addTeamMember(id, {
            student_id: member.studentId,
            position: member.role,
            joined_at: new Date().toISOString()
          });
        } catch (err) {
          console.error(`Ошибка добавления участника ${member.name}:`, err);
        }
      }
      
      const hasExistingCase = originalCaseId !== null;
      const hasNewCase = teamCase !== null;
      
      if (hasExistingCase && !hasNewCase) {
        try {
          await endCurrentCase(id);
        } catch (err) {
          console.error('Ошибка завершения кейса:', err);
        }
      }
      
      if (!hasExistingCase && hasNewCase && !teamCase.isExisting) {
        try {
          await assignCaseToTeam(id, {
            case_semesters_id: teamCase.caseSemesterId,
            started_at: new Date().toISOString(),
            is_current: true
          });
        } catch (err) {
          console.error(`Ошибка добавления кейса:`, err);
        }
      }
      
      if (hasExistingCase && hasNewCase && !teamCase.isExisting) {
        try {
          await endCurrentCase(id);
          
          await assignCaseToTeam(id, {
            case_semesters_id: teamCase.caseSemesterId,
            started_at: new Date().toISOString(),
            is_current: true
          });
        } catch (err) {
          console.error(`Ошибка замены кейса:`, err);
        }
      }
      
      showSuccess('Команда успешно обновлена');
      navigate(`/teams/${id}`);
    } catch (err) {
      console.error('Ошибка обновления команды:', err);
      setErrors({ submit: 'Не удалось обновить команду' });
      showError('Не удалось обновить команду');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    
    showConfirm({
      message: 'Вы уверены, что хотите удалить эту команду? Это действие необратимо.',
      onConfirm: async () => {
        try {
          setDeleting(true);
          await deleteTeam(id);
          showSuccess('Команда успешно удалена');
          navigate('/teams');
        } catch (err) {
          console.error('Ошибка удаления команды:', err);
          showError('Не удалось удалить команду');
        } finally {
          setDeleting(false);
        }
      },
      onCancel: () => {},
      confirmText: 'Да',
      cancelText: 'Нет'
    });
  };

  const breadcrumbItems = [
    { label: 'Главная', path: '/' },
    { label: 'Все команды', path: '/teams' },
    { label: 'Просмотр команды', path: `/teams/${id}` },
    { label: 'Редактирование' },
  ];

  const statusOptions = ['Интервью', 'Отказ', 'Работает над кейсом', 'Архив'];

  if (loading) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="loading-container">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper team-edit-page">
      <Header />
      <Breadcrumb items={breadcrumbItems} />

      <div className="edit-header">
        <h1 className="page-title">Редактирование команды</h1>
        <div className="edit-actions">
          <button className="delete-btn" onClick={handleDelete} disabled={deleting}>
            <DeleteIcon />
            <span>{deleting ? 'Удаление...' : 'Удалить'}</span>
          </button>
          <button className="save-btn" onClick={handleSave} disabled={saving}>
            <SaveIcon />
            <span>{saving ? 'Сохранение...' : 'Сохранить'}</span>
          </button>
        </div>
      </div>

      <div className="edit-form">
        <div className="form-field" data-field="name">
          <label className="form-label">Название команды</label>
          <div
            ref={nameRef}
            className="editable-box"
            contentEditable
            suppressContentEditableWarning
            onInput={() => handleContentChange('name', nameRef.current)}
            data-placeholder="Введите название команды"
          />
          {errors.name && <div className="error-message">{errors.name}</div>}
        </div>

        <div className="form-field" data-field="description">
          <label className="form-label">Описание команды</label>
          <div
            ref={descriptionRef}
            className="editable-box description-box"
            contentEditable
            suppressContentEditableWarning
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
                    <div className="member-name-wrapper">
                      <span className="member-name">{member.name}</span>
                      <span className="member-short-id">#{member.shortId || member.studentId?.slice(-4)}</span>
                    </div>
                    <span className="member-role">{member.role}</span>
                    <span className="member-group">{member.group || '—'}</span>
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
            className="editable-box notes-box"
            contentEditable
            suppressContentEditableWarning
            onInput={() => handleContentChange('notes', notesRef.current)}
            data-placeholder="Введите заметки"
          />
          {errors.notes && <div className="error-message">{errors.notes}</div>}
        </div>

        {/* Кейсы */}
        <div className="form-field">
          <div className="field-header">
            <label className="form-label">Текущий кейс</label>
            {!teamCase && (
              <button className="add-btn" onClick={() => setIsCaseModalOpen(true)}>
                <PlusIcon />
                <span>Добавить кейс</span>
              </button>
            )}
          </div>
          <div className="cases-list">
            {teamCase ? (
              <div className="case-item">
                <div className="case-info">
                  <span className="case-title">{teamCase.title}</span>
                </div>
                <div className="case-actions">
                  <button 
                    className="remove-btn"
                    onClick={handleRemoveCase}
                    title={teamCase.isExisting ? "Завершить кейс" : "Удалить"}
                  >
                    ×
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-cases-placeholder">
                Нет активного кейса. Нажмите "Добавить кейс" чтобы назначить.
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
                  <span className="curator-name">{curator.email || `Куратор ${curator.user_id?.slice(-4)}`}</span>
                  <button 
                    className="remove-btn"
                    onClick={() => handleUnassignCurator(curator.id)}
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

      <AddCurator
        isOpen={isCuratorModalOpen}
        onClose={() => setIsCuratorModalOpen(false)}
        onAssign={handleAssignCurator}
        existingCuratorIds={existingCuratorIds}
      />

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
    </div>
  );
};

export default TeamEditPage;