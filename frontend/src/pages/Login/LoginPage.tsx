import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoIcon } from '../../components/common/Icons/Icons';
import './loginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Login:', login, 'Password:', password);
    navigate('/');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="logo-wrapper">
          <LogoIcon />
        </div>
        <h1 className="login-title">ВузПроектУчёт</h1>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label className="input-label">Логин</label>
            <input
              type="text"
              className="login-input"
              placeholder="Введите логин"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Пароль</label>
            <input
              type="password"
              className="login-input"
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="login-btn">
            Войти
          </button>
        </form>

        <button className="sso-btn" onClick={() => console.log('SSO login')}>
          Войти через корпоративный аккаунт (SSO)
        </button>
      </div>
    </div>
  );
};

export default LoginPage;