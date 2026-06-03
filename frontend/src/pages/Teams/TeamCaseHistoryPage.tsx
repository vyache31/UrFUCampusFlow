import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { getTeamById, type Team } from '../../services/teams';
import { getTeamMembers, type TeamMember } from '../../services/teamMembers';
import { getTeamHistory, type TeamCaseHistory } from '../../services/teamCaseHistory';
import { ChevronDownIcon } from '../../components/common/Icons/Icons';
import './teamCaseHistoryPage.css';

interface ControlPoint {
  id: string;
  name: string;
  score: number | null;
}

const getTestControlPoints = (caseTitle: string): ControlPoint[] => {
  if (caseTitle.includes('TaskFlow')) {
    return [
      { id: '1', name: 'Анализ требований и проектирование', score: 85 },
      { id: '2', name: 'Разработка бэкенда', score: 78 },
      { id: '3', name: 'Разработка фронтенда', score: 90 },
      { id: '4', name: 'Интеграция и тестирование', score: 82 },
    ];
  }
  if (caseTitle.includes('AI') || caseTitle.includes('помощник')) {
    return [
      { id: '1', name: 'Сбор и подготовка данных', score: 88 },
      { id: '2', name: 'Обучение модели', score: 75 },
      { id: '3', name: 'Разработка API', score: 92 },
      { id: '4', name: 'Интеграция с Telegram-ботом', score: 80 },
    ];
  }
  return [
    { id: '1', name: 'Контрольная точка 1', score: 75 },
    { id: '2', name: 'Контрольная точка 2', score: 82 },
    { id: '3', name: 'Контрольная точка 3', score: 91 },
  ];
};

const TeamCaseHistoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [history, setHistory] = useState<TeamCaseHistory[]>([]);
  const [allMembers, setAllMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [controlPointsMap, setControlPointsMap] = useState<Map<string, ControlPoint[]>>(new Map());

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        const [teamData, historyData, membersData] = await Promise.all([
          getTeamById(id),
          getTeamHistory(id).catch(() => []),
          getTeamMembers(id, false).catch(() => []),
        ]);
        
        setTeam(teamData);
        setAllMembers(membersData);
        
        const sortedHistory = [...historyData].sort((a, b) => {
          if (a.is_current && !b.is_current) return -1;
          if (!a.is_current && b.is_current) return 1;
          return 0;
        });
        setHistory(sortedHistory);
        
        const pointsMap = new Map<string, ControlPoint[]>();
        historyData.forEach(c => {
          pointsMap.set(c.case_id, getTestControlPoints(c.case_title));
        });
        setControlPointsMap(pointsMap);
        
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

  const handleCaseClick = (caseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/cases/${caseId}`);
  };

  const toggleExpand = (historyId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCaseId(expandedCaseId === historyId ? null : historyId);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const wasMemberDuringCase = (member: TeamMember, caseStartedAt: string, caseEndedAt: string | null): boolean => {
    const joined = new Date(member.joined_at);
    const left = member.left_at ? new Date(member.left_at) : new Date();
    const caseStart = new Date(caseStartedAt);
    const caseEnd = caseEndedAt ? new Date(caseEndedAt) : new Date();
    
    return joined <= caseEnd && left >= caseStart;
  };

  const getMembersForCase = (caseStartedAt: string, caseEndedAt: string | null): TeamMember[] => {
    const activeMembers: TeamMember[] = [];
    const archivedMembers: TeamMember[] = [];
    
    allMembers.forEach(member => {
      const wasInTeam = wasMemberDuringCase(member, caseStartedAt, caseEndedAt);
      if (wasInTeam) {
        if (member.is_current) {
          activeMembers.push(member);
        } else {
          archivedMembers.push(member);
        }
      }
    });
    
    return [...activeMembers, ...archivedMembers];
  };

  const breadcrumbItems = [
    { label: 'Главная', path: '/' },
    { label: 'Все команды', path: '/teams' },
    { label: team?.name || 'Команда', path: `/teams/${id}` },
    { label: 'История кейсов' },
  ];

  if (loading) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="loading-container">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper team-history-page">
      <Header />
      <Breadcrumb items={breadcrumbItems} />

      <div className="history-header">
        <h1 className="page-title">История кейсов команды "{team?.name}"</h1>
      </div>

      <div className="history-content">
        {history.length > 0 ? (
          <div className="cases-list-view">
            {history.map((historyCase) => {
              const controlPoints = controlPointsMap.get(historyCase.case_id) || [];
              const isExpanded = expandedCaseId === historyCase.id;
              const membersForCase = getMembersForCase(historyCase.started_at, historyCase.ended_at);
              
              const isCurrentCase = historyCase.is_current;
              const caseStatus = isCurrentCase ? ' (Активный)' : ' (Архив)';
              
              return (
                <div key={historyCase.id} className="case-item-view">
                  <div className="case-header">
                    <span 
                      className="case-title"
                      onClick={(e) => handleCaseClick(historyCase.case_id, e)}
                    >
                      {historyCase.case_title}{caseStatus}
                    </span>
                    <div className="case-dates">
                      <span>{formatDate(historyCase.started_at)}</span>
                      {historyCase.ended_at && (
                        <span> — {formatDate(historyCase.ended_at)}</span>
                      )}
                    </div>
                    <div 
                      className="case-right"
                      onClick={(e) => toggleExpand(historyCase.id, e)}
                    >
                      <span className="expand-label">Подробнее</span>
                      <button className={`case-toggle-btn ${isExpanded ? 'expanded' : ''}`}>
                        <ChevronDownIcon />
                      </button>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="case-body">
                      {/* Контрольные точки */}
                      <div className="case-section">
                        <div className="section-title-2">Контрольные точки</div>
                        {controlPoints.length > 0 ? (
                          <div className="control-points-table">
                            <div className="control-points-header">
                              <span>Название</span>
                              <span>Оценка</span>
                            </div>
                            {controlPoints.map((point) => (
                              <div key={point.id} className="control-point-row">
                                <span className="point-name">{point.name}</span>
                                <span className="point-score">{point.score !== null ? point.score : '—'}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-placeholder">Нет контрольных точек</div>
                        )}
                      </div>

                      {/* Участники */}
                      <div className="case-section">
                        <div className="section-title-2">Участники</div>
                        {membersForCase.length > 0 ? (
                          <div className="members-table">
                            <div className="members-header">
                              <span>ФИО</span>
                              <span>Роль</span>
                              <span>Статус</span>
                            </div>
                            {membersForCase.map((member) => (
                              <div key={member.id} className="member-row">
                                <div className="member-name-wrapper">
                                  <span className="member-name">{member.student_name}</span>
                                  <span className="member-short-id">#{member.shortId}</span>
                                </div>
                                <div className="member-role">{member.position}</div>
                                <div className="member-status">
                                  {member.is_current ? 'Активен' : 'Архив'}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="empty-placeholder">Нет участников</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-history">
            Нет кейсов в истории команды
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamCaseHistoryPage;