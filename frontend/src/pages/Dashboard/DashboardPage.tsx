import { useState, useEffect } from 'react';
import Header from '../../components/common/Header/Header';
import ActionButtons from '../../components/ActionButtons/ActionButtons';
import Meetings from '../../components/Meetings/Meetings';
import CasesSection from '../../components/CasesSection/CasesSection';
import TeamsSection from '../../components/TeamsSection/TeamsSection';
import { getAllUpcomingMeetings } from '../../services/meetings';
import type { Meeting } from '../../services/meetings';
import './dashboard.css';

const DashboardPage = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loadingMeetings, setLoadingMeetings] = useState(true);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoadingMeetings(true);
        // Получаем все встречи со всех команд
        const allMeetings = await getAllUpcomingMeetings();
        setMeetings(allMeetings);
      } catch (error) {
        console.error('Ошибка загрузки встреч:', error);
      } finally {
        setLoadingMeetings(false);
      }
    };
    fetchMeetings();
  }, []);

  return (
    <div className="page-wrapper">
      <Header />
      <ActionButtons />
      <main className="main-content">
        <Meetings meetings={meetings} loading={loadingMeetings} />
        <CasesSection />
        <TeamsSection />
      </main>
    </div>
  );
};

export default DashboardPage;