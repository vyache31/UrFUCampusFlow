import { useNavigate } from 'react-router-dom';
import CaseCard from '../cases/CaseCard/CaseCard';
import { testCases } from '../../data/cases';
import './casesSection.css';

const CasesSection = () => {
  const navigate = useNavigate();
  const dashboardCases = testCases.slice(0, 2);
  
  const handleOpenFullCase = (caseId: string) => {
    navigate(`/cases/${caseId}`);
  };

  const handleComment = (caseId: string) => {
    navigate(`/cases/${caseId}/comments`);
  };

  const handleViewAllCases = () => {
    navigate('/cases');
  };

  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">Все кейсы</h2>
      </div>

      {dashboardCases.map((caseItem) => (
        <CaseCard
          key={caseItem.id}
          type="case"
          title={caseItem.title}
          description={caseItem.description}
          status={caseItem.status}
          defaultOpen={false}
          likes={caseItem.likes}
          dislikes={caseItem.dislikes}
          onOpenFull={() => handleOpenFullCase(caseItem.id)}
          onComment={() => handleComment(caseItem.id)}
          showCheckbox={false}  // ← СКРЫВАЕМ ЧЕКБОКС НА ГЛАВНОЙ
        />
      ))}

      <button className="view-all-btn" onClick={handleViewAllCases}>
        Перейти ко всем кейсам
      </button>
    </section>
  );
};

export default CasesSection;