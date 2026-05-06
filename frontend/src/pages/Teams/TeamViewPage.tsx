import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header/Header';
import Breadcrumb from '../../components/common/Breadcrumb/Breadcrumb';
import { getTeamById, type Team } from '../../services/teams';
import { EditIcon } from '../../components/common/Icons/Icons';
import './teamViewPage.css';

const TeamViewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setLoading(true);
        const data = await getTeamById(id!);
        setTeam(data);
      } catch (err) {
        console.error('Ошибка загрузки команды:', err);
        setError('Команда не найдена');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTeam();
  }, [id]);

  const handleEdit = () => {
    navigate(`/teams/${id}/edit`);
  };

  const breadcrumbItems = [
    { label: 'Главная', path: '/' },
    { label: 'Все команды', path: '/teams' },
    { label: 'Просмотр команды' },
  ];

  if (loading) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="loading-container">Загрузка...</div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="page-wrapper">
        <Header />
        <div className="not-found">{error || 'Команда не найдена'}</div>
      </div>
    );
  }

  return (
    <div className="page-wrapper team-view-page">
      <Header />
      <Breadcrumb items={breadcrumbItems} />

      <div className="team-view-header">
        <h1 className="page-title">Просмотр команды</h1>
        <button className="edit-btn" onClick={handleEdit}>
          <EditIcon />
          <span>Редактировать</span>
        </button>
      </div>

      <div className="team-content">
        <div className="info-block">
          <div className="info-label">Название команды</div>
          <div className="info-value">{team.name}</div>
        </div>

        <div className="info-block">
          <div className="info-label">Описание команды</div>
          <div className="info-value-description">{team.description || 'Нет описания'}</div>
        </div>

        <div className="info-block">
          <div className="info-label">Статус</div>
          <div className="info-value">
            <span className="status-badge">{team.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamViewPage;