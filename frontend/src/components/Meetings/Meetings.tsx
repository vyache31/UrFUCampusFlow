import { useState } from 'react';
import { testMeetings, weeklyMeetings } from '../../data';
import { truncateMeetingProject, truncateMeetingTeam } from '../../utils/truncate';
import { ExpandArrowIcon, CollapseArrowIcon } from '../common/Icons/Icons';
import './meetings.css';

const Meetings = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const visibleMeetings = testMeetings.slice(0, 2);
  const allMeetings = isExpanded ? [...visibleMeetings, ...weeklyMeetings] : visibleMeetings;

  return (
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

        {allMeetings.map((meeting) => {
          // Для таблицы встреч - сильная обрезка
          const { displayText: displayProject, fullText: fullProject } = truncateMeetingProject(meeting.project);
          const { displayText: displayTeam, fullText: fullTeam } = truncateMeetingTeam(meeting.teamName);
          
          return (
            <div key={meeting.id} className="meeting-row">
              <span title={fullProject}>{displayProject}</span>
              <span title={fullTeam}>{displayTeam}</span>
              <span>{meeting.day}</span>
              <span>{meeting.time}</span>
              <span>{meeting.date}</span>
            </div>
          );
        })}

        <button className="expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? 'Свернуть неделю' : 'Развернуть на неделю'}
          {isExpanded ? <CollapseArrowIcon /> : <ExpandArrowIcon />}
        </button>
      </div>
    </section>
  );
};

export default Meetings;