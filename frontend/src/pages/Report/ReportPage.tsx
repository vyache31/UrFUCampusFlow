import { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { DownloadIcon } from '../../components/common/Icons/Icons';
import { getTeams, type Team, type TeamMember } from '../../services/teams';
import { getCaseById } from '../../services/cases';
import './reportPage.css';

interface ReportTeam {
  id: string;
  name: string;
  project: string;
  members: { name: string; group: string }[];
}

const ReportPage = () => {
  const [reportData, setReportData] = useState<ReportTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reportContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const teams = await getTeams();
        
        const reportTeams = await Promise.all(
          teams.map(async (team: Team) => {
            let projectName = 'Не указан';
            
            if (team.caseId) {
              try {
                const caseData = await getCaseById(team.caseId);
                projectName = caseData.title;
              } catch (err) {
                console.error('Ошибка загрузки кейса для команды:', team.name, err);
              }
            }
            
            return {
              id: team.id,
              name: team.name,
              project: projectName,
              members: team.members?.map((member: TeamMember) => ({
                name: member.name,
                group: member.group
              })) || []
            };
          })
        );
        
        setReportData(reportTeams);
      } catch (err) {
        console.error('Ошибка загрузки отчёта:', err);
        setError('Не удалось загрузить данные для отчёта');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, []);

  const handleDownloadReport = async () => {
  if (!reportContentRef.current) return;
  
  try {
    const element = reportContentRef.current;
    
    // стили для печати с отступами
    const originalPadding = element.style.padding;
    element.style.padding = '40px';
    
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });
    
    element.style.padding = originalPadding;
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgWidth = 190;
    const pageHeight = 277; 
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 10;
    
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight - 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save('report.pdf');
  } catch (error) {
    console.error('Ошибка при создании PDF:', error);
    alert('Не удалось создать PDF');
  }
};

  const breadcrumbItems = [
    { label: 'Главная', path: '/' },
    { label: 'Отчет' },
  ];

  if (loading) {
    return (
      <div className="page-wrapper report-page">
        <Header />
        <div className="loading-container">Загрузка данных для отчёта...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrapper report-page">
        <Header />
        <div className="error-container">{error}</div>
      </div>
    );
  }

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

      <div className="report-content" ref={reportContentRef}>
        {reportData.map((team) => (
          <div key={team.id} className="team-report-card">
            <div className="team-name">{team.name}</div>
            <div className="team-project">{team.project}</div>
            <div className="team-members">
              {team.members.length > 0 ? (
                team.members.map((member, index) => (
                  <div key={index} className="member-row">
                    <span className="member-name">{member.name}</span>
                    <span className="member-group">{member.group}</span>
                  </div>
                ))
              ) : (
                <div className="member-row">
                  <span className="member-name">Нет участников</span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {reportData.length === 0 && (
          <div className="empty-report">Нет данных для отображения</div>
        )}
      </div>
    </div>
  );
};

export default ReportPage;