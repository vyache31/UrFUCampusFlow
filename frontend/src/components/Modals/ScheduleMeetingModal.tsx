import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CloseIcon, CheckIcon, CalendarIcon, PlusIcon } from '../common/Icons/Icons';
import './Modal.css';

interface MeetingTask {
  title: string;
  description: string;
}

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (data: {
    title: string;
    date: string;
    time: string;
    durationMinutes: number;
    location: string;
    event_link: string;
    notes: string;
    tasks: MeetingTask[];
  }) => void;
  defaultTitle?: string;
}

const ScheduleMeetingModal = ({ isOpen, onClose, onSchedule, defaultTitle = '' }: ScheduleMeetingModalProps) => {
  const [title, setTitle] = useState(defaultTitle);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [time, setTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [location, setLocation] = useState('');
  const [eventLink, setEventLink] = useState('');
  const [notes, setNotes] = useState('');
  const [tasks, setTasks] = useState<MeetingTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);

  const formatDate = (date: Date | null): string => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const handleTimeChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const limited = cleaned.slice(0, 4);
    let formatted = limited;
    if (limited.length >= 3) {
      formatted = `${limited.slice(0, 2)}:${limited.slice(2, 4)}`;
    } else if (limited.length === 2) {
      formatted = `${limited}:`;
    }
    setTime(formatted);
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      setTasks([...tasks, { title: newTaskTitle.trim(), description: newTaskDesc.trim() }]);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setShowTaskInput(false);
    }
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (title.trim() && selectedDate && time) {
      onSchedule({ 
        title: title.trim(),
        date: formatDate(selectedDate),
        time,
        durationMinutes,
        location,
        event_link: eventLink,
        notes,
        tasks,
      });
      setTitle('');
      setSelectedDate(null);
      setTime('');
      setDurationMinutes(30);
      setLocation('');
      setEventLink('');
      setNotes('');
      setTasks([]);
      onClose();
    } else {
      alert('Заполните название встречи, дату и время');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="schedule-modal-overlay" onClick={onClose}>
      <div className="schedule-modal-container schedule-modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="schedule-modal-header">
          <button className="schedule-modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        
        <div className="schedule-modal-body">
          <div className="schedule-title">Параметры встречи</div>

          <div className="schedule-field">
            <label className="schedule-label">Название:</label>
            <input
              type="text"
              className="schedule-input"
              placeholder="Введите название встречи"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="schedule-date-row-single">
            <label className="schedule-label">Дата и время:</label>
            <div className="datetime-group">
              <div className="date-picker-wrapper">
                <DatePicker
                  selected={selectedDate}
                  onChange={handleDateChange}
                  dateFormat="dd.MM.yyyy"
                  placeholderText="ДД.ММ.ГГГГ"
                  className="date-picker-input"
                />
                <CalendarIcon />
              </div>
              <input
                type="text"
                className="time-input"
                placeholder="ЧЧ:ММ"
                value={time}
                onChange={(e) => handleTimeChange(e.target.value)}
                maxLength={5}
              />
            </div>
          </div>

          <div className="schedule-field">
            <label className="schedule-label">Длительность (мин):</label>
            <input
              type="number"
              className="schedule-input duration-input"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              min={15}
              step={15}
            />
          </div>

          <div className="schedule-field">
            <label className="schedule-label">Место:</label>
            <input
              type="text"
              className="schedule-input"
              placeholder="Введите место проведения"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="schedule-field">
            <label className="schedule-label">Ссылка:</label>
            <input
              type="text"
              className="schedule-input"
              placeholder="https://..."
              value={eventLink}
              onChange={(e) => setEventLink(e.target.value)}
            />
          </div>

          <div className="schedule-field">
            <label className="schedule-label">Заметки:</label>
            <textarea
              className="schedule-textarea"
              placeholder="Дополнительные заметки"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Поручения */}
          <div className="schedule-field tasks-section">
            <label className="schedule-label">Поручения:</label>
            <div className="tasks-wrapper">
              <div className="tasks-list">
                {tasks.map((task, index) => (
                  <div key={index} className="task-item">
                    <div className="task-content">
                      <div className="task-title">{task.title}</div>
                      {task.description && <div className="task-description">{task.description}</div>}
                    </div>
                    <button 
                      className="remove-task-btn"
                      onClick={() => handleRemoveTask(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              
              {showTaskInput ? (
                <div className="add-task-form">
                  <input
                    type="text"
                    className="task-title-input"
                    placeholder="Название поручения"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    autoFocus
                  />
                  <input
                    type="text"
                    className="task-desc-input"
                    placeholder="Описание (необязательно)"
                    value={newTaskDesc}
                    onChange={(e) => setNewTaskDesc(e.target.value)}
                  />
                  <div className="add-task-actions">
                    <button className="cancel-add-task" onClick={() => setShowTaskInput(false)}>
                      Отмена
                    </button>
                    <button className="confirm-add-task" onClick={handleAddTask}>
                      <CheckIcon />
                      <span>Добавить</span>
                    </button>
                  </div>
                </div>
              ) : (
                <button className="add-task-button" onClick={() => setShowTaskInput(true)}>
                  <PlusIcon />
                  <span>Добавить поручение</span>
                </button>
              )}
            </div>
          </div>
        </div>
        
        <div className="schedule-modal-footer">
          <button className="schedule-submit-btn" onClick={handleSubmit}>
            <CheckIcon />
            <span>Создать встречу</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleMeetingModal;