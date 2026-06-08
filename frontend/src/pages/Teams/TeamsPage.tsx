import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import TeamStatusFilter from '../../components/teams/TeamFilters/TeamStatusFilter';
import TeamBulkActionsBar from '../../components/teams/TeamBulkActions/TeamBulkActionsBar';
import TeamCard from '../../components/teams/TeamCard/TeamCard';
import { getTeams, deleteTeam, type Team } from '../../services/teams';
import { useToast } from '../../context/ToastContext';
import './teamsPage.css';

const TeamsPage = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showConfirm } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('Все команды');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const data = await getTeams(10000);
      const sortedTeams = [...data].sort((a, b) => {
        const dateA = new Date(a.created_at);
        const dateB = new Date(b.created_at);
        return dateB.getTime() - dateA.getTime();
      });
      setTeams(sortedTeams);
    } catch (error) {
      console.error('Ошибка загрузки команд:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadTeams = async () => {
      await fetchTeams();
    };
    loadTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTeams = teams.filter(team => {
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
    if (selectedTeamIds.length === 0) return;
    
    const confirmMessage = selectedTeamIds.length === 1 
      ? 'Вы уверены, что хотите удалить выбранную команду? Это действие необратимо.'
      : `Вы уверены, что хотите удалить ${selectedTeamIds.length} команд? Это действие необратимо.`;
    
    showConfirm({
      message: confirmMessage,
      onConfirm: async () => {
        try {
          for (const teamId of selectedTeamIds) {
            await deleteTeam(teamId);
          }
          await fetchTeams();
          setSelectedTeamIds([]);
          showSuccess('Команды успешно удалены');
        } catch (error) {
          console.error('Ошибка при удалении:', error);
          showError('Не удалось удалить некоторые команды.');
        }
      },
      onCancel: () => {},
      confirmText: 'Да',
      cancelText: 'Нет'
    });
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

  if (loading) {
    return (
      <div className="page-wrapper teams-page">
        <Header />
        <div className="loading-container">Загрузка команд...</div>
      </div>
    );
  }

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
            description={team.description || ''}
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