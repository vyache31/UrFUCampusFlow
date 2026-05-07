import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { getTeamById, type Team } from '../../services/teams';
import { testTeamMeetings, type TeamMeeting } from '../../data/teamMeetings';
import { EditIcon, FlagIcon, ChevronDownIcon } from '../../components/common/Icons/Icons';
import ScheduleMeetingModal from '../../components/Modals/ScheduleMeetingModal';
import ControlPointsModal from '../../components/Modals/ControlPointsModal';
import './teamViewPage.css';

interface ControlPoint {
  id: string;
  name: string;
  score: number | null;
}

interface TeamMember {
  name: string;
  role: string;
  university: string;
  group: string;
}

// тестовые данные для демонстрации
const TEST_TEAM_MEMBERS: TeamMember[] = [
  { name: 'Абдыкеримов Бексултан Талантович', role: 'Аналитик', university: 'УрФУ', group: 'РИ-240932' },
  { name: 'Попова Анна Михайловна', role: 'Дизайнер / Фронтендер', university: 'УрФУ', group: 'РИ-240932' },
  { name: 'Семёнов Вячеслав Андреевич', role: 'Бэкендер', university: 'УрФУ', group: 'РИ-240932' },
  { name: 'Соловьев Даниил Сергеевич', role: 'Бэкендер', university: 'УрФУ', group: 'РИ-240932' },
  { name: 'Хамитова Ксения Андреевна', role: 'Дизайнер / Фронтендер', university: 'УрФУ', group: 'РИ-240932' },
];

const TEST_TEAM_CASES = [
  { id: 'test1', title: 'Разработка мобильного приложения для оценки кредитного риска МСБ' },
  { id: 'test2', title: 'Веб-приложение для автоматизации учета работы с ВУЗами' },
];

const TeamViewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>(TEST_TEAM_MEMBERS);
  const [teamCases, setTeamCases] = useState<{ id: string; title: string }[]>(TEST_TEAM_CASES);
  const [notes, setNotes] = useState('Не определено');
  const [meetings] = useState<TeamMeeting[]>(testTeamMeetings);
  const [loading, setLoading] = useState(true);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isControlPointsModalOpen, setIsControlPointsModalOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [selectedCaseTitle, setSelectedCaseTitle] = useState('');
  const [controlPointsMap, setControlPointsMap] = useState<Map<string, ControlPoint[]>>(new Map());

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        
        // пытаюсь получить из API
        const apiTeam = await getTeamById(id!);
        
        if (apiTeam) {
          setTeam(apiTeam);
          // если API вернул участников, использую их
          if (apiTeam.members && apiTeam.members.length > 0) {
            setMembers(apiTeam.members);
          }
          if (apiTeam.notes) {
            setNotes(apiTeam.notes);
          }
          if (apiTeam.caseName) {
            setTeamCases([{ id: apiTeam.caseId || id!, title: apiTeam.caseName }]);
          }
        } else {
          // если данных нет, беру тестовые
          setTeam({
            id: id!,
            name: 'Скомпилированные гении',
            description: 'Команда полного цикла разработки и сопровождения продуктов.',
            status: 'Работает над кейсом',
            createdAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Ошибка загрузки команды:', err);
        setTeam({
          id: id!,
          name: 'Скомпилированные гении',
          description: 'Команда полного цикла разработки и сопровождения продуктов.',
          status: 'Работает над кейсом',
          createdAt: new Date().toISOString(),
        });
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
  };

  const handleOpenControlPoints = (caseId: string, caseTitle: string) => {
    setSelectedCaseId(caseId);
    setSelectedCaseTitle(caseTitle);
    setIsControlPointsModalOpen(true);
  };

  const handleControlPointsChange = (points: ControlPoint[]) => {
    setControlPointsMap(prev => new Map(prev).set(selectedCaseId, points));
    console.log(`Изменены контрольные точки для кейса ${selectedCaseId}:`, points);
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
          <button className="schedule-btn" onClick={() => setIsScheduleModalOpen(true)}>
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
                      onClick={() => handleOpenControlPoints(teamCase.id, teamCase.title)}
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