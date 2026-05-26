import { useState, useMemo } from 'react';
import { ExpandArrowIcon, CollapseArrowIcon } from '../common/Icons/Icons';
import MeetingDetailsModal from '../Modals/MeetingDetailsModal';
import type { Meeting } from '../../services/meetings';
import './meetings.css';

interface MeetingsProps {
  meetings: Meeting[];
  loading?: boolean;
  onTaskUpdate?: () => void;
}

const Meetings = ({ meetings, loading = false, onTaskUpdate }: MeetingsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const weeklyMeetings = useMemo(() => {
    const now = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(now.getDate() + 7);
    
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.start_at);
      return meetingDate >= now && meetingDate <= sevenDaysLater;
    });
  }, [meetings]);
  
  const upcomingMeetings = useMemo(() => {
    const now = new Date();
    return meetings.filter(meeting => new Date(meeting.start_at) > now);
  }, [meetings]);
  
  const displayedMeetings = isExpanded ? weeklyMeetings : upcomingMeetings.slice(0, 3);

  const handleMeetingClick = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <section className="section">
        <h2 className="section-title">Ближайшие встречи</h2>
        <div className="meetings-card">
          <div className="loading-meetings">Загрузка встреч...</div>
        </div>
      </section>
    );
  }

  if (meetings.length === 0) {
    return (
      <section className="section">
        <h2 className="section-title">Ближайшие встречи</h2>
        <div className="meetings-card">
          <div className="empty-meetings">Нет запланированных встреч</div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="section">
        <h2 className="section-title">Ближайшие встречи</h2>
        <div className="meetings-card">
          <div className="meetings-header">
            <span>Проект</span>
            <span>Команда</span>
            <span>день</span>
            <span>время</span>
            <span>дата</span>
          </div>

          {displayedMeetings.map((meeting) => {
            const meetingDate = new Date(meeting.start_at);
            const day = meetingDate.toLocaleDateString('ru-RU', { weekday: 'short' }).slice(0, 2);
            const date = meetingDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
            const time = meetingDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            
            const projectTitle = meeting.case_title || meeting.title;
            
            return (
              <div 
                key={meeting.id} 
                className="meeting-row clickable"
                onClick={() => handleMeetingClick(meeting)}
              >
                <span className="meeting-project-title" title={projectTitle}>
                  {projectTitle.length > 35 ? projectTitle.slice(0, 35) + '...' : projectTitle}
                </span>
                <span className="meeting-team-name">
                  {meeting.team_name || 'Без названия'}
                </span>
                <span>{day}</span>
                <span>{time}</span>
                <span>{date}</span>
              </div>
            );
          })}

          {weeklyMeetings.length > 3 && (
            <button className="expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? 'Свернуть' : `Развернуть на неделю (${weeklyMeetings.length})`}
              {isExpanded ? <CollapseArrowIcon /> : <ExpandArrowIcon />}
            </button>
          )}
          
          {/* Если встреч на неделю меньше 3, но есть ещё будущие встречи */}
          {weeklyMeetings.length <= 3 && upcomingMeetings.length > 3 && !isExpanded && (
            <button className="expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
              Развернуть все встречи
              <ExpandArrowIcon />
            </button>
          )}
        </div>
      </section>

      {selectedMeeting && selectedMeeting.team_id && (
        <MeetingDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          meeting={selectedMeeting}
          teamId={selectedMeeting.team_id}
          onTaskUpdate={onTaskUpdate}
        />
      )}
    </>
  );
};

export default Meetings;