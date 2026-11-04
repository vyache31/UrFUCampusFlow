import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { getCaseById, type Case } from '../../services/cases';
import { getTeams, getTeamHistory, type Team, type TeamHistoryItem } from '../../services/teams';
import { EditIcon } from '../../components/common/Icons/Icons';
import './caseViewPage.css';

type TeamOnCase = {
  team: Team;
  history: TeamHistoryItem;
};

const formatSemester = (history: TeamHistoryItem): string => {
  const season = String(history.semester_season ?? '').trim();
  const normalizedSeason = season.toLowerCase();

  const seasonLabels: Record<string, string> = {
    fall: 'Осень',
    autumn: 'Осень',
    spring: 'Весна',
    summer: 'Лето',
    winter: 'Зима',
  };

  const localizedSeason = seasonLabels[normalizedSeason] ?? season;
  const year = history.semester_year;

  return [localizedSeason, year]
    .filter((value) => value !== undefined && value !== null && value !== '')
    .join(' ');
};

const CaseViewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teamsOnCase, setTeamsOnCase] = useState<TeamOnCase[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchCase = async () => {
      if (!id) {
        setError('Кейс не найден');
        setLoading(false);
        setTeamsLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      setCaseData(null);

      try {
        const data = await getCaseById(id);
        if (!cancelled) setCaseData(data);
      } catch (err) {
        console.error('Ошибка загрузки кейса:', err);
        if (!cancelled) setError('Кейс не найден');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const fetchTeamsForCase = async () => {
      if (!id) return;

      setTeamsLoading(true);
      setTeamsError('');
      setTeamsOnCase([]);

      try {
        const teams = await getTeams(100);

        const histories = await Promise.all(
          teams.map(async (team) => {
            try {
              return {
                team,
                history: await getTeamHistory(team.id),
              };
            } catch (err) {
              console.error(
                `Ошибка загрузки истории команды ${team.id}:`,
                err,
              );

              return {
                team,
                history: [] as TeamHistoryItem[],
              };
            }
          }),
        );

        if (cancelled) return;

        const matchingTeams = histories.flatMap(({ team, history }) => {
          const currentAssignment = history.find(
            (item) => item.case_id === id && item.is_current,
          );

          return currentAssignment
            ? [{ team, history: currentAssignment }]
            : [];
        });

        setTeamsOnCase(matchingTeams);
      } catch (err) {
        console.error('Ошибка загрузки команд кейса:', err);

        if (!cancelled) {
          setTeamsError(
            'Не удалось загрузить список команд. Попробуйте обновить страницу.',
          );
        }
      } finally {
        if (!cancelled) setTeamsLoading(false);
      }
    };

    fetchCase();
    fetchTeamsForCase();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleEdit = () => {
    navigate(`/cases/${id}/edit`);
  };

  const breadcrumbItems = [
    { label: 'Главная', path: '/' },
    { label: 'Все кейсы', path: '/cases' },
    { label: 'Просмотр кейса' },
  ];

  if (loading) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="loading-container">Загрузка...</div>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="not-found">{error || 'Кейс не найден'}</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper case-view-page">
      <Header />
      <Breadcrumb items={breadcrumbItems} />

      <div className="case-view-header">
        <h1 className="page-title">Просмотр кейса</h1>

        <button className="edit-btn" onClick={handleEdit}>
          <EditIcon />
          <span>Редактировать</span>
        </button>
      </div>

      <div className="case-content">
        <div className="info-block">
          <div className="info-label">Название кейса</div>
          <div className="info-value">{caseData.title}</div>
        </div>

        {caseData.short_title && (
          <div className="info-block">
            <div className="info-label">Короткое название</div>
            <div className="info-value">{caseData.short_title}</div>
          </div>
        )}

        <div className="info-block">
          <div className="info-label">Описание кейса</div>
          <div className="info-value-description">
            {caseData.project_goals || 'Не указано'}
          </div>
        </div>

        <div className="info-block">
          <div className="info-label">Предполагаемый результат</div>
          <div className="info-value-description">
            {caseData.required_result || 'Не указан'}
          </div>
        </div>

        <div className="info-block">
          <div className="info-label">Критерии оценки</div>
          <div className="info-value-description">
            {caseData.grade_criteria || 'Не указаны'}
          </div>
        </div>

        <div className="info-block">
          <div className="info-label">Семестр</div>
          <div className="info-value">
            {caseData.semester_name || 'Не указан'}
          </div>
        </div>

        <section
          className="case-teams-section"
          aria-labelledby="case-teams-title"
        >
          <div className="case-teams-heading">
            <div>
              <h2 id="case-teams-title" className="info-label">
                Команды на кейсе
              </h2>

              <p className="case-teams-caption">
                Команды, которые сейчас работают над этим кейсом
              </p>
            </div>

            {!teamsLoading && !teamsError && (
              <span className="case-teams-count">
                {teamsOnCase.length}
              </span>
            )}
          </div>

          {teamsLoading ? (
            <p className="case-teams-message">Загружаем команды...</p>
          ) : teamsError ? (
            <div
              className="case-teams-message case-teams-message-error"
              role="alert"
            >
              {teamsError}
            </div>
          ) : teamsOnCase.length === 0 ? (
            <div className="case-teams-empty">
              <div className="case-teams-empty-title">
                Пока нет назначенных команд
              </div>

              <p>
                Здесь появятся команды, которые будут назначены работать
                над этим кейсом.
              </p>
            </div>
          ) : (
            <div className="case-teams-list">
              {teamsOnCase.map(({ team, history }) => {
                const semester = formatSemester(history);

                return (
                  <button
                    type="button"
                    className="case-team-card"
                    key={team.id}
                    onClick={() => navigate(`/teams/${team.id}`)}
                    aria-label={`Открыть команду ${team.name}`}
                  >
                    <span className="case-team-icon" aria-hidden="true">
                      <svg
                        width="24"
                        height="22"
                        viewBox="0 0 24 22"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M16.3582 18.752L15.7182 13.628C15.6275 12.9022 15.2748 12.2346 14.7264 11.7506C14.178 11.2667 13.4717 10.9997 12.7402 11H10.5362C9.80517 11.0002 9.09932 11.2674 8.55133 11.7513C8.00333 12.2352 7.6509 12.9026 7.56024 13.628L6.91924 18.752C6.88407 19.0335 6.90918 19.3193 6.99292 19.5903C7.07666 19.8614 7.21712 20.1116 7.40495 20.3242C7.59279 20.5368 7.8237 20.707 8.08237 20.8235C8.34104 20.94 8.62154 21.0002 8.90524 21H14.3732C14.6569 21.0001 14.9372 20.9398 15.1958 20.8232C15.4543 20.7066 15.6851 20.5364 15.8729 20.3238C16.0606 20.1112 16.201 19.8611 16.2846 19.5901C16.3683 19.3191 16.3934 19.0334 16.3582 18.752Z"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          stroke="black"
                        />

                        <path
                          d="M14.6393 4C14.6393 5.65685 13.2961 7 11.6393 7C9.9824 7 8.63925 5.65685 8.63925 4C8.63925 2.34315 9.9824 1 11.6393 1C13.2961 1 14.6393 2.34315 14.6393 4Z"
                          strokeWidth="2"
                          stroke="black"
                        />

                        <path
                          d="M5.63925 8C5.63925 9.10457 4.74382 10 3.63925 10C2.53468 10 1.63925 9.10457 1.63925 8C1.63925 6.89543 2.53468 6 3.63925 6C4.74382 6 5.63925 6.89543 5.63925 8Z"
                          strokeWidth="2"
                          stroke="black"
                        />

                        <path
                          d="M21.6393 8C21.6393 9.10457 20.7438 10 19.6393 10C18.5347 10 17.6393 9.10457 17.6393 8C17.6393 6.89543 18.5347 6 19.6393 6C20.7438 6 21.6393 6.89543 21.6393 8Z"
                          strokeWidth="2"
                          stroke="black"
                        />

                        <path
                          d="M3.63925 13H3.33325C2.85981 12.9999 2.4017 13.1678 2.04042 13.4738C1.67914 13.7798 1.43813 14.204 1.36025 14.671L1.02725 16.671C0.979458 16.9575 0.994667 17.2511 1.07181 17.5311C1.14896 17.8112 1.2862 18.0711 1.47397 18.2928C1.66175 18.5144 1.89556 18.6925 2.15914 18.8146C2.42272 18.9368 2.70974 19 3.00025 19H6.63925M19.6392 13H19.9452C20.4187 12.9999 20.8768 13.1678 21.2381 13.4738C21.5993 13.7798 21.8404 14.204 21.9182 14.671L22.2512 16.671C22.299 16.9575 22.2838 17.2511 22.2067 17.5311C22.1295 17.8112 21.9923 18.0711 21.8045 18.2928C21.6167 18.5144 21.3829 18.6925 21.1194 18.8146C20.8558 18.9368 20.5687 19 20.2782 19H16.6392"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          stroke="black"
                        />
                      </svg>
                    </span>

                    <span className="case-team-details">
                      <span className="case-team-name">
                        {team.name}
                      </span>

                      <span className="case-team-description">
                        {team.description?.trim() ||
                          'Описание команды не указано'}
                      </span>

                      <span className="case-team-meta">
                        <span className="case-team-status">
                          Работает над кейсом
                        </span>

                        {semester && (
                          <span className="case-team-semester">
                            {semester}
                          </span>
                        )}
                      </span>
                    </span>

                    <span
                      className="case-team-chevron"
                      aria-hidden="true"
                    >
                      ›
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CaseViewPage;