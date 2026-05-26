import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { getTeamById, type Team } from '../../services/teams';
import { getTeamMembers, type TeamMember } from '../../services/teamMembers';
import { getTeamHistory, type TeamCaseHistory } from '../../services/teamCaseHistory';
import { getTeamMeetings, createTeamMeeting, deleteTeamMeeting, createMeetingTask, type Meeting } from '../../services/meetings';
import { EditIcon, FlagIcon, ChevronDownIcon, CloseIcon, HistoryIcon } from '../../components/common/Icons/Icons';
import ScheduleMeetingModal from '../../components/Modals/ScheduleMeetingModal';
import ControlPointsModal from '../../components/Modals/ControlPointsModal';
import MeetingDetailsModal from '../../components/Modals/MeetingDetailsModal';
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
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isControlPointsModalOpen, setIsControlPointsModalOpen] = useState(false);
  const [isMeetingDetailsModalOpen, setIsMeetingDetailsModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
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
        
        const currentCaseData = historyData.find(h => h.is_current === true);
        
        const enrichedMeetings = await Promise.all(
          meetingsData.map(async (meeting) => {
            let shortTitle = currentCaseData?.case_title || meeting.title;
            if (currentCaseData?.case_id) {
              try {
                const caseResponse = await fetch(`http://localhost:8000/cases/${currentCaseData.case_id}`, {
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                  }
                });
                const caseData = await caseResponse.json();
                shortTitle = caseData.short_title || currentCaseData.case_title;
              } catch (error) {
                console.error('Ошибка загрузки кейса:', error);
                shortTitle = currentCaseData?.case_title || meeting.title;
              }
            }
            return {
              ...meeting,
              team_name: teamData.name,
              case_title: shortTitle,
            };
          })
        );
        
        setMeetings(enrichedMeetings);
        
      } catch (err) {
        console.error('Ошибка загрузки данных команды:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTeamData();
  }, [id]);

  const currentCase = teamHistory.find(h => h.is_current === true);

  const handleEdit = () => {
    navigate(`/teams/${id}/edit`);
  };

  const handleDeleteMeeting = async (meetingId: string, e: React.MouseEvent) => {
    e.stopPropagation(); 
    
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

  const handleMeetingClick = (meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setIsMeetingDetailsModalOpen(true);
  };

  const formatMeetingDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }),
      time: date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleHistory = () => {
    navigate(`/teams/${id}/history`);
  };
  
  const handleScheduleMeeting = async (data: {
    title: string;
    date: string;
    time: string;
    durationMinutes: number;
    location: string;
    event_link: string;
    notes: string;
    tasks: { title: string; description: string }[];
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
    
    const endDateTime = new Date(startDateTime.getTime() + data.durationMinutes * 60 * 1000);
    
    if (isNaN(startDateTime.getTime())) {
      alert('Пожалуйста, выберите корректную дату и время');
      return;
    }
    
    try {
      const newMeeting = await createTeamMeeting(id, {
        title: data.title,
        start_at: startDateTime.toISOString(),
        end_at: endDateTime.toISOString(),
        notes: data.notes || '',
        location: data.location || 'Онлайн',
        event_link: data.event_link || null,
      });
      
      if (data.tasks.length > 0) {
        console.log(`Создаем ${data.tasks.length} поручений...`);
        
        for (const task of data.tasks) {
          try {
            await createMeetingTask(id, newMeeting.id, {
              title: task.title,
              description: task.description || ''
            });
            console.log(`Поручение "${task.title}" создано`);
          } catch (taskError) {
            console.error(`Ошибка создания поручения "${task.title}":`, taskError);
          }
        }
      }
      
      const updatedMeetings = await getTeamMeetings(id);
      setMeetings(updatedMeetings);
      
      alert(`Встреча успешно создана!${data.tasks.length > 0 ? ` Создано поручений: ${data.tasks.length}` : ''}`);
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
          <button className="history-btn" onClick={handleHistory}>
            <HistoryIcon />
            <span>История кейсов</span>
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
                <span>Группа</span>
              </div>
              {members.map((member) => (
                <div key={member.id} className="member-row">
                  <div className="member-name">{member.student_name}</div>
                  <div className="member-role">{member.position}</div>
                  <div className="member-group">{member.group || '—'}</div>
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

        <div className="info-block">
          <div className="info-label">Состояние команды</div>
          <div className="info-value">{team.status}</div>
        </div>

        <div className="info-block meetings-block">
          <div className="info-label">Запланированные встречи</div>
          <div className="meetings-scroll-container">
            <div className="meetings-header-row">
              <span>Название встречи</span>
              <span>Дата</span>
              <span>Время</span>
              <span></span>
            </div>
            <div className="meetings-list">
              {meetings.length > 0 ? (
                meetings.map((meeting) => {
                  const { date, time } = formatMeetingDateTime(meeting.start_at);
                  return (
                    <div 
                      key={meeting.id} 
                      className="meeting-row-view clickable"
                      onClick={() => handleMeetingClick(meeting)}
                    >
                      <span className="meeting-project">{currentCase?.case_title || meeting.title}</span>
                      <span className="meeting-date">{date}</span>
                      <span className="meeting-time">{time}</span>
                      <button 
                        className="delete-meeting-btn"
                        onClick={(e) => handleDeleteMeeting(meeting.id, e)}
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
        defaultTitle={currentCase?.case_title || ''}
      />

      <ControlPointsModal
        isOpen={isControlPointsModalOpen}
        onClose={() => setIsControlPointsModalOpen(false)}
        caseTitle={selectedCaseTitle}
        initialPoints={controlPointsMap.get(selectedCaseId) || []}
        onPointsChange={handleControlPointsChange}
      />

      {selectedMeeting && (
        <MeetingDetailsModal
          isOpen={isMeetingDetailsModalOpen}
          onClose={() => {
            setIsMeetingDetailsModalOpen(false);
            setSelectedMeeting(null);
          }}
          meeting={selectedMeeting}
          teamId={id!}
        />
      )}
    </div>
  );
};

export default TeamViewPage;