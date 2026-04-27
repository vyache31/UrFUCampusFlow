import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { DownloadIcon } from '../../components/common/Icons/Icons';
import { testReportData } from '../../data/report';
import './reportPage.css';

const ReportPage = () => {
  const handleDownloadReport = () => {
    console.log('Скачивание отчета...');
  };

  const breadcrumbItems = [
    { label: 'Главная', path: '/' },
    { label: 'Отчет' },
  ];

  return (
    <div className="page-wrapper report-page">
      <Header />
      <Breadcrumb items={breadcrumbItems} />

      <div className="report-header">
        <h1 className="page-title">Отчет</h1>
        <button className="download-btn" onClick={handleDownloadReport}>
          <DownloadIcon />
          <span>Скачать отчёт</span>
        </button>
      </div>

      <div className="report-content">
        {testReportData.map((team) => (
          <div key={team.id} className="team-report-card">
            <div className="team-name">{team.name}</div>
            <div className="team-project">{team.project}</div>
            <div className="team-members">
              {team.members.map((member, index) => (
                <div key={index} className="member-row">
                  <span className="member-name">{member.name}</span>
                  <span className="member-group">{member.group}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportPage;