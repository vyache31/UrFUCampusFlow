import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import CaseCard from '../cases/CaseCard/CaseCard';
import { getCases } from '../../services/cases';
import type { Case } from '../../services/cases';
import './casesSection.css';

const CasesSection = () => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCases = async () => {
      try {
        const data = await getCases();
        setCases(data.slice(0, 2));
      } catch (error) {
        console.error('Ошибка загрузки кейсов:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  const handleViewAllCases = () => {
    navigate('/cases');
  };

  if (loading) return <div>Загрузка кейсов...</div>;

  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">Все кейсы</h2>
      </div>
      {cases.map((caseItem) => (
        <CaseCard
          key={caseItem.id}
          type="case"
          id={caseItem.id}
          title={caseItem.title}
          description={caseItem.description || caseItem.project_goals || ''}
          status={caseItem.status || 'На оценке'}
          likes={caseItem.likes || 0}
          dislikes={caseItem.dislikes || 0}
        />
      ))}
      <button className="view-all-btn" onClick={handleViewAllCases}>
        Перейти ко всем кейсам
      </button>
    </section>
  );
};

export default CasesSection;