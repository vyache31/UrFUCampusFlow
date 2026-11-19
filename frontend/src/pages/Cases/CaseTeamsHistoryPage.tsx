import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { getCaseById, type Case } from '../../services/cases';
import { getTeams, type Team } from '../../services/teams';
import {
  getTeamHistory,
  assignCaseToTeam,
  endCurrentCase,
  type TeamCaseHistory,
} from '../../services/teamCaseHistory';
import { CheckIcon, TeamIcon } from '../../components/common/Icons/Icons';
import { useToast } from '../../context/ToastContext';
import './caseTeamsHistoryPage.css';

type TeamHistoryEntry = {
  team: Team;
  history: TeamCaseHistory;
};

const TEAM_WORKING_STATUS = 'Работает над кейсом';

const formatSemester = (history: TeamCaseHistory): string => {
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

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const fetchCaseTeamsData = async (caseId: string) => {
  const [loadedCase, teams] = await Promise.all([
    getCaseById(caseId),
    getTeams(100),
  ]);

  const histories = await Promise.all(
    teams.map(async (team) => {
      try {
        return {
          team,
          history: await getTeamHistory(team.id),
        };
      } catch (err) {
        console.error(`Ошибка загрузки истории команды ${team.id}:`, err);
        return {
          team,
          history: [] as TeamCaseHistory[],
        };
      }
    }),
  );

  const active: TeamHistoryEntry[] = [];
  const archived: TeamHistoryEntry[] = [];
  const available: Team[] = [];

  histories.forEach(({ team, history }) => {
    const caseRecords = history.filter((item) => item.case_id === caseId);

    if (caseRecords.length > 0) {
      const currentRecord = caseRecords.find((item) => item.is_current);
      if (currentRecord) {
        active.push({ team, history: currentRecord });
        return;
      }

      const latestArchived = [...caseRecords].sort((a, b) => {
        const dateA = new Date(a.ended_at || a.started_at).getTime();
        const dateB = new Date(b.ended_at || b.started_at).getTime();
        return dateB - dateA;
      })[0];

      if (latestArchived) {
        archived.push({ team, history: latestArchived });
        return;
      }
    }

    const hasAnyActiveCase = history.some((item) => item.is_current);
    if (team.status === TEAM_WORKING_STATUS && !hasAnyActiveCase) {
      available.push(team);
    }
  });

  return { loadedCase, active, archived, available };
};

const CaseTeamsHistoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [caseData, setCaseData] = useState<Case | null>(null);
  const [activeTeams, setActiveTeams] = useState<TeamHistoryEntry[]>([]);
  const [archivedTeams, setArchivedTeams] = useState<TeamHistoryEntry[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [selectedActiveIds, setSelectedActiveIds] = useState<string[]>([]);
  const [selectedArchivedIds, setSelectedArchivedIds] = useState<string[]>([]);
  const [selectedAvailableIds, setSelectedAvailableIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(id ? '' : 'Кейс не найден');

  const applyLoadedData = (data: Awaited<ReturnType<typeof fetchCaseTeamsData>>) => {
    setCaseData(data.loadedCase);
    setActiveTeams(data.active);
    setArchivedTeams(data.archived);
    setAvailableTeams(data.available);
    setSelectedActiveIds([]);
    setSelectedArchivedIds([]);
    setSelectedAvailableIds([]);
    setError('');
  };

  const loadData = async () => {
    if (!id) return;

    try {
      const data = await fetchCaseTeamsData(id);
      applyLoadedData(data);
    } catch (err) {
      console.error('Ошибка загрузки истории команд кейса:', err);
      setError('Не удалось загрузить историю команд кейса');
    }
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    fetchCaseTeamsData(id)
      .then((data) => {
        if (!cancelled) applyLoadedData(data);
      })
      .catch((err) => {
        console.error('Ошибка загрузки истории команд кейса:', err);
        if (!cancelled) {
          setError('Не удалось загрузить историю команд кейса');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const toggleActiveSelect = (teamId: string) => {
    setSelectedActiveIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((item) => item !== teamId)
        : [...prev, teamId],
    );
  };

  const toggleArchivedSelect = (teamId: string) => {
    setSelectedArchivedIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((item) => item !== teamId)
        : [...prev, teamId],
    );
  };

  const toggleAvailableSelect = (teamId: string) => {
    setSelectedAvailableIds((prev) =>
      prev.includes(teamId)
        ? prev.filter((item) => item !== teamId)
        : [...prev, teamId],
    );
  };

  const handleMoveToArchive = async () => {
    if (selectedActiveIds.length === 0 || submitting) return;

    setSubmitting(true);
    try {
      const results = await Promise.allSettled(
        selectedActiveIds.map((teamId) => endCurrentCase(teamId)),
      );

      const failedCount = results.filter((r) => r.status === 'rejected').length;
      const successCount = results.length - failedCount;

      if (successCount > 0) {
        showSuccess(
          successCount === 1
            ? 'Команда перенесена в архив'
            : `В архив перенесено команд: ${successCount}`,
        );
      }
      if (failedCount > 0) {
        showError(`Не удалось перенести в архив команд: ${failedCount}`);
      }

      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturnToCase = async () => {
    if (selectedArchivedIds.length === 0 || submitting) return;

    setSubmitting(true);
    try {
      const entriesToAssign = archivedTeams.filter(({ team }) =>
        selectedArchivedIds.includes(team.id),
      );

      const results = await Promise.allSettled(
        entriesToAssign.map(({ team, history }) => {
          const caseSemestersId =
            caseData?.case_semesters_id || history.case_semesters_id;

          return assignCaseToTeam(team.id, {
            case_semesters_id: caseSemestersId,
            started_at: new Date().toISOString(),
            is_current: true,
          });
        }),
      );

      const failedCount = results.filter((r) => r.status === 'rejected').length;
      const successCount = results.length - failedCount;

      if (successCount > 0) {
        showSuccess(
          successCount === 1
            ? 'Команда возвращена в работу над кейсом'
            : `Возвращено в работу команд: ${successCount}`,
        );
      }
      if (failedCount > 0) {
        showError(`Не удалось назначить команд на кейс: ${failedCount}`);
      }

      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignAvailableToCase = async () => {
    if (selectedAvailableIds.length === 0 || submitting) return;

    const caseSemestersId = caseData?.case_semesters_id;
    if (!caseSemestersId) {
      showError('У кейса не указан семестр, невозможно назначить команду');
      return;
    }

    setSubmitting(true);
    try {
      const results = await Promise.allSettled(
        selectedAvailableIds.map((teamId) =>
          assignCaseToTeam(teamId, {
            case_semesters_id: caseSemestersId,
            started_at: new Date().toISOString(),
            is_current: true,
          }),
        ),
      );

      const failedCount = results.filter((r) => r.status === 'rejected').length;
      const successCount = results.length - failedCount;

      if (successCount > 0) {
        showSuccess(
          successCount === 1
            ? 'Команда назначена на кейс'
            : `Назначено на кейс команд: ${successCount}`,
        );
      }
      if (failedCount > 0) {
        showError(`Не удалось назначить команд на кейс: ${failedCount}`);
      }

      await loadData();
    } finally {
      setSubmitting(false);
    }
  };

  const breadcrumbItems = [
    { label: 'Главная', path: '/' },
    { label: 'Все кейсы', path: '/cases' },
    {
      label: caseData?.short_title || caseData?.title || 'Просмотр кейса',
      path: `/cases/${id}`,
    },
    { label: 'История команд' },
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

  const renderTeamCard = (
    team: Team,
    statusLabel: string,
    statusVariant: 'active' | 'archived' | 'available',
    isSelected: boolean,
    onToggle: (teamId: string) => void,
    history?: TeamCaseHistory,
  ) => {
    const semester = history ? formatSemester(history) : '';
    const period = history
      ? [formatDate(history.started_at), formatDate(history.ended_at)]
          .filter(Boolean)
          .join(' — ')
      : '';

    return (
      <div
        key={team.id}
        className={`case-history-team-card ${isSelected ? 'selected' : ''}`}
        onClick={() => navigate(`/teams/${team.id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            navigate(`/teams/${team.id}`);
          }
        }}
      >
        <button
          type="button"
          className={`case-history-checkbox ${isSelected ? 'checked' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggle(team.id);
          }}
          aria-label={`Выбрать команду ${team.name}`}
          aria-pressed={isSelected}
          disabled={submitting}
        >
          {isSelected && <CheckIcon />}
        </button>

        <span className="case-history-team-icon" aria-hidden="true">
          <TeamIcon />
        </span>

        <div className="case-history-team-details">
          <span className="case-history-team-name">{team.name}</span>

          <span className="case-history-team-description">
            {team.description?.trim() || 'Описание команды не указано'}
          </span>

          <div className="case-history-team-meta">
            <span className={`case-history-team-status ${statusVariant}`}>
              {statusLabel}
            </span>

            {semester && (
              <span className="case-history-team-semester">{semester}</span>
            )}

            {period && (
              <span className="case-history-team-dates">{period}</span>
            )}
          </div>
        </div>

        <span className="case-history-team-chevron" aria-hidden="true">
          ›
        </span>
      </div>
    );
  };

  return (
    <div className="page-wrapper case-teams-history-page">
      <Header />
      <Breadcrumb items={breadcrumbItems} />

      <div className="case-teams-history-header">
        <h1 className="page-title">История команд кейса «{caseData.title}»</h1>
      </div>

      <div className="case-teams-history-content">
        {/* Блок: В работе */}
        <section className="case-history-section">
          <div className="case-history-section-header">
            <div className="case-history-section-title-group">
              <h2 className="case-history-section-title">В работе</h2>
              <span className="case-history-count">{activeTeams.length}</span>
            </div>

            {activeTeams.length > 0 && (
              <button
                type="button"
                className="case-history-action-btn secondary"
                onClick={handleMoveToArchive}
                disabled={selectedActiveIds.length === 0 || submitting}
              >
                {submitting
                  ? 'Сохранение...'
                  : selectedActiveIds.length > 0
                    ? `Перенести в архив (${selectedActiveIds.length})`
                    : 'Перенести в архив'}
              </button>
            )}
          </div>

          {activeTeams.length === 0 ? (
            <div className="case-history-empty">
              Сейчас над этим кейсом не работает ни одна команда
            </div>
          ) : (
            <div className="case-history-list">
              {activeTeams.map(({ team, history }) =>
                renderTeamCard(
                  team,
                  'В работе',
                  'active',
                  selectedActiveIds.includes(team.id),
                  toggleActiveSelect,
                  history,
                ),
              )}
            </div>
          )}
        </section>

        {/* Блок: Архив */}
        <section className="case-history-section">
          <div className="case-history-section-header">
            <div className="case-history-section-title-group">
              <h2 className="case-history-section-title">Архив</h2>
              <span className="case-history-count archived">
                {archivedTeams.length}
              </span>
            </div>

            {archivedTeams.length > 0 && (
              <button
                type="button"
                className="case-history-action-btn primary"
                onClick={handleReturnToCase}
                disabled={selectedArchivedIds.length === 0 || submitting}
              >
                {submitting
                  ? 'Сохранение...'
                  : selectedArchivedIds.length > 0
                    ? `Вернуть в кейс (${selectedArchivedIds.length})`
                    : 'Вернуть в кейс'}
              </button>
            )}
          </div>

          {archivedTeams.length === 0 ? (
            <div className="case-history-empty">
              В архиве по этому кейсу пока нет команд
            </div>
          ) : (
            <div className="case-history-list">
              {archivedTeams.map(({ team, history }) =>
                renderTeamCard(
                  team,
                  'Архив',
                  'archived',
                  selectedArchivedIds.includes(team.id),
                  toggleArchivedSelect,
                  history,
                ),
              )}
            </div>
          )}
        </section>

        {/* Блок: Доступные команды без активного кейса */}
        <section className="case-history-section">
          <div className="case-history-section-header">
            <div className="case-history-section-title-group">
              <h2 className="case-history-section-title">Доступные команды</h2>
              <span className="case-history-count available">
                {availableTeams.length}
              </span>
            </div>

            {availableTeams.length > 0 && (
              <button
                type="button"
                className="case-history-action-btn primary"
                onClick={handleAssignAvailableToCase}
                disabled={selectedAvailableIds.length === 0 || submitting}
              >
                {submitting
                  ? 'Сохранение...'
                  : selectedAvailableIds.length > 0
                    ? `Назначить на кейс (${selectedAvailableIds.length})`
                    : 'Назначить на кейс'}
              </button>
            )}
          </div>

          {availableTeams.length === 0 ? (
            <div className="case-history-empty">
              Нет свободных команд в статусе «Работает над кейсом» без активного кейса
            </div>
          ) : (
            <div className="case-history-list">
              {availableTeams.map((team) =>
                renderTeamCard(
                  team,
                  'Без активного кейса',
                  'available',
                  selectedAvailableIds.includes(team.id),
                  toggleAvailableSelect,
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CaseTeamsHistoryPage;