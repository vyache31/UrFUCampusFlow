import { useState } from 'react';
import { CloseIcon, CheckIcon } from '../common/Icons/Icons';
import { createStudent, updateStudent, type Student } from '../../services/students';
import { endTeamMember } from '../../services/teamMembers';
import StudentSearchInput from './StudentSearchInput';
import { useToast } from '../../context/ToastContext';
import './Modal.css';
import api from '../../services/api';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (member: { 
    studentId: string; 
    name: string; 
    role: string; 
    group: string;
    shortId: string;
    universityId: number;
  }) => void;
  teamId?: string;
}

interface TeamMemberResponse {
  id: string;
  student_id: string;
}

interface TeamResponse {
  id: string;
  name: string;
}

const AddMemberModal = ({ isOpen, onClose, onAdd, teamId }: AddMemberModalProps) => {
  const { showSuccess, showError, showConfirm } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    group: ''
  });
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setFormData(prev => ({
      ...prev,
      name: student.name,
      group: student.group
    }));
    setError('');
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({ ...prev, name: value }));
    if (selectedStudent && value !== selectedStudent.name) {
      setSelectedStudent(null);
    }
  };

  const handleGroupChange = (value: string) => {
    setFormData(prev => ({ ...prev, group: value }));
  };

  const getStudentActiveMembership = async (studentId: string) => {
    try {
      const teamsResponse = await api.get('/teams/?limit=100');
      const teams = teamsResponse.data as TeamResponse[];
      
      for (const team of teams) {
        const membersResponse = await api.get(`/teams/${team.id}/members?current_only=true`);
        const members = membersResponse.data as TeamMemberResponse[];
        const member = members.find((m: TeamMemberResponse) => m.student_id === studentId);
        if (member) {
          return { teamId: team.id, memberId: member.id, teamName: team.name };
        }
      }
      return null;
    } catch (err) {
      console.error('Ошибка проверки членства студента:', err);
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Введите ФИО');
      return;
    }
    
    if (!formData.role.trim()) {
      setError('Введите роль');
      return;
    }
    
    if (!formData.group.trim()) {
      setError('Введите группу');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      const universityId = 1;
      
      let studentId: string;
      let finalGroup = formData.group;
      let shortId = '';
      
      if (selectedStudent) {
        studentId = selectedStudent.id;
        shortId = selectedStudent.id.slice(-4);
        
        const activeMembership = await getStudentActiveMembership(studentId);
        
        if (activeMembership && activeMembership.teamId !== teamId) {
          showConfirm({
            message: `Студент "${selectedStudent.name}" уже является участником команды "${activeMembership.teamName}".\n\nХотите переместить его в текущую команду? Он будет исключен из предыдущей команды.`,
            onConfirm: async () => {
              try {
                await endTeamMember(activeMembership.teamId, activeMembership.memberId);
                showSuccess(`Студент "${selectedStudent.name}" перемещён из команды "${activeMembership.teamName}"`);
                
                await continueAdding(studentId, finalGroup, shortId, universityId);
              } catch (endErr) {
                console.error('Ошибка исключения из команды:', endErr);
                showError('Не удалось исключить студента из предыдущей команды');
                setLoading(false);
              }
            },
            onCancel: () => {
              setError('Добавление отменено');
              setLoading(false);
            },
            confirmText: 'Да, переместить',
            cancelText: 'Отмена'
          });
          return;
        }
        
        if (formData.group !== selectedStudent.group) {
          try {
            const updatedStudent = await updateStudent(studentId, { group: formData.group });
            finalGroup = updatedStudent.group;
            showSuccess(`Группа студента "${formData.name}" обновлена на "${finalGroup}"`);
          } catch (updateErr) {
            console.error('Ошибка обновления группы студента:', updateErr);
          }
        }
      } else {
        const student = await createStudent({
          name: formData.name,
          group: formData.group,
          university_id: universityId
        });
        studentId = student.id;
        finalGroup = student.group;
        shortId = student.id.slice(-4);
      }
      
      await continueAdding(studentId, finalGroup, shortId, universityId);
      
    } catch (err) {
      console.error('Ошибка добавления участника:', err);
      const error = err as { response?: { data?: { detail?: string } } };
      if (error.response?.data?.detail?.includes('already a current member')) {
        setError('Студент уже состоит в другой команде. Сначала исключите его оттуда.');
      } else {
        setError('Не удалось добавить участника');
      }
    } finally {
      setLoading(false);
    }
  };

  const continueAdding = async (studentId: string, finalGroup: string, shortId: string, universityId: number) => {
    onAdd({
      studentId: studentId,
      name: formData.name,
      role: formData.role,
      group: finalGroup,
      shortId: shortId,
      universityId: universityId
    });
    
    showSuccess(`Участник "${formData.name}" успешно добавлен!`);
    
    setFormData({ name: '', role: '', group: '' });
    setSelectedStudent(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container member-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-bar">
          <button className="modal-close-circle" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message" style={{ marginBottom: '15px', color: '#F63333' }}>{error}</div>}
          
          <div className="modal-field">
            <label className="modal-label">ФИО:</label>
            <StudentSearchInput
              value={formData.name}
              onChange={handleNameChange}
              onSelectStudent={handleSelectStudent}
              placeholder="Введите ФИО"
              disabled={loading}
            />
          </div>
          
          <div className="modal-field">
            <label className="modal-label">Роль:</label>
            <input
              type="text"
              className="modal-input"
              placeholder="Введите роль"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              disabled={loading}
            />
          </div>
          
          <div className="modal-field">
            <label className="modal-label">Группа:</label>
            <input
              type="text"
              className="modal-input"
              placeholder="Введите группу"
              value={formData.group}
              onChange={(e) => handleGroupChange(e.target.value)}
              disabled={loading}
            />
          </div>
          {selectedStudent && formData.group !== selectedStudent.group && (
            <div className="hint-text warning">
              Группа будет обновлена для существующего студента
            </div>
          )}
          {selectedStudent && formData.group === selectedStudent.group && (
            <div className="hint-text success">
              Используется существующий студент
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button className="modal-add-btn" onClick={handleSubmit} disabled={loading}>
            <CheckIcon />
            <span>{loading ? 'Сохранение...' : 'Добавить'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;