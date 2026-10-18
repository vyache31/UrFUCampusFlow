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
  const [loading, setLoading] = useState(true);

  const fetchMeetings = async () => {
    try {
      const allMeetings = await getAllUpcomingMeetings();
      setMeetings(allMeetings);
    } catch (error) {
      console.error('Ошибка загрузки встреч:', error);
    }
  };

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      await fetchMeetings();
      setLoading(false);
    };
    loadAllData();
  }, []);

  if (loading) {
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
        <CasesSection />
        <TeamsSection />
      </main>
    </div>
  );
};

export default DashboardPage;