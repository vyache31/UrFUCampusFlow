import { useCallback, useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { EditIcon, PlusIcon, CheckIcon, TeamIcon, DeleteIcon, CalendarIcon, AttachmentUploadIcon, AttachmentFileIcon, AttachmentDeleteIcon } from '../../components/common/Icons/Icons';
import { useToast } from '../../context/ToastContext';
import { getTeamById, type Team } from '../../services/teams';
import ScheduleMeetingModal from '../../components/Modals/ScheduleMeetingModal';
import { createMeetingsSeries } from '../../services/meetingsSeries';
import {
  carryTasksToNextMeeting,
  deleteMeetingTaskFile,
  downloadMeetingTaskFile,
  getMeetingTaskFiles,
  uploadMeetingTaskFile,
  type MeetingTaskFile,
  createMeetingTask,
  createTeamMeeting,
  createTaskForNextMeeting,
  deleteTeamMeeting,
  deleteMeetingTask,
  getMeetingTasks,
  getNextTeamMeeting,
  getTeamMeetings,
  updateMeetingTask,
  updateTeamMeeting,
  type Meeting,
  type MeetingTask,
} from '../../services/meetings';
import './meetingViewPage.css';

const toLocalInput = (iso: string) => {
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const toIso = (localValue: string) => new Date(localValue).toISOString();

const MeetingViewPage = () => {
  const { teamId, meetingId } = useParams<{ teamId: string; meetingId: string }>();
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const { showError, showSuccess, showConfirm } = useToast();
  const [team, setTeam] = useState<Team | null>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [nextMeeting, setNextMeeting] = useState<Meeting | null>(null);
  const [nextMeetingTasks, setNextMeetingTasks] = useState<MeetingTask[]>([]);
  const [tasks, setTasks] = useState<MeetingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMeeting, setEditingMeeting] = useState(() => routerLocation.pathname.endsWith('/edit'));
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [title, setTitle] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [location, setLocation] = useState('');
  const [eventLink, setEventLink] = useState('');
  const [notes, setNotes] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newNextTaskTitle, setNewNextTaskTitle] = useState('');
  const [newNextTaskDescription, setNewNextTaskDescription] = useState('');
  const [addingTask, setAddingTask] = useState(false);
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [addingNextTask, setAddingNextTask] = useState(false);
  const [nextTaskFormOpen, setNextTaskFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitleDraft, setTaskTitleDraft] = useState('');
  const [taskDescriptionDraft, setTaskDescriptionDraft] = useState('');
  const [taskFiles, setTaskFiles] = useState<Record<string, MeetingTaskFile[]>>({});
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPage = useCallback(async () => {
    if (!teamId || !meetingId) return;
    setLoading(true);
    try {
      const [teamData, meetingsData, taskData] = await Promise.all([
        getTeamById(teamId),
        getTeamMeetings(teamId),
        getMeetingTasks(teamId, meetingId),
      ]);
      const found = meetingsData.find(item => item.id === meetingId);
      if (!found) throw new Error('Встреча не найдена');
      setTeam(teamData);
      setMeeting(found);
      setTasks(taskData);
      const filesByTask = await Promise.all(taskData.map(async task => {
        try { return [task.id, await getMeetingTaskFiles(teamId, meetingId, task.id)] as const; }
        catch { return [task.id, []] as const; }
      }));
      setTaskFiles(Object.fromEntries(filesByTask));
      setTitle(found.title || '');
      setStartAt(toLocalInput(found.start_at));
      setEndAt(toLocalInput(found.end_at));
      setLocation(found.location || '');
      setEventLink(found.event_link || '');
      setNotes(found.notes || '');
      try {
        const next = await getNextTeamMeeting(teamId, meetingId);
        setNextMeeting(next);
        setNextMeetingTasks(await getMeetingTasks(teamId, next.id).catch(() => []));
      } catch {
        setNextMeeting(null);
        setNextMeetingTasks([]);
      }
    } catch (error) {
      console.error('Не удалось загрузить встречу:', error);
      showError('Не удалось загрузить встречу');
    } finally {
      setLoading(false);
    }
  }, [teamId, meetingId, showError]);

  useEffect(() => { void loadPage(); }, [loadPage]);

  const handleCreateNextMeeting = async (data: { title: string; date: string; time: string; durationMinutes: number; location: string; event_link: string; notes: string; tasks: { title: string; description: string }[] }) => {
    if (!teamId) return;
    const [day, month, year] = data.date.split('.');
    const [hours, minutes] = data.time.split(':');
    const start = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes));
    if (Number.isNaN(start.getTime())) { showError('Выберите корректную дату и время'); return; }
    const end = new Date(start.getTime() + data.durationMinutes * 60000);
    try {
      await createTeamMeeting(teamId, { title: data.title, start_at: start.toISOString(), end_at: end.toISOString(), location: data.location || 'Онлайн', event_link: data.event_link || null, notes: data.notes || '', tasks: data.tasks.map(task => ({ title: task.title, description: task.description || '' })) });
      setIsScheduleModalOpen(false);
      showSuccess('Встреча создана');
      await loadPage();
    } catch (error) {
      console.error('Не удалось создать встречу:', error);
      showError('Не удалось создать встречу');
    }
  };

  const handleCreateRecurringMeetings = async (data: { title: string; start_date: string; start_time: string; durationMinutes: number; location: string; event_link: string; notes: string; tasks: { title: string; description: string }[]; recurrence_type: 'daily' | 'weekly' | 'biweekly' | 'monthly'; interval: number; days_of_week?: string[]; end_type: 'after_occurrences' | 'by_date'; occurrences?: number; end_date?: string }) => {
    if (!teamId) return;
    const [day, month, year] = data.start_date.split('.');
    const [hours, minutes] = data.start_time.split(':');
    const start = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes));
    if (Number.isNaN(start.getTime())) { showError('Выберите корректную дату и время'); return; }
    const end = new Date(start.getTime() + data.durationMinutes * 60000);
    const patternType: 'daily' | 'weekly' | 'monthly' = data.recurrence_type === 'monthly' ? 'monthly' : (data.recurrence_type === 'weekly' || data.recurrence_type === 'biweekly') ? 'weekly' : 'daily';
    try {
      await createMeetingsSeries(teamId, {
        title: data.title, start_at: start.toISOString(), end_at: end.toISOString(),
        location: data.location || '', event_link: data.event_link || '', notes: data.notes || '',
        recurrence: {
          pattern: { type: patternType, interval: data.interval, days_of_week: patternType === 'weekly' ? (data.days_of_week?.length ? data.days_of_week : [start.toLocaleDateString('en-US', { weekday: 'long' })]) : undefined },
          range: { type: data.end_type === 'after_occurrences' ? 'numbered' : 'endDate', start_date: `${year}-${month}-${day}`, ...(data.end_type === 'after_occurrences' && data.occurrences ? { number_of_occurrences: data.occurrences } : {}), ...(data.end_type === 'by_date' && data.end_date ? { end_date: data.end_date } : {}) },
        },
      });
      setIsScheduleModalOpen(false);
      showSuccess('Серия встреч создана');
      await loadPage();
    } catch (error) {
      console.error('Не удалось создать серию встреч:', error);
      showError('Не удалось создать серию встреч');
    }
  };

  const handleSaveMeeting = async (event: FormEvent) => {
    event.preventDefault();
    if (!teamId || !meetingId || !title.trim() || !startAt || !endAt) {
      showError('Заполните название, дату и время встречи');
      return;
    }
    if (new Date(endAt).getTime() <= new Date(startAt).getTime()) {
      showError('Время окончания должно быть позже времени начала');
      return;
    }
    setSavingMeeting(true);
    try {
      const updated = await updateTeamMeeting(teamId, meetingId, {
        title: title.trim(),
        start_at: toIso(startAt),
        end_at: toIso(endAt),
        location: location.trim() || null,
        event_link: eventLink.trim() || null,
        notes: notes.trim() || null,
      });
      setMeeting(updated);
      setEditingMeeting(false);
      navigate(`/teams/${teamId}/meetings/${meetingId}`);
      showSuccess('Встреча обновлена');
    } catch (error) {
      console.error('Ошибка обновления встречи:', error);
      showError('Не удалось сохранить встречу');
    } finally {
      setSavingMeeting(false);
    }
  };

  const handleToggleTask = async (task: MeetingTask) => {
    if (!teamId || !meetingId) return;
    try {
      const updated = await updateMeetingTask(teamId, meetingId, task.id, { is_completed: !task.is_completed });
      setTasks(previous => previous.map(item => item.id === updated.id ? updated : item));
    } catch {
      showError('Не удалось обновить статус поручения');
    }
  };

  const handleSaveTask = async (task: MeetingTask) => {
    if (!teamId || !meetingId || !taskTitleDraft.trim()) {
      showError('Введите название поручения');
      return;
    }
    try {
      const updated = await updateMeetingTask(teamId, meetingId, task.id, {
        title: taskTitleDraft.trim(), description: taskDescriptionDraft.trim(),
      });
      setTasks(previous => previous.map(item => item.id === updated.id ? updated : item));
      setEditingTaskId(null);
      showSuccess('Поручение обновлено');
    } catch {
      showError('Не удалось сохранить поручение');
    }
  };

  const allowedFileExtensions = ['pdf', 'txt', 'md', 'doc', 'docx'];
  const maxTaskFilesSize = 10 * 1024 * 1024;

  const handleUploadFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const taskId = uploadingTaskId;
    event.target.value = '';
    if (!teamId || !meetingId || !taskId || !selectedFiles.length) return;

    const currentFiles = taskFiles[taskId] || [];
    const currentSize = currentFiles.reduce((total, file) => total + file.size_bytes, 0);
    const selectedSize = selectedFiles.reduce((total, file) => total + file.size, 0);
    if (currentSize + selectedSize > maxTaskFilesSize) {
      setUploadingTaskId(null);
      showError('Суммарный размер файлов одного поручения не должен превышать 10 МБ');
      return;
    }
    const invalidFile = selectedFiles.find(file => {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      return !allowedFileExtensions.includes(extension);
    });
    if (invalidFile) {
      setUploadingTaskId(null);
      showError('Поддерживаются только PDF, TXT, MD, DOC и DOCX');
      return;
    }

    try {
      const uploaded: MeetingTaskFile[] = [];
      for (const file of selectedFiles) {
        uploaded.push(await uploadMeetingTaskFile(teamId, meetingId, taskId, file));
      }
      setTaskFiles(previous => ({ ...previous, [taskId]: [...(previous[taskId] || []), ...uploaded] }));
      showSuccess(uploaded.length === 1 ? 'Файл прикреплён' : 'Файлы прикреплены');
    } catch (error) {
      console.error('Не удалось загрузить файл поручения:', error);
      showError('Не удалось загрузить файл. Проверьте размер и формат');
      try {
        const refreshedFiles = await getMeetingTaskFiles(teamId, meetingId, taskId);
        setTaskFiles(previous => ({ ...previous, [taskId]: refreshedFiles }));
      } catch { /* Сохраняем уже загруженный список */ }
    } finally {
      setUploadingTaskId(null);
    }
  };

  const handleDownloadTaskFile = async (taskId: string, file: MeetingTaskFile) => {
    if (!teamId || !meetingId) return;
    try {
      const blob = await downloadMeetingTaskFile(teamId, meetingId, taskId, file.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.original_filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Не удалось скачать файл:', error);
      showError('Не удалось скачать файл');
    }
  };

  const handleDeleteTaskFile = (taskId: string, file: MeetingTaskFile) => {
    if (!teamId || !meetingId) return;
    showConfirm({
      message: `Удалить файл «${file.original_filename}»?`,
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      onConfirm: async () => {
        try {
          await deleteMeetingTaskFile(teamId, meetingId, taskId, file.id);
          setTaskFiles(previous => ({ ...previous, [taskId]: (previous[taskId] || []).filter(item => item.id !== file.id) }));
          showSuccess('Файл удалён');
        } catch {
          showError('Не удалось удалить файл');
        }
      },
    });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!teamId || !meetingId) return;
    showConfirm({
      message: 'Вы уверены, что хотите удалить поручение?',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      onConfirm: async () => {
        try {
          await deleteMeetingTask(teamId, meetingId, taskId);
          setTasks(previous => previous.filter(item => item.id !== taskId));
          showSuccess('Поручение удалено');
        } catch {
          showError('Не удалось удалить поручение');
        }
      },
    });
  };

  const handleAddTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!teamId || !meetingId || !newTaskTitle.trim()) return;
    setAddingTask(true);
    try {
      const created = await createMeetingTask(teamId, meetingId, {
        title: newTaskTitle.trim(), description: newTaskDescription.trim(),
      });
      setTasks(previous => [...previous, created]);
      setNewTaskTitle('');
      setNewTaskDescription('');
      setTaskFormOpen(false);
      showSuccess('Поручение добавлено');
    } catch {
      showError('Не удалось добавить поручение');
    } finally { setAddingTask(false); }
  };

  const handleAddNextTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!teamId || !meetingId || !newNextTaskTitle.trim()) return;
    setAddingNextTask(true);
    try {
      await createTaskForNextMeeting(teamId, meetingId, {
        title: newNextTaskTitle.trim(), description: newNextTaskDescription.trim(),
      });
      setNewNextTaskTitle('');
      setNewNextTaskDescription('');
      setNextTaskFormOpen(false);
      showSuccess('Поручение добавлено к следующей встрече');
      const next = await getNextTeamMeeting(teamId, meetingId);
      setNextMeeting(next);
      setNextMeetingTasks(await getMeetingTasks(teamId, next.id).catch(() => []));
    } catch {
      showError('Не удалось добавить поручение для следующей встречи. Проверьте, что следующая встреча существует.');
    } finally { setAddingNextTask(false); }
  };

  const handleCarryTasks = async () => {
    if (!teamId || !meetingId) return;
    if (!nextMeeting) {
      showError('Сначала назначьте следующую встречу');
      return;
    }
    showConfirm({
      message: 'Перенести все незавершённые поручения на следующую встречу?',
      confirmText: 'Перенести',
      cancelText: 'Отмена',
      onConfirm: async () => {
        try {
          const carried = await carryTasksToNextMeeting(teamId, meetingId);
          let copiedFilesCount = 0;
          let failedFilesCount = 0;

          for (const carriedTask of carried) {
            if (!carriedTask.carried_from_task_id) continue;

            try {
              const sourceFiles = await getMeetingTaskFiles(teamId, meetingId, carriedTask.carried_from_task_id);
              for (const sourceFile of sourceFiles) {
                try {
                  const blob = await downloadMeetingTaskFile(
                    teamId, meetingId, carriedTask.carried_from_task_id, sourceFile.id
                  );
                  const copiedFile = new File([blob], sourceFile.original_filename, {
                    type: sourceFile.content_type || blob.type,
                  });
                  await uploadMeetingTaskFile(teamId, nextMeeting.id, carriedTask.id, copiedFile);
                  copiedFilesCount += 1;
                } catch (error) {
                  console.error(`Не удалось перенести файл ${sourceFile.original_filename}:`, error);
                  failedFilesCount += 1;
                }
              }
            } catch (error) {
              console.error(`Не удалось получить файлы исходного поручения ${carriedTask.carried_from_task_id}:`, error);
              failedFilesCount += 1;
            }
          }

          const next = await getNextTeamMeeting(teamId, meetingId);
          setNextMeeting(next);
          const [refreshedNextTasks, refreshedTasks] = await Promise.all([
            getMeetingTasks(teamId, next.id).catch(() => []),
            getMeetingTasks(teamId, meetingId).catch(() => []),
          ]);
          setNextMeetingTasks(refreshedNextTasks);
          setTasks(refreshedTasks);

          const refreshedFiles = await Promise.all(refreshedTasks.map(async task => {
            try { return [task.id, await getMeetingTaskFiles(teamId, meetingId, task.id)] as const; }
            catch { return [task.id, []] as const; }
          }));
          setTaskFiles(Object.fromEntries(refreshedFiles));

          if (failedFilesCount > 0) {
            showError(`Поручения перенесены (${carried.length}), но не удалось скопировать файлов: ${failedFilesCount}. Успешно скопировано: ${copiedFilesCount}.`);
          } else {
            showSuccess(`Перенос выполнен. Поручений: ${carried.length}, файлов скопировано: ${copiedFilesCount}`);
          }
        } catch (error) {
          console.error('Не удалось перенести поручения:', error);
          showError('Не удалось перенести поручения на следующую встречу');
        }
      },
    });
  };

  const handleDeleteMeeting = () => {
    if (!teamId || !meetingId) return;
    showConfirm({
      message: 'Вы уверены, что хотите удалить встречу? Это действие необратимо.',
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      onConfirm: async () => {
        try {
          await deleteTeamMeeting(teamId, meetingId);
          showSuccess('Встреча удалена');
          navigate(`/teams/${teamId}`);
        } catch {
          showError('Не удалось удалить встречу');
        }
      },
    });
  };

  const dateTime = (value: string) => new Date(value).toLocaleString('ru-RU', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  if (loading) return <div className="page-wrapper"><Header /><div className="loading-container">Загрузка...</div></div>;
  if (!meeting || !team) return <div className="page-wrapper"><Header /><div className="not-found">Встреча не найдена</div></div>;

  return (
    <div className={`page-wrapper meeting-view-page ${editingMeeting ? 'meeting-edit-mode' : ''}`}>
      <Header />
      <Breadcrumb items={[
        { label: 'Главная', path: '/' },
        { label: 'Все команды', path: '/teams' },
        { label: team.name, path: `/teams/${teamId}` },
        { label: 'Встреча' },
      ]} />
      <div className="meeting-view-header">
        <h1 className="page-title">{editingMeeting ? 'Редактирование встречи' : 'Встреча'}</h1>
        <div className="meeting-header-actions">
          {editingMeeting ? (
            <>
              <button type="submit" form="meeting-edit-form" className="meeting-save-btn" disabled={savingMeeting}>
                <CheckIcon /><span>{savingMeeting ? 'Сохранение…' : 'Сохранить'}</span>
              </button>
              <button type="button" className="meeting-delete-btn" onClick={handleDeleteMeeting}>
                <DeleteIcon /><span>Удалить</span>
              </button>
            </>
          ) : (
            <>
              <button type="button" className="meeting-delete-btn" onClick={handleDeleteMeeting}>
                <DeleteIcon /><span>Удалить</span>
              </button>
              <button type="button" className="edit-btn" onClick={() => { setEditingMeeting(true); navigate(`/teams/${teamId}/meetings/${meetingId}/edit`); }}>
                <EditIcon /><span>Редактировать</span>
              </button>
              <button type="button" className="meeting-back-btn meeting-back-btn-primary" onClick={() => navigate(`/teams/${teamId}`)}>
                <TeamIcon /><span>К команде</span>
              </button>
            </>
          )}
        </div>
      </div>

      <main className="meeting-content">
        {editingMeeting ? (
          <form id="meeting-edit-form" className="meeting-edit-form" onSubmit={handleSaveMeeting}>
            <div className="meeting-form-grid">
              <label className="meeting-field meeting-field-full"><span>Название:</span><input className="schedule-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Введите название встречи" required /></label>
              <div className="meeting-field meeting-field-full"><span>Дата и время:</span><div className="meeting-edit-datetime"><div className="date-picker-wrapper meeting-edit-date-picker"><DatePicker aria-label="Дата встречи" selected={startAt ? new Date(`${startAt.slice(0, 10)}T12:00:00`) : null} onChange={(date: Date | null) => { if (!date) return; const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, '0'); const day = String(date.getDate()).padStart(2, '0'); setStartAt(`${year}-${month}-${day}T${startAt.slice(11, 16) || '09:00'}`); }} dateFormat="dd.MM.yyyy" className="date-picker-input" required /><CalendarIcon /></div><input aria-label="Время встречи" className="time-input" type="time" value={startAt.slice(11, 16)} onChange={e => setStartAt(`${startAt.slice(0, 10)}T${e.target.value}`)} required /></div></div>
              <label className="meeting-field"><span>Длительность (мин):</span><input className="schedule-input" type="number" min={15} step={15} value={Math.max(0, Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / 60000) || 30)} onChange={e => { const minutes = Number(e.target.value); if (Number.isFinite(minutes) && minutes > 0 && startAt) setEndAt(new Date(new Date(startAt).getTime() + minutes * 60000 - new Date(startAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16)); }} /></label>
              <label className="meeting-field"><span>Место:</span><input className="schedule-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Введите место проведения" /></label>
              <label className="meeting-field meeting-field-full"><span>Ссылка:</span><input className="schedule-input" value={eventLink} onChange={e => setEventLink(e.target.value)} placeholder="https://..." /></label>
              <label className="meeting-field meeting-field-full"><span>Заметки:</span><textarea className="schedule-textarea" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Дополнительные заметки" /></label>
            </div>
          </form>
        ) : (
          <>
            <section className="meeting-info-section">
              <div className="meeting-info-block"><div className="info-label">Название встречи</div><div className="info-value">{meeting.title}</div></div>
              <div className="meeting-info-block"><div className="info-label">Дата и время</div><div className="info-value">{dateTime(meeting.start_at)} — {new Date(meeting.end_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div></div>
              <div className="meeting-info-block"><div className="info-label">Место</div><div className="info-value">{meeting.location || 'Не указано'}</div></div>
              <div className="meeting-info-block"><div className="info-label">Ссылка</div><div className="info-value">{meeting.event_link ? <a href={meeting.event_link} target="_blank" rel="noreferrer">{meeting.event_link}</a> : 'Не указана'}</div></div>
              <div className="meeting-info-block"><div className="info-label">Заметки</div><div className="info-value-description">{meeting.notes || 'Нет заметок'}</div></div>
            </section>

            <section className="meeting-tasks-section">
              <div className="meeting-section-heading"><h2>Поручения встречи</h2><div className="meeting-task-heading-actions"><span>{tasks.filter(task => task.is_completed).length} из {tasks.length} выполнено</span><button type="button" className="meeting-task-add-button" onClick={() => setTaskFormOpen(value => !value)}>{taskFormOpen ? <DeleteIcon /> : <PlusIcon />}<span>Добавить поручение</span></button></div></div>
              {taskFormOpen && <form className="meeting-task-create-form meeting-task-create-form-full" onSubmit={handleAddTask}>
                <input className="meeting-task-create-input" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Название поручения" required disabled={addingTask} />
                <textarea className="meeting-task-create-input meeting-task-create-description" value={newTaskDescription} onChange={e => setNewTaskDescription(e.target.value)} placeholder="Описание (необязательно)" disabled={addingTask} rows={3} />
                <div className="meeting-task-create-actions"><button type="button" className="meeting-task-cancel-button" onClick={() => setTaskFormOpen(false)} disabled={addingTask}>Отмена</button><button type="submit" className="meeting-task-save-button" disabled={addingTask || !newTaskTitle.trim()}>{addingTask ? 'Добавление…' : 'Добавить'}</button></div>
              </form>}
              <p className="meeting-task-files-hint">Форматы: PDF, TXT, MD, DOC, DOCX. Максимальный суммарный размер файлов одного поручения — 10 МБ.</p>
              <input
                ref={fileInputRef}
                className="meeting-task-file-input"
                type="file"
                accept=".pdf,.txt,.md,.doc,.docx"
                multiple
                onChange={handleUploadFiles}
              />
              <div className="meeting-task-list">
                {tasks.map(task => <div className={`meeting-task-row ${task.is_completed ? 'completed' : ''}`} key={task.id}>
                  {editingTaskId === task.id ? (
                    <div className="meeting-task-create-form meeting-task-edit-fields">
                      <input className="meeting-task-create-input" value={taskTitleDraft} onChange={e => setTaskTitleDraft(e.target.value)} aria-label="Название поручения" placeholder="Название поручения" />
                      <textarea className="meeting-task-create-input meeting-task-create-description" value={taskDescriptionDraft} onChange={e => setTaskDescriptionDraft(e.target.value)} aria-label="Описание поручения" placeholder="Описание (необязательно)" rows={3} />
                      <div className="meeting-task-create-actions"><button type="button" onClick={() => setEditingTaskId(null)} className="meeting-task-cancel-button">Отмена</button><button type="button" onClick={() => void handleSaveTask(task)} className="meeting-task-save-button" disabled={!taskTitleDraft.trim()}><CheckIcon />Сохранить</button></div>
                    </div>
                  ) : <>
                    <div className="meeting-task-main">
                      <button type="button" role="checkbox" aria-checked={task.is_completed} aria-label={task.is_completed ? 'Отметить невыполненным' : 'Отметить выполненным'} className={`task-checkbox ${task.is_completed ? 'completed' : ''}`} onClick={() => void handleToggleTask(task)}>
                        {task.is_completed && <span className="checkmark">✓</span>}
                      </button>
                      <span className="meeting-task-copy"><strong>{task.title}</strong>{task.description && <small>{task.description}</small>}{task.carried_from_task_id && <em>Перенесено с предыдущей встречи</em>}</span>
                    </div>
                    <div className="meeting-task-actions"><button type="button" className="meeting-icon-btn meeting-file-upload-btn" aria-label="Прикрепить файл" title="Прикрепить файл" onClick={() => { setUploadingTaskId(task.id); fileInputRef.current?.click(); }}><AttachmentUploadIcon /></button><button className="meeting-icon-btn" aria-label="Редактировать поручение" title="Редактировать поручение" onClick={() => { setEditingTaskId(task.id); setTaskTitleDraft(task.title); setTaskDescriptionDraft(task.description || ''); }}><EditIcon /></button><button type="button" className="meeting-icon-btn delete" aria-label="Удалить поручение" title="Удалить поручение" onClick={() => handleDeleteTask(task.id)}><DeleteIcon /></button></div>
                  </>}
                  {(taskFiles[task.id] || []).length > 0 && <div className="meeting-task-files">
                    {(taskFiles[task.id] || []).map(file => {
                      const extension = file.original_filename.split('.').pop()?.toUpperCase() || 'FILE';
                      return <div className="meeting-task-file-card" key={file.id} onClick={() => void handleDownloadTaskFile(task.id, file)} role="button" tabIndex={0} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') void handleDownloadTaskFile(task.id, file); }} title={file.original_filename}>
                        <AttachmentFileIcon />
                        <span className="meeting-task-file-details"><strong>{file.original_filename}</strong><small>{extension} · {(file.size_bytes / 1024).toFixed(0)} КБ</small></span>
                        <button type="button" className="meeting-task-file-delete" aria-label={`Удалить файл ${file.original_filename}`} title="Удалить файл" onClick={event => { event.stopPropagation(); handleDeleteTaskFile(task.id, file); }}><AttachmentDeleteIcon /></button>
                      </div>;
                    })}
                  </div>}
                </div>)}
                {tasks.length === 0 && <div className="meeting-empty">Поручений пока нет.</div>}
              </div>

              {nextMeeting && <button type="button" className="carry-tasks-btn" onClick={() => void handleCarryTasks()}>Перенести незавершённые поручения</button>}
            </section>

            <section className="meeting-tasks-section next-meeting-section">
              <div className="meeting-section-heading"><h2>Следующая встреча</h2>{nextMeeting && <button type="button" className="meeting-task-add-button" onClick={() => setNextTaskFormOpen(value => !value)}>{nextTaskFormOpen ? <DeleteIcon /> : <PlusIcon />}<span>Добавить поручение</span></button>}</div>
              {nextMeeting && nextTaskFormOpen && <form className="meeting-task-create-form meeting-task-create-form-full" onSubmit={handleAddNextTask}>
                <input className="meeting-task-create-input" value={newNextTaskTitle} onChange={e => setNewNextTaskTitle(e.target.value)} placeholder="Название поручения" required disabled={addingNextTask} />
                <textarea className="meeting-task-create-input meeting-task-create-description" value={newNextTaskDescription} onChange={e => setNewNextTaskDescription(e.target.value)} placeholder="Описание (необязательно)" disabled={addingNextTask} rows={3} />
                <div className="meeting-task-create-actions"><button type="button" className="meeting-task-cancel-button" onClick={() => setNextTaskFormOpen(false)} disabled={addingNextTask}>Отмена</button><button type="submit" className="meeting-task-save-button" disabled={addingNextTask || !newNextTaskTitle.trim()}>{addingNextTask ? 'Добавление…' : 'Добавить'}</button></div>
              </form>}
              {nextMeeting ? <div className="next-meeting-card"><strong>{nextMeeting.title}</strong><span>{dateTime(nextMeeting.start_at)}</span><Link to={`/teams/${teamId}/meetings/${nextMeeting.id}`}>Открыть встречу</Link></div> : <div className="meeting-empty meeting-empty-next"><span>Следующая встреча пока не назначена.</span><button type="button" className="meeting-create-next-button" onClick={() => setIsScheduleModalOpen(true)}><PlusIcon /><span>Создать встречу</span></button></div>}
              {nextMeeting && <div className="next-meeting-task-list">{nextMeetingTasks.length ? nextMeetingTasks.map(task => <div className={`next-meeting-task ${task.is_completed ? 'completed' : ''}`} key={task.id}><span>{task.title}</span>{task.description && <small>{task.description}</small>}{task.carried_from_task_id && <em>Перенесено</em>}</div>) : <div className="meeting-empty">Поручений для следующей встречи пока нет.</div>}</div>}

            </section>

          </>
        )}
      </main>
      <ScheduleMeetingModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSchedule={handleCreateNextMeeting}
        onScheduleRecurring={handleCreateRecurringMeetings}
        defaultTitle=""
      />
    </div>
  );
};

export default MeetingViewPage;
