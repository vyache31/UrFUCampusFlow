import { useState, useEffect, useCallback } from 'react';
import { CloseIcon } from '../common/Icons/Icons';
import { getMeetingTasks, updateMeetingTask, type MeetingTask } from '../../services/meetings';
import { getMeetingAttendance, updateMeetingAttendance, type CuratorAttendance, getTeamCurators, type Curator } from '../../services/curators';
import './Modal.css';

interface MeetingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: {
    id: string;
    title: string;
    team_name?: string;
    case_title?: string;
    start_at: string;
    end_at: string;
    location?: string | null;
    event_link?: string | null;
    notes?: string | null;
  };
  teamId: string;
  onTaskUpdate?: () => void;
}

const MeetingDetailsModal = ({ isOpen, onClose, meeting, teamId, onTaskUpdate }: MeetingDetailsModalProps) => {
  const [tasks, setTasks] = useState<MeetingTask[]>([]);
  const [attendance, setAttendance] = useState<CuratorAttendance[]>([]);
  const [curators, setCurators] = useState<Curator[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!meeting.id || !teamId) return;
    try {
      setLoading(true);
      const data = await getMeetingTasks(teamId, meeting.id);
      setTasks(data);
    } catch (error) {
      console.error('Ошибка загрузки поручений:', error);
    } finally {
      setLoading(false);
    }
  }, [meeting.id, teamId]);

  const fetchAttendance = useCallback(async () => {
    if (!meeting.id || !teamId) return;
    try {
      setLoadingAttendance(true);
      const data = await getMeetingAttendance(teamId, meeting.id);
      setAttendance(data);
    } catch (error) {
      console.error('Ошибка загрузки посещаемости:', error);
    } finally {
      setLoadingAttendance(false);
    }
  }, [meeting.id, teamId]);

  const fetchCurators = useCallback(async () => {
    if (!teamId) return;
    try {
      const data = await getTeamCurators(teamId);
      setCurators(data.filter(c => c.is_current === true));
    } catch (error) {
      console.error('Ошибка загрузки кураторов:', error);
    }
  }, [teamId]);

    useEffect(() => {
  if (isOpen && meeting.id && teamId) {
    const loadData = async () => {
      await Promise.all([
        fetchTasks(),
        fetchAttendance(),
        fetchCurators()
      ]);
    };
    loadData();
  }
}, [isOpen, meeting.id, teamId]);

  const getCuratorEmail = (assignmentId: string): string => {
    const curator = curators.find(c => c.id === assignmentId);
    if (curator?.email) return curator.email;
    if (curator?.user_id) return `Куратор ${curator.user_id.slice(-4)}`;
    return `Куратор ${assignmentId.slice(-4)}`;
  };

  const handleTaskToggle = async (taskId: string, currentStatus: boolean) => {
    try {
      await updateMeetingTask(teamId, meeting.id, taskId, !currentStatus);
      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, is_completed: !currentStatus } : task
      ));
      if (onTaskUpdate) onTaskUpdate();
    } catch (error) {
      console.error('Ошибка обновления задачи:', error);
      alert('Не удалось обновить статус поручения');
    }
  };

  const handleAttendanceToggle = async (attendanceId: string, currentStatus: boolean) => {
    try {
      await updateMeetingAttendance(teamId, meeting.id, attendanceId, !currentStatus);
      setAttendance(prev => prev.map(a =>
        a.id === attendanceId ? { ...a, is_present: !currentStatus } : a
      ));
    } catch (error) {
      console.error('Ошибка обновления посещаемости:', error);
      alert('Не удалось обновить статус посещаемости');
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const formatDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
    return `${diffMinutes} мин`;
  };

  const { date, time } = formatDateTime(meeting.start_at);
  const duration = formatDuration(meeting.start_at, meeting.end_at);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container meeting-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-bar">
          <button className="modal-close-circle" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        
        <div className="modal-body" style={{ padding: '30px' }}>
          <div className="meeting-details-title">{meeting.title}</div>
          
          <div className="meeting-details-field">
            <span className="meeting-details-label">Дата:</span>
            <span className="meeting-details-value">{date}</span>
          </div>
          
          <div className="meeting-details-field">
            <span className="meeting-details-label">Время:</span>
            <span className="meeting-details-value">{time} ({duration})</span>
          </div>
          
          <div className="meeting-details-field">
            <span className="meeting-details-label">Место:</span>
            <span className="meeting-details-value">{meeting.location || 'Не указано'}</span>
          </div>
          
          {meeting.event_link && (
            <div className="meeting-details-field">
              <span className="meeting-details-label">Ссылка:</span>
              <a href={meeting.event_link} target="_blank" rel="noopener noreferrer" className="meeting-details-link">
                {meeting.event_link}
              </a>
            </div>
          )}
          
          {meeting.notes && (
            <div className="meeting-details-field">
              <span className="meeting-details-label">Заметки:</span>
              <span className="meeting-details-value notes-value">{meeting.notes}</span>
            </div>
          )}

          <div className="meeting-attendance-section">
            <div className="meeting-attendance-title">Посещаемость кураторов</div>
            <div className="meeting-attendance-list-wrapper">
              {loadingAttendance ? (
                <div className="meeting-attendance-loading">Загрузка...</div>
              ) : attendance.length > 0 ? (
                <div className="meeting-attendance-list">
                  {attendance.map((item) => (
                    <div key={item.id} className="meeting-attendance-item">
                      <div 
                        className={`attendance-checkbox ${item.is_present ? 'checked' : ''}`}
                        onClick={() => handleAttendanceToggle(item.id, item.is_present)}
                      >
                        {item.is_present && <span className="checkmark">✓</span>}
                      </div>
                      <span className="curator-name">{getCuratorEmail(item.curator_assignment_id)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="meeting-attendance-empty">Нет назначенных кураторов</div>
              )}
            </div>
          </div>

          <div className="meeting-tasks-section">
            <div className="meeting-tasks-title">Поручения</div>
            <div className="meeting-tasks-list-wrapper">
              {loading ? (
                <div className="meeting-tasks-loading">Загрузка...</div>
              ) : tasks.length > 0 ? (
                <div className="meeting-tasks-list">
                  {tasks.map((task) => (
                    <div key={task.id} className="meeting-task-item">
                      <div 
                        className={`task-checkbox ${task.is_completed ? 'completed' : ''}`}
                        onClick={() => handleTaskToggle(task.id, task.is_completed)}
                      >
                        {task.is_completed && <span className="checkmark">✓</span>}
                      </div>
                      <div className="task-content">
                        <div className={`task-title ${task.is_completed ? 'completed' : ''}`}>
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="task-description">{task.description}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="meeting-tasks-empty">Нет поручений</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingDetailsModal;