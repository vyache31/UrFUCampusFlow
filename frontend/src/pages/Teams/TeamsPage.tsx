import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import TeamStatusFilter from '../../components/teams/TeamFilters/TeamStatusFilter';
import TeamBulkActionsBar from '../../components/teams/TeamBulkActions/TeamBulkActionsBar';
import TeamCard from '../../components/teams/TeamCard/TeamCard';
import { testTeams } from '../../data/teams';
import './teamsPage.css';

const TeamsPage = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('Все команды');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  const filteredTeams = testTeams.filter(team => {
    if (statusFilter !== 'Все команды' && team.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const handleTeamSelect = (teamId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedTeamIds(prev => [...prev, teamId]);
    } else {
      setSelectedTeamIds(prev => prev.filter(id => id !== teamId));
    }
  };

  const handleDelete = () => {
    alert(`Удалить команды: ${selectedTeamIds.join(', ')}`);
  };

  const handleCreateTeam = () => {
    navigate('/teams/create');
  };

  const handleOpenFullTeam = (teamId: string) => {
    navigate(`/teams/${teamId}`);
  };

  const breadcrumbItems = [
    { label: 'Главная', path: '/' },
  ];

  return (
    <div className="page-wrapper teams-page">
      <Header />
      <Breadcrumb items={breadcrumbItems} />

      <div className="teams-filters-section">
        <div className="teams-filters-header">
          <div className="teams-filters-left">
            <TeamStatusFilter currentStatus={statusFilter} onStatusChange={setStatusFilter} />
          </div>
          <TeamBulkActionsBar
            selectedCount={selectedTeamIds.length}
            onDelete={handleDelete}
            onCreate={handleCreateTeam}
          />
        </div>
      </div>

      <div className="teams-wrapper">
        {filteredTeams.map((team) => (
          <TeamCard
            key={team.id}
            id={team.id}
            name={team.name}
            description={team.description}
            status={team.status}
            defaultOpen={false}
            onOpenFull={handleOpenFullTeam}
            showCheckbox={true}
            isSelected={selectedTeamIds.includes(team.id)}
            onSelect={(selected) => handleTeamSelect(team.id, selected)}
          />
        ))}
        {filteredTeams.length === 0 && (
          <div className="empty-teams">
            Нет команд, соответствующих фильтрам
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamsPage;