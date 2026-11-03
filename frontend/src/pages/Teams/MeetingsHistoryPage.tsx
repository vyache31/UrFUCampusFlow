import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import TeamNameFilter from '../../components/teams/TeamFilters/TeamNameFilter';
import ScheduleMeetingModal from '../../components/Modals/ScheduleMeetingModal';
import { PlusIcon } from '../../components/common/Icons/Icons';
import { getAllMeetings, createTeamMeeting, createMeetingTask, type Meeting } from '../../services/meetings';
import { getTeams, type Team } from '../../services/teams';
import { getTeamHistory } from '../../services/teamCaseHistory';
import { createMeetingsSeries } from '../../services/meetingsSeries';
import { useToast } from '../../context/ToastContext';
import './meetingsHistoryPage.css';

const MeetingsHistoryPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showError, showSuccess } = useToast();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamFilter, setTeamFilter] = useState(searchParams.get('team') || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [meetingsData, teamsData] = await Promise.all([getAllMeetings(), getTeams(10000)]);
      setMeetings(meetingsData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Ошибка загрузки истории встреч:', error);
      showError('Не удалось загрузить встречи');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredMeetings = useMemo(() => meetings.filter(meeting =>
    !teamFilter || meeting.team_id === teamFilter
  ), [meetings, teamFilter]);

  const now = new Date();
  const pastMeetings = filteredMeetings.filter(meeting => new Date(meeting.start_at) < now).reverse();
  const upcomingMeetings = filteredMeetings.filter(meeting => new Date(meeting.start_at) >= now);

  const formatDate = (value: string) => {
    const date = new Date(value);
    return {
      day: date.toLocaleDateString('ru-RU', { weekday: 'short' }).slice(0, 2),
      date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }),
      time: date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const groupByMonth = (items: Meeting[]) => {
    const groups = new Map<string, Meeting[]>();
    items.forEach(meeting => {
      const key = new Date(meeting.start_at).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
      groups.set(key, [...(groups.get(key) || []), meeting]);
    });
    return Array.from(groups.entries());
  };

  const handleCreateMeeting = async (data: {
    title: string; date: string; time: string; durationMinutes: number; location: string;
    event_link: string; notes: string; tasks: { title: string; description: string }[];
  }) => {
    if (!teamFilter) {
      showError('Сначала выберите команду в фильтре');
      return;
    }
    try {
      const [day, month, year] = data.date.split('.');
      const [hours, minutes] = data.time.split(':');
      const startAt = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes));
      const endAt = new Date(startAt.getTime() + data.durationMinutes * 60000);
      const created = await createTeamMeeting(teamFilter, {
        title: data.title,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        location: data.location || 'Онлайн',
        event_link: data.event_link || null,
        notes: data.notes || '',
        tasks: data.tasks,
      });
      await loadData();
      showSuccess('Встреча успешно создана');
      if (created?.id) navigate(`/teams/${teamFilter}/meetings/${created.id}`);
    } catch (error) {
      console.error('Ошибка создания встречи:', error);
      showError('Не удалось создать встречу');
    }
  };

  const handleCreateSeries = async (data: {
    title: string; start_date: string; start_time: string; durationMinutes: number; location: string;
    event_link: string; notes: string; tasks: { title: string; description: string }[];
    recurrence_type: 'daily' | 'weekly' | 'biweekly' | 'monthly'; interval: number; days_of_week?: string[];
    end_type: 'after_occurrences' | 'by_date'; occurrences?: number; end_date?: string;
  }) => {
    if (!teamFilter) {
      showError('Сначала выберите команду в фильтре');
      return;
    }
    try {
      const history = await getTeamHistory(teamFilter);
      if (!history.some(item => item.is_current)) {
        showError('У команды нет активного кейса для создания встреч');
        return;
      }
      const [day, month, year] = data.start_date.split('.');
      const [hours, minutes] = data.start_time.split(':');
      const startAt = new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes));
      const endAt = new Date(startAt.getTime() + data.durationMinutes * 60000);
      const patternType = data.recurrence_type === 'monthly' ? 'monthly' :
        data.recurrence_type === 'daily' ? 'daily' : 'weekly';
      const days = data.days_of_week?.length ? data.days_of_week :
        patternType === 'weekly' ? [startAt.toLocaleDateString('en-US', { weekday: 'long' })] : undefined;
      await createMeetingsSeries(teamFilter, {
        title: data.title,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        location: data.location || '',
        event_link: data.event_link || '',
        notes: data.notes || '',
        recurrence: {
          pattern: { type: patternType, interval: data.interval, days_of_week: days },
          range: {
            type: data.end_type === 'after_occurrences' ? 'numbered' : 'endDate',
            start_date: `${year}-${month}-${day}`,
            ...(data.end_type === 'after_occurrences' && data.occurrences ? { number_of_occurrences: data.occurrences } : {}),
            ...(data.end_type === 'by_date' && data.end_date ? { end_date: data.end_date } : {}),
          },
        },
      });
      const updatedMeetings = await getAllMeetings();
      const firstMeeting = updatedMeetings
        .filter(meeting => meeting.team_id === teamFilter && meeting.title === data.title && new Date(meeting.start_at) >= startAt)
        .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())[0];
      if (firstMeeting && data.tasks.length) {
        await Promise.all(data.tasks.map(task => createMeetingTask(teamFilter, firstMeeting.id, task)));
      }
      setMeetings(updatedMeetings);
      showSuccess('Серия встреч успешно создана');
    } catch (error) {
      console.error('Ошибка создания серии встреч:', error);
      showError('Не удалось создать серию встреч');
    }
  };

  const renderMeetings = (items: Meeting[], emptyText: string) => (
    <div className="meetings-card meetings-history-card">
      {items.length ? groupByMonth(items).map(([month, monthMeetings]) => (
        <div className="meetings-month-group" key={month}>
          <h3 className="meetings-month-title">{month}</h3>
          <div className="meetings-header">
            <span>Проект</span>
            <span>Команда</span>
            <span>день</span>
            <span>время</span>
            <span>дата</span>
          </div>
          {monthMeetings.map(meeting => {
            const date = formatDate(meeting.start_at);
            const title = meeting.case_title || meeting.title;
            return (
              <div
                key={meeting.id}
                className="meeting-row meetings-history-row clickable"
                role="button"
                tabIndex={0}
                onClick={() => meeting.team_id && navigate(`/teams/${meeting.team_id}/meetings/${meeting.id}`)}
              >
                <span className="meeting-project-title" title={title}>{title}</span>
                <span className="meeting-team-name">{meeting.team_name || 'Без названия'}</span>
                <span>{date.day}</span>
                <span>{date.time}</span>
                <span>{date.date}</span>
              </div>
            );
          })}
        </div>
      )) : <div className="empty-meetings">{emptyText}</div>}
    </div>
  );

  return (
    <div className="page-wrapper meetings-history-page">
      <Header />
      <Breadcrumb items={[{ label: 'Главная', path: '/' }, { label: 'Все встречи' }]} />
      <div className="meetings-history-header">
        <TeamNameFilter teams={teams} currentTeamId={teamFilter} onTeamChange={setTeamFilter} />
        <button className="schedule-btn" onClick={() => setIsModalOpen(true)}>
          <PlusIcon />
          <span>Создать встречу</span>
        </button>
      </div>
      {loading ? <div className="loading-container">Загрузка встреч...</div> : (
        <main className="meetings-history-content">
          <section className="meetings-history-section">
            <h2 className="meetings-history-title">Предстоящие встречи</h2>
            {renderMeetings(upcomingMeetings, 'Нет предстоящих встреч')}
          </section>
          <section className="meetings-history-section">
            <h2 className="meetings-history-title">Прошедшие встречи</h2>
            {renderMeetings(pastMeetings, 'Нет прошедших встреч')}
          </section>
        </main>
      )}
      <ScheduleMeetingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSchedule={handleCreateMeeting}
        onScheduleRecurring={handleCreateSeries}
      />
    </div>
  );
};

export default MeetingsHistoryPage;
