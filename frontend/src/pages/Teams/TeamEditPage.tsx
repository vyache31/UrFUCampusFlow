import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { SaveIcon, PlusIcon, DeleteIcon } from '../../components/common/Icons/Icons';
import { getTeamById, updateTeam, deleteTeam } from '../../services/teams';
import { getTeamMembers, addTeamMember, type TeamMember } from '../../services/teamMembers';
import { getTeamHistory, assignCaseToTeam, type TeamCaseHistory } from '../../services/teamCaseHistory';
import AddMemberModal from '../../components/Modals/AddMemberModal';
import AddCaseModal from '../../components/Modals/AddCaseModal';
import './teamEditPage.css';

interface LocalMember {
  tempId: string;
  studentId: string;
  name: string;
  role: string;
  group: string;
  isExisting: boolean;
  memberId?: string;
}

interface LocalCase {
  tempId: string;
  caseSemesterId: string;
  title: string;
  isCurrent: boolean;
  historyId?: string;
  isExisting: boolean;
}

const TeamEditPage = () => {
  const { id } = useParams<{ id: string }>();
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
  const [teamCases, setTeamCases] = useState<LocalCase[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);

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
        
        const existingMembers: LocalMember[] = membersData.map((m: TeamMember) => ({
          tempId: m.id,
          studentId: m.student_id,
          name: m.student_name,
          role: m.position,
          group: (m as { group?: string }).group || '',
          isExisting: true,
          memberId: m.id
        }));
        setMembers(existingMembers);
        
        const existingCases: LocalCase[] = historyData.map((h: TeamCaseHistory) => ({
          tempId: h.id,
          caseSemesterId: h.case_semesters_id,
          title: h.case_title,
          isCurrent: h.is_current,
          historyId: h.id,
          isExisting: true
        }));
        setTeamCases(existingCases);
        
      } catch (err) {
        console.error('Ошибка загрузки данных команды:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamData();
  }, [id]);

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
    universityId: number;
  }) => {
    const newMember: LocalMember = {
      tempId: Date.now().toString(),
      studentId: member.studentId,
      name: member.name,
      role: member.role,
      group: member.group,
      isExisting: false
    };
    setMembers([...members, newMember]);
  };

  const handleAddCase = (caseSemesterId: string, caseTitle: string) => {
    if (!teamCases.some(c => c.caseSemesterId === caseSemesterId)) {
      const newCase: LocalCase = {
        tempId: Date.now().toString(),
        caseSemesterId,
        title: caseTitle,
        isCurrent: teamCases.length === 0,
        isExisting: false
      };
      setTeamCases([...teamCases, newCase]);
    }
  };

  const handleRemoveMember = (tempId: string) => {
    setMembers(members.filter(m => m.tempId !== tempId));
  };

  const handleRemoveCase = (tempId: string) => {
    setTeamCases(teamCases.filter(c => c.tempId !== tempId));
  };

  const handleSetCurrentCase = (tempId: string) => {
    setTeamCases(prev => prev.map(c => ({
      ...c,
      isCurrent: c.tempId === tempId
    })));
  };

  const handleSave = async () => {
    if (!id) return;
    
    if (!formData.name.trim()) {
      setErrors({ name: 'Введите название команды' });
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
      
      const newCases = teamCases.filter(c => !c.isExisting);
      for (const teamCase of newCases) {
        try {
          await assignCaseToTeam(id, {
            case_semesters_id: teamCase.caseSemesterId,
            started_at: new Date().toISOString(),
            is_current: teamCase.isCurrent
          });
        } catch (err) {
          console.error(`Ошибка добавления кейса ${teamCase.title}:`, err);
        }
      }
      
      alert('Команда успешно обновлена');
      navigate(`/teams/${id}`);
    } catch (err) {
      console.error('Ошибка обновления команды:', err);
      setErrors({ submit: 'Не удалось обновить команду' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    
    if (!window.confirm('Вы уверены, что хотите удалить эту команду? Это действие необратимо.')) {
      return;
    }
    
    try {
      setDeleting(true);
      await deleteTeam(id);
      alert('Команда успешно удалена');
      navigate('/teams');
    } catch (err) {
      console.error('Ошибка удаления команды:', err);
      alert('Не удалось удалить команду');
    } finally {
      setDeleting(false);
    }
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
                    <span className="member-name">{member.name}</span>
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
            <label className="form-label">Кейсы</label>
            <button className="add-btn" onClick={() => setIsCaseModalOpen(true)}>
              <PlusIcon />
              <span>Добавить кейс</span>
            </button>
          </div>
          {teamCases.length > 0 && (
            <div className="cases-list">
              {teamCases.map((teamCase) => (
                <div key={teamCase.tempId} className="case-item">
                  <div className="case-info">
                    <span className="case-title">{teamCase.title}</span>
                    {teamCase.isCurrent && (
                      <span className="case-badge current">Текущий</span>
                    )}
                  </div>
                  <div className="case-actions">
                    {!teamCase.isCurrent && (
                      <button 
                        className="set-current-btn"
                        onClick={() => handleSetCurrentCase(teamCase.tempId)}
                      >
                        Сделать текущим
                      </button>
                    )}
                    <button 
                      className="remove-btn"
                      onClick={() => handleRemoveCase(teamCase.tempId)}
                    >
                      ×
                    </button>
                  </div>
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
        existingCaseIds={teamCases.map(c => c.caseSemesterId)}
      />
    </div>
  );
};

export default TeamEditPage;