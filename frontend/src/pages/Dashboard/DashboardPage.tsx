import { useEffect, useState } from 'react';
import Header from '../../components/common/Header/Header';
import ActionButtons from '../../components/ActionButtons/ActionButtons';
import Meetings from '../../components/Meetings/Meetings';
import PreviewSection from '../../components/PreviewSection/PreviewSection';
import { getAllUpcomingMeetings, type Meeting } from '../../services/meetings';
import { getCases, type Case } from '../../services/cases';
import { getTeams, type Team } from '../../services/teams';
import './dashboard.css';

const PREVIEW_COUNT = 2;

const DashboardPage = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [meetingsData, casesData, teamsData] = await Promise.all([
          getAllUpcomingMeetings(),
          getCases(PREVIEW_COUNT),
          getTeams(PREVIEW_COUNT),
        ]);
        if (cancelled) return;
        setMeetings(meetingsData);
        setCases(casesData.slice(0, PREVIEW_COUNT));
        setTeams(teamsData.slice(0, PREVIEW_COUNT));
      } catch (error) {
        console.error('Ошибка загрузки дашборда:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (isLoading) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="loading-container">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <Header />
      <ActionButtons />
      <main className="main-content">
        <Meetings meetings={meetings} />
        <PreviewSection
          title="Все кейсы"
          items={cases}
          type="case"
          allRoute="/cases"
          allLabel="Перейти ко всем кейсам"
        />
        <PreviewSection
          title="Команды"
          items={teams}
          type="team"
          allRoute="/teams"
          allLabel="Перейти ко всем командам"
        />
      </main>
    </div>
  );
};

export default DashboardPage;