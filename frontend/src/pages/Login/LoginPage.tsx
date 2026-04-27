import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoIcon } from '../../components/common/Icons/Icons';
import { validateFormWithRules, loginValidationRules } from '../../utils/validation';
import './loginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    const formData = { login, password };
    const { errors: validationErrors } = validateFormWithRules(formData, loginValidationRules);
    setErrors(validationErrors);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    setTouched({ login: true, password: true });
    
    const formData = { login, password };
    const { isValid, errors: validationErrors } = validateFormWithRules(formData, loginValidationRules);
    
    setErrors(validationErrors);
    
    if (isValid) {
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