import { useNavigate } from 'react-router-dom';
import './ssoPage.css';

const SSOPage = () => {
  const navigate = useNavigate();

  return (
    <div className="sso-page">
      <div className="sso-content">
        <div className="sso-icon">🔐</div>
        <h1 className="sso-title">Вход через корпоративный аккаунт</h1>
        <p className="sso-description">
          Этот способ входа пока в разработке.<br />
          Скоро он станет доступен.
        </p>
        <button className="sso-back-btn" onClick={() => navigate('/login')}>
          Назад ко входу
        </button>
      </div>
    </div>
  );
};

export default SSOPage;