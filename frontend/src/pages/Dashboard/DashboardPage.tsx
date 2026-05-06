import Header from '../../components/common/Header/Header';
import ActionButtons from '../../components/ActionButtons/ActionButtons';
import Meetings from '../../components/Meetings/Meetings';
import CasesSection from '../../components/CasesSection/CasesSection';
import TeamsSection from '../../components/TeamsSection/TeamsSection';
import './dashboard.css';

const DashboardPage = () => {
  return (
    <div className="page-wrapper">
      <Header />
      <ActionButtons />
      <main className="main-content">
        {<Meetings /> }  {/* API нет ещё*/}
        <CasesSection />
        <TeamsSection />
      </main>
    </div>
  );
};

export default DashboardPage;