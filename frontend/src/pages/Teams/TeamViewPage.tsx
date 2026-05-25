import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { getTeamById, type Team } from '../../services/teams';
import { getTeamMembers, type TeamMember } from '../../services/teamMembers';
import { getTeamHistory, type TeamCaseHistory } from '../../services/teamCaseHistory';
import { getTeamMeetings, createTeamMeeting, deleteTeamMeeting, type TeamMeeting } from '../../services/teamMeetings';
import { EditIcon, FlagIcon, ChevronDownIcon, CloseIcon } from '../../components/common/Icons/Icons';
import ScheduleMeetingModal from '../../components/Modals/ScheduleMeetingModal';
import ControlPointsModal from '../../components/Modals/ControlPointsModal';
import './teamViewPage.css';

interface ControlPoint {
  id: string;
  name: string;
  score: number | null;
}

const TeamViewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [teamHistory, setTeamHistory] = useState<TeamCaseHistory[]>([]);
  const [meetings, setMeetings] = useState<TeamMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isControlPointsModalOpen, setIsControlPointsModalOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedCaseTitle, setSelectedCaseTitle] = useState('');
  const [controlPointsMap, setControlPointsMap] = useState<Map<string, ControlPoint[]>>(new Map());

  useEffect(() => {
    const fetchTeamData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        const [teamData, membersData, historyData, meetingsData] = await Promise.all([
          getTeamById(id),
          getTeamMembers(id).catch(() => []),
          getTeamHistory(id).catch(() => []),
          getTeamMeetings(id).catch(() => []),
        ]);
        
        setTeam(teamData);
        setMembers(membersData);
        setTeamHistory(historyData);
        setMeetings(meetingsData);
        
      } catch (err) {
        console.error('Ошибка загрузки данных команды:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamData();
  }, [id]);

  const currentCase = teamHistory.find(h => h.is_current);
  const pastCases = teamHistory.filter(h => !h.is_current && h.ended_at);

  const handleEdit = () => {
    navigate(`/teams/${id}/edit`);
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!id) return;
    
    if (!window.confirm('Вы уверены, что хотите удалить эту встречу? Она также будет удалена из календаря Outlook.')) {
      return;
    }
    
    try {
      setDeletingMeetingId(meetingId);
      await deleteTeamMeeting(id, meetingId);
      setMeetings(prev => prev.filter(m => m.id !== meetingId));
      alert('Встреча успешно удалена');
    } catch (error) {
      console.error('Ошибка удаления встречи:', error);
      alert('Не удалось удалить встречу');
    } finally {
      setDeletingMeetingId(null);
    }
  };

  const formatMeetingDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }),
      time: date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleScheduleMeeting = async (data: {
    date: string;
    time: string;
    repeatDays: string[];
    weekly: boolean;
  }) => {
    if (!id || !currentCase) {
      alert('Нет активного кейса для назначения встречи');
      return;
    }
    
    const [day, month, year] = data.date.split('.');
    const [hours, minutes] = data.time.split(':');
    
    const startDateTime = new Date(
      parseInt(year), 
      parseInt(month) - 1, 
      parseInt(day), 
      parseInt(hours), 
      parseInt(minutes)
    );
    
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
    
    if (isNaN(startDateTime.getTime())) {
      alert('Пожалуйста, выберите корректную дату и время');
      return;
    }
    
    try {
      const repeatText = data.weekly 
        ? `Еженедельно по ${data.repeatDays.join(', ')}` 
        : 'Разовое мероприятие';
      
      const newMeeting = await createTeamMeeting(id, {
        title: currentCase.case_title,
        start_at: startDateTime.toISOString(),
        end_at: endDateTime.toISOString(),
        notes: repeatText,
        location: 'Онлайн',
      });
      
      setMeetings(prev => [...prev, newMeeting]);
      alert('Встреча успешно создана и добавлена в календарь Outlook!');
    } catch (err: unknown) {
      console.error('Ошибка создания встречи:', err);
      const error = err as { response?: { data?: { detail?: string } } };
      const errorMessage = error.response?.data?.detail || 'Не удалось создать встречу';
      alert(`Ошибка: ${errorMessage}`);
    }
  };

  const handleOpenControlPoints = (caseId: string, caseTitle: string) => {
    setSelectedCaseId(caseId);
    setSelectedCaseTitle(caseTitle);
    setIsControlPointsModalOpen(true);
  };

  const handleControlPointsChange = (points: ControlPoint[]) => {
    setControlPointsMap(prev => new Map(prev).set(selectedCaseId, points));
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

  if (!team) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="not-found">Команда не найдена</div>
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
          {currentCase && (
            <button className="schedule-btn" onClick={() => setIsScheduleModalOpen(true)}>
              <FlagIcon />
              <span>Назначить встречу</span>
            </button>
          )}
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
                <span>Группа</span>
              </div>
              {members.map((member) => (
                <div key={member.id} className="member-row">
                  <div className="member-name">{member.student_name}</div>
                  <div className="member-role">{member.position}</div>
                  <div className="member-group">—</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="info-value">Нет участников</div>
          )}
        </div>

        <div className="info-block">
          <div className="info-label">Заметки</div>
          <div className="info-value">{team.notes || 'Нет заметок'}</div>
        </div>

        {currentCase && (
          <div className="info-block">
            <div className="info-label">Текущий кейс</div>
            <div className="cases-list-view">
              <div className="case-item-view">
                <div className="case-header">
                  <span className="case-title">{currentCase.case_title}</span>
                  <div 
                    className="case-right" 
                    onClick={() => handleOpenControlPoints(currentCase.case_id, currentCase.case_title)}
                  >
                    <span className="control-points-label">Контрольные точки</span>
                    <button className="case-toggle-btn">
                      <ChevronDownIcon />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {pastCases.length > 0 && (
          <div className="info-block">
            <div className="info-label">История кейсов</div>
            <div className="cases-list-view">
              {pastCases.map((historyCase) => (
                <div key={historyCase.id} className="case-item-view">
                  <div className="case-header">
                    <span className="case-title">{historyCase.case_title}</span>
                    <div className="case-semester">
                      <span className="semester-badge">{historyCase.semester_name}</span>
                    </div>
                    <div className="case-dates">
                      <span>{new Date(historyCase.started_at).toLocaleDateString('ru-RU')}</span>
                      {historyCase.ended_at && (
                        <span> → {new Date(historyCase.ended_at).toLocaleDateString('ru-RU')}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="info-block">
          <div className="info-label">Состояние команды</div>
          <div className="info-value">{team.status}</div>
        </div>

        <div className="info-block meetings-block">
          <div className="info-label">Запланированные встречи</div>
          <div className="meetings-scroll-container">
            <div className="meetings-header-row">
              <span>Проект</span>
              <span>Дата</span>
              <span>Время</span>
              <span></span>
            </div>
            <div className="meetings-list">
              {meetings.length > 0 ? (
                meetings.map((meeting) => {
                  const { date, time } = formatMeetingDateTime(meeting.start_at);
                  return (
                    <div key={meeting.id} className="meeting-row-view">
                      <span className="meeting-project">{currentCase?.case_title || meeting.title}</span>
                      <span className="meeting-date">{date}</span>
                      <span className="meeting-time">{time}</span>
                      <button 
                        className="delete-meeting-btn"
                        onClick={() => handleDeleteMeeting(meeting.id)}
                        disabled={deletingMeetingId === meeting.id}
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="empty-meetings">
                  {currentCase 
                    ? 'Нет запланированных встреч. Нажмите "Назначить встречу" чтобы создать.'
                    : 'Нет активного кейса для назначения встреч'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ScheduleMeetingModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSchedule={handleScheduleMeeting}
      />

      <ControlPointsModal
        isOpen={isControlPointsModalOpen}
        onClose={() => setIsControlPointsModalOpen(false)}
        caseTitle={selectedCaseTitle}
        initialPoints={controlPointsMap.get(selectedCaseId) || []}
        onPointsChange={handleControlPointsChange}
      />
    </div>
  );
};

export default TeamViewPage;