import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import CaseCard from '../cases/CaseCard/CaseCard';
import { getTeams } from '../../services/teams';
import type { Team } from '../../services/teams';
import '../CasesSection/casesSection.css';

const TeamsSection = () => {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const data = await getTeams();
        setTeams(data.slice(0, 2));
      } catch (error) {
        console.error('Ошибка загрузки команд:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  const handleViewAllTeams = () => {
    navigate('/teams');
  };

  if (loading) return <div>Загрузка команд...</div>;

  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">Команды</h2>
      </div>
      {teams.map((team) => (
        <CaseCard
          key={team.id}
          type="team"
          id={team.id}
          title={team.name}
          description={team.description}
          status={team.status}
        />
      ))}
      <button className="view-all-btn" onClick={handleViewAllTeams}>
        Перейти ко всем командам
      </button>
    </section>
  );
};

export default TeamsSection;