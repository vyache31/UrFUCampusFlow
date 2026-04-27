import { useNavigate } from 'react-router-dom';
import CaseCard from '../cases/CaseCard/CaseCard';
import { testTeams } from '../../data/teams';

const TeamsSection = () => {
  const navigate = useNavigate();

  const handleOpenFullTeam = (teamId: string) => {
    navigate(`/teams/${teamId}`);
  };

  const handleViewAllTeams = () => {
    navigate('/teams');
  };

  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">Команды</h2>
      </div>

      {testTeams.slice(0, 2).map((team) => (
        <CaseCard
          key={team.id}
          type="team"
          title={team.name}
          description={team.description}
          defaultOpen={false}
          onOpenFull={() => handleOpenFullTeam(team.id)}
        />
      ))}

      <button className="view-all-btn" onClick={handleViewAllTeams}>
        Перейти ко всем командам
      </button>
    </section>
  );
};

export default TeamsSection;