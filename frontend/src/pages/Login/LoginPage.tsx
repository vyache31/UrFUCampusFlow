import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoIcon } from '../../components/common/Icons/Icons';
import './loginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: string, value: string): string => {
    if (field === 'login') {
      if (!value.trim()) {
        return 'Введите логин';
      }
      if (value.trim().length < 3) {
        return 'Логин должен быть не менее 3 символов';
      }
    }
    if (field === 'password') {
      if (!value.trim()) {
        return 'Введите пароль';
      }
      if (value.trim().length < 4) {
        return 'Пароль должен быть не менее 4 символов';
      }
    }
    return '';
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, field === 'login' ? login : password);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouched({ login: true, password: true });
    
    const loginError = validateField('login', login);
    const passwordError = validateField('password', password);
    
    const newErrors = {
      login: loginError,
      password: passwordError
    };
    
    setErrors(newErrors);
    
    if (!loginError && !passwordError) {
      console.log('Login:', login);
      navigate('/');
    }
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
              className={`login-input ${touched.login && errors.login ? 'error' : ''}`}
              placeholder="Введите логин"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              onBlur={() => handleBlur('login')}
            />
            {touched.login && errors.login && (
              <span className="error-message">{errors.login}</span>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">Пароль</label>
            <input
              type="password"
              className={`login-input ${touched.password && errors.password ? 'error' : ''}`}
              placeholder="Введите пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur('password')}
            />
            {touched.password && errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
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