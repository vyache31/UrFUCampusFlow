import { useState, useEffect, useCallback } from 'react';
import { CloseIcon, DeleteIcon, PlusIcon } from '../common/Icons/Icons';
import {
  createMeetingTask,
  deleteMeetingTask,
  getMeetingTasks,
  updateTeamMeeting,
  updateMeetingTask,
  type Meeting,
  type MeetingTask,
} from '../../services/meetings';
import { getMeetingAttendance, updateMeetingAttendance, type CuratorAttendance, getTeamCurators, type Curator } from '../../services/curators';
import { useToast } from '../../context/ToastContext';
import './Modal.css';

interface MeetingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting;
  teamId: string;
  onTaskUpdate?: () => void;
  onMeetingUpdate?: (meeting: Meeting) => void;
}

const MeetingDetailsModal = ({
  isOpen,
  onClose,
  meeting,
  teamId,
  onTaskUpdate,
  onMeetingUpdate,
}: MeetingDetailsModalProps) => {
  const { showError, showSuccess } = useToast();
  const [tasks, setTasks] = useState<MeetingTask[]>([]);
  const [attendance, setAttendance] = useState<CuratorAttendance[]>([]);
  const [curators, setCurators] = useState<Curator[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [creatingTask, setCreatingTask] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [notes, setNotes] = useState(meeting.notes ?? '');
  const [notesDraft, setNotesDraft] = useState(meeting.notes ?? '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const currentNotes = meeting.notes ?? '';
    setNotes(currentNotes);
    setNotesDraft(currentNotes);
    setIsEditingNotes(false);
  }, [isOpen, meeting.id, meeting.notes]);

  const fetchTasks = useCallback(async () => {
    if (!meeting.id || !teamId) return;
    try {
      setLoading(true);
      const data = await getMeetingTasks(teamId, meeting.id);
      setTasks(data);
    } catch (error) {
      console.error('Ошибка загрузки поручений:', error);
      showError('Не удалось загрузить поручения');
    } finally {
      setLoading(false);
    }
  }, [meeting.id, teamId, showError]);

  const fetchAttendance = useCallback(async () => {
    if (!meeting.id || !teamId) return;
    try {
      setLoadingAttendance(true);
      const data = await getMeetingAttendance(teamId, meeting.id);
      setAttendance(data);
    } catch (error) {
      console.error('Ошибка загрузки посещаемости:', error);
      showError('Не удалось загрузить посещаемость');
    } finally {
      setLoadingAttendance(false);
    }
  }, [meeting.id, teamId, showError]);

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
  }, [isOpen, meeting.id, teamId, fetchTasks, fetchAttendance, fetchCurators]);

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
      showError('Не удалось обновить статус поручения');
    }
  };

  const handleCreateTask = async () => {
    const title = taskTitle.trim();
    if (!title) {
      showError('Введите название поручения');
      return;
    }

    try {
      setCreatingTask(true);
      const createdTask = await createMeetingTask(teamId, meeting.id, {
        title,
        description: taskDescription.trim() || undefined,
      });
      setTasks(prev => [...prev, createdTask]);
      setTaskTitle('');
      setTaskDescription('');
      setIsTaskFormOpen(false);
      showSuccess('Поручение добавлено');
      onTaskUpdate?.();
    } catch (error) {
      console.error('Ошибка создания поручения:', error);
      showError('Не удалось добавить поручение');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      setDeletingTaskId(taskId);
      await deleteMeetingTask(teamId, meeting.id, taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
      showSuccess('Поручение удалено');
      onTaskUpdate?.();
    } catch (error) {
      console.error('Ошибка удаления поручения:', error);
      showError('Не удалось удалить поручение');
    } finally {
      setDeletingTaskId(null);
    }
  };

  const handleAttendanceToggle = async (attendanceId: string, currentStatus: boolean) => {
    try {
      await updateMeetingAttendance(teamId, meeting.id, attendanceId, !currentStatus);
      setAttendance(prev => prev.map(a =>
        a.id === attendanceId ? { ...a, is_present: !currentStatus } : a
      ));
      showSuccess('Статус посещаемости обновлён');
    } catch (error) {
      console.error('Ошибка обновления посещаемости:', error);
      showError('Не удалось обновить статус посещаемости');
    }
  };

  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      const updatedMeeting = await updateTeamMeeting(teamId, meeting.id, {
        notes: notesDraft.trim() || null,
      });
      const updatedNotes = updatedMeeting.notes ?? '';
      setNotes(updatedNotes);
      setNotesDraft(updatedNotes);
      setIsEditingNotes(false);
      onMeetingUpdate?.(updatedMeeting);
      showSuccess('Заметки обновлены');
    } catch (error) {
      console.error('Ошибка обновления заметок:', error);
      showError('Не удалось обновить заметки');
    } finally {
      setSavingNotes(false);
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
          
          <div className="meeting-details-field meeting-notes-field">
            <span className="meeting-details-label">Заметки:</span>
            <div className="meeting-notes-content">
              {isEditingNotes ? (
                <div className="meeting-notes-editor">
                  <textarea
                    className="meeting-notes-textarea"
                    value={notesDraft}
                    onChange={(event) => setNotesDraft(event.target.value)}
                    placeholder="Добавьте заметки к встрече"
                    disabled={savingNotes}
                    autoFocus
                  />
                  <div className="meeting-notes-actions">
                    <button
                      type="button"
                      className="meeting-notes-cancel-button"
                      onClick={() => {
                        setNotesDraft(notes);
                        setIsEditingNotes(false);
                      }}
                      disabled={savingNotes}
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      className="meeting-notes-save-button"
                      onClick={handleSaveNotes}
                      disabled={savingNotes}
                    >
                      {savingNotes ? 'Сохранение...' : 'Сохранить'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="meeting-notes-view">
                  <span className={`meeting-details-value notes-value ${notes ? '' : 'empty'}`}>
                    {notes || 'Заметок пока нет'}
                  </span>
                  <button
                    type="button"
                    className="meeting-notes-edit-button"
                    onClick={() => setIsEditingNotes(true)}
                  >
                    Редактировать
                  </button>
                </div>
              )}
            </div>
          </div>

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
            <div className="meeting-tasks-header">
              <div className="meeting-tasks-title">Поручения</div>
              <button
                type="button"
                className="meeting-task-add-button"
                onClick={() => setIsTaskFormOpen(prev => !prev)}
                aria-label="Добавить поручение"
              >
                <PlusIcon />
                <span>Добавить</span>
              </button>
            </div>

            {isTaskFormOpen && (
              <div className="meeting-task-create-form">
                <input
                  className="meeting-task-create-input"
                  value={taskTitle}
                  onChange={(event) => setTaskTitle(event.target.value)}
                  placeholder="Название поручения"
                  disabled={creatingTask}
                />
                <textarea
                  className="meeting-task-create-input meeting-task-create-description"
                  value={taskDescription}
                  onChange={(event) => setTaskDescription(event.target.value)}
                  placeholder="Описание (необязательно)"
                  disabled={creatingTask}
                />
                <div className="meeting-task-create-actions">
                  <button
                    type="button"
                    className="meeting-task-cancel-button"
                    onClick={() => setIsTaskFormOpen(false)}
                    disabled={creatingTask}
                  >
                    Отмена
                  </button>
                  <button
                    type="button"
                    className="meeting-task-save-button"
                    onClick={handleCreateTask}
                    disabled={creatingTask || !taskTitle.trim()}
                  >
                    {creatingTask ? 'Добавление...' : 'Добавить'}
                  </button>
                </div>
              </div>
            )}

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
                      <button
                        type="button"
                        className="meeting-task-delete-button"
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={deletingTaskId === task.id}
                        aria-label={`Удалить поручение ${task.title}`}
                      >
                        <DeleteIcon />
                      </button>
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
