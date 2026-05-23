import { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CloseIcon, CheckIcon, CalendarIcon } from '../common/Icons/Icons';
import './Modal.css';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (data: {
    date: string;
    time: string;
    repeatDays: string[];
    weekly: boolean;
  }) => void;
}

const weekDays = [
  { value: 'пн', label: 'пн' },
  { value: 'вт', label: 'вт' },
  { value: 'ср', label: 'ср' },
  { value: 'чт', label: 'чт' },
  { value: 'пт', label: 'пт' },
];

const ScheduleMeetingModal = ({ isOpen, onClose, onSchedule }: ScheduleMeetingModalProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [time, setTime] = useState('');
  const [repeatDays, setRepeatDays] = useState<string[]>([]);
  const [weekly, setWeekly] = useState(false);

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

  const handleToggleDay = (day: string) => {
    setRepeatDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = () => {
    if (selectedDate && time) {
      onSchedule({ 
        date: formatDate(selectedDate),
        time,
        repeatDays, 
        weekly 
      });
      setSelectedDate(null);
      setTime('');
      setRepeatDays([]);
      setWeekly(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="schedule-modal-overlay" onClick={onClose}>
      <div className="schedule-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="schedule-modal-header">
          <button className="schedule-modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        
        <div className="schedule-modal-body">
          <div className="schedule-title">Параметры встречи</div>

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
            <label className="schedule-label">Повторяемость:</label>
            <div className="weekdays-row">
              {weekDays.map((day) => (
                <button
                  key={day.value}
                  className={`weekday-btn ${repeatDays.includes(day.value) ? 'active' : ''}`}
                  onClick={() => handleToggleDay(day.value)}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="weekly-checkbox">
            <div 
              className={`custom-checkbox ${weekly ? 'selected' : ''}`}
              onClick={() => setWeekly(!weekly)}
            >
              {weekly && <CheckIcon />}
            </div>
            <span className="weekly-label" onClick={() => setWeekly(!weekly)}>Еженедельно</span>
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