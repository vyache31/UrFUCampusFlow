import { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { DownloadIcon } from '../../components/common/Icons/Icons';
import { getTeams, type Team } from '../../services/teams';
import { getTeamMembers, type TeamMember } from '../../services/teamMembers';
import { getTeamHistory } from '../../services/teamCaseHistory';
import { getTeamCurators } from '../../services/curators';
import { getAllMeetingAttendance } from '../../services/curators';
import { useToast } from '../../context/ToastContext';
import './reportPage.css';

interface ReportTeam {
  id: string;
  name: string;
  project: string;
  members: { name: string; role: string; group: string; shortId: string }[];
  curators: { email: string; attendanceCount: number }[];
}

const ReportPage = () => {
  const { showError, showSuccess } = useToast();
  const [reportData, setReportData] = useState<ReportTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reportContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const teams = await getTeams(10000);
        
        const activeTeams = teams.filter(team => team.status === 'Работает над кейсом');
        
        const reportTeams = await Promise.all(
          activeTeams.map(async (team: Team) => {
            let projectName = 'Не указан';
            
            try {
              const history = await getTeamHistory(team.id);
              const currentCase = history.find(h => h.is_current);
              if (currentCase) {
                projectName = currentCase.case_title;
              }
            } catch (err) {
              console.error('Ошибка загрузки кейса для команды:', team.name, err);
            }
            
            let members: { name: string; role: string; group: string; shortId: string }[] = [];
            try {
              const teamMembers = await getTeamMembers(team.id);
              members = teamMembers.map((member: TeamMember) => ({
                name: member.student_name,
                role: member.position,
                group: member.group || '—',
                shortId: member.shortId || member.student_id?.slice(-4) || '—'
              }));
            } catch (err) {
              console.error('Ошибка загрузки участников для команды:', team.name, err);
            }
            
            const curators: { email: string; attendanceCount: number }[] = [];
            try {
              const teamCurators = await getTeamCurators(team.id);
              const activeCurators = teamCurators.filter(c => c.is_current);
              
              const allAttendance = await getAllMeetingAttendance(team.id);
              
              for (const curator of activeCurators) {
                const assignment = teamCurators.find(c => c.user_id === curator.user_id);
                
                if (assignment) {
                  const attendanceCount = allAttendance.filter(a => 
                    a.curator_assignment_id === assignment.id && a.is_present === true
                  ).length;
                  
                  curators.push({
                    email: curator.email || `Куратор ${curator.user_id?.slice(-4)}`,
                    attendanceCount
                  });
                }
              }
            } catch (err) {
              console.error('Ошибка загрузки кураторов для команды:', team.name, err);
            }
            
            return {
              id: team.id,
              name: team.name,
              project: projectName,
              members: members,
              curators: curators
            };
          })
        );
        
        setReportData(reportTeams);
        showSuccess(`Загружено ${reportTeams.length} активных команд`);
      } catch (err) {
        console.error('Ошибка загрузки отчёта:', err);
        setError('Не удалось загрузить данные для отчёта');
        showError('Не удалось загрузить данные для отчёта');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownloadReport = async () => {
    if (!reportContentRef.current) return;
    
    try {
      const element = reportContentRef.current;
      
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
      showSuccess('Отчёт успешно сохранён');
    } catch (error) {
      console.error('Ошибка при создании PDF:', error);
      showError('Не удалось создать PDF');
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
              <div className="section-subtitle">Участники:</div>
              {team.members.length > 0 ? (
                team.members.map((member, index) => (
                  <div key={index} className="member-row">
                    <div className="member-info-wrapper">
                      <span className="member-name">{member.name}</span>
                      <span className="member-short-id">#{member.shortId}</span>
                    </div>
                    <span className="member-role">{member.role}</span>
                    <span className="member-group">{member.group || '—'}</span>
                  </div>
                ))
              ) : (
                <div className="member-row">
                  <span className="member-name">Нет участников</span>
                </div>
              )}
            </div>
            
            <div className="team-curators">
              <div className="section-subtitle">Кураторы и посещаемость:</div>
              {team.curators.length > 0 ? (
                team.curators.map((curator, index) => (
                  <div key={index} className="curator-row">
                    <span className="curator-name">{curator.email}</span>
                    <span className="curator-attendance">Посетил встреч: {curator.attendanceCount}</span>
                  </div>
                ))
              ) : (
                <div className="curator-row">
                  <span className="curator-name">Нет назначенных кураторов</span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {reportData.length === 0 && (
          <div className="empty-report">Нет активных команд для отображения</div>
        )}
      </div>
    </div>
  );
};

export default ReportPage;