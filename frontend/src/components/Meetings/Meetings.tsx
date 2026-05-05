import { useState, useEffect } from 'react';
import { truncateMeetingProject, truncateMeetingTeam } from '../../utils/truncate';
import { ExpandArrowIcon, CollapseArrowIcon } from '../common/Icons/Icons';
import { getMeetings } from '../../services/meetings';
import type { Meeting } from '../../services/meetings';
import './meetings.css';

const Meetings = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        const data = await getMeetings();
        setMeetings(data.slice(0, 2));
      } catch (error) {
        console.error('Ошибка загрузки встреч:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMeetings();
  }, []);

  // Временная заглушка, пока нет данных с бэка
  const allMeetings = meetings;

  if (loading) return <div>Загрузка встреч...</div>;

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