import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { getTeamById, type Team } from '../../services/teams';
import { getCaseById } from '../../services/cases';
import { testTeamMeetings, type TeamMeeting } from '../../data/teamMeetings';
import { EditIcon, FlagIcon, ChevronDownIcon } from '../../components/common/Icons/Icons';
import ScheduleMeetingModal from '../../components/Modals/ScheduleMeetingModal';
import './teamViewPage.css';

const TeamViewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<{ name: string; role: string; university: string; group: string }[]>([]);
  const [teamCases, setTeamCases] = useState<{ id: string; title: string }[]>([]);
  const [notes, setNotes] = useState('');
  const [meetings] = useState<TeamMeeting[]>(testTeamMeetings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        const data = await getTeamById(id!);
        setTeam(data);
        setMembers(data.members || []);
        setNotes(data.notes || 'Не определено');
        
        if (data.caseId) {
          try {
            const caseData = await getCaseById(data.caseId);
            setTeamCases([{ id: caseData.id, title: caseData.title }]);
          } catch (err) {
            console.error('Ошибка загрузки кейса:', err);
            setTeamCases([]);
          }
        } else {
          setTeamCases([]);
        }
      } catch (err) {
        console.error('Ошибка загрузки команды:', err);
        setError('Команда не найдена');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTeam();
  }, [id]);

  const handleEdit = () => {
    navigate(`/teams/${id}/edit`);
  };

  const handleScheduleMeeting = (data: {
  date: string;
  time: string;
  repeatDays: string[];
  weekly: boolean;
}) => {
  console.log('Создать встречу:', data);
  // отправить запрос на бэкенд
};

  const handleControlPoints = (caseId: string) => {
    console.log('Открыть контрольные точки для кейса:', caseId);
  };

  const breadcrumbItems = [
    { label: 'Главная', path: '/' },
    { label: 'Все команды', path: '/teams' },
    { label: 'Просмотр команды' },
  ];

  if (loading) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="loading-container">Загрузка...</div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="not-found">{error || 'Команда не найдена'}</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper team-view-page">
      <Header />
      <Breadcrumb items={breadcrumbItems} />

      <div className="team-view-header">
        <h1 className="page-title">Просмотр команды</h1>
        <div className="header-buttons">
          <button 
            className="schedule-btn" 
            onClick={() => setIsScheduleModalOpen(true)}
          >
            <FlagIcon />
            <span>Назначить встречу</span>
          </button>
          <button className="edit-btn" onClick={handleEdit}>
            <EditIcon />
            <span>Редактировать</span>
          </button>
        </div>
      </div>

      <div className="team-content">
        <div className="info-block">
          <div className="info-label">Название команды</div>
          <div className="info-value">{team.name}</div>
        </div>

        <div className="info-block">
          <div className="info-label">Описание команды</div>
          <div className="info-value-description">{team.description || 'Нет описания'}</div>
        </div>

        <div className="info-block">
          <div className="info-label">Участники</div>
          {members.length > 0 ? (
            <div className="members-table">
              <div className="members-header">
                <span>ФИО</span>
                <span>Роль</span>
                <span>ВУЗ</span>
                <span>Группа</span>
              </div>
              {members.map((member, index) => (
                <div key={index} className="member-row">
                  <div className="member-name">{member.name}</div>
                  <div className="member-role">{member.role}</div>
                  <div className="member-university">{member.university}</div>
                  <div className="member-group">{member.group}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="info-value">Нет участников</div>
          )}
        </div>

        <div className="info-block">
          <div className="info-label">Заметки</div>
          <div className="info-value">{notes}</div>
        </div>

        <div className="info-block">
          <div className="info-label">Кейсы</div>
          {teamCases.length > 0 ? (
            <div className="cases-list-view">
              {teamCases.map((teamCase) => (
                <div key={teamCase.id} className="case-item-view">
                  <div className="case-header">
                    <span className="case-title">{teamCase.title}</span>
                    <div 
                      className="case-right" 
                      onClick={() => handleControlPoints(teamCase.id)}
                    >
                      <span className="control-points-label">Контрольные точки</span>
                      <button className="case-toggle-btn">
                        <ChevronDownIcon />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="info-value">Нет привязанных кейсов</div>
          )}
        </div>

        <div className="info-block">
          <div className="info-label">Состояние команды</div>
          <div className="info-value">{team.status}</div>
        </div>

        {/* Запланированные встречи (заглушка) */}
        <div className="info-block meetings-block">
          <div className="info-label">Запланированные встречи</div>
          <div className="meetings-scroll-container">
            <div className="meetings-header-row">
              <span>Проект</span>
              <span>день</span>
              <span>время</span>
            </div>
            <div className="meetings-list">
              {meetings.map((meeting) => (
                <div key={meeting.id} className="meeting-row-view">
                  <span className="meeting-project">{meeting.project}</span>
                  <span className="meeting-date">{meeting.date}</span>
                  <span className="meeting-time">{meeting.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно назначения встречи */}
      <ScheduleMeetingModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSchedule={handleScheduleMeeting}
      />
    </div>
  );
};

export default TeamViewPage;