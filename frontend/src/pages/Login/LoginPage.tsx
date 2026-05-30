import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoIcon } from '../../components/common/Icons/Icons';
import { login } from '../../services/auth';
import './loginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const validateField = (field: string, value: string): string => {
    if (field === 'email') {
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
    const error = validateField(field, field === 'email' ? email : password);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailError = validateField('email', email);
    const passwordError = validateField('password', password);
    
    if (emailError || passwordError) {
      setErrors({ email: emailError, password: passwordError });
      setTouched({ email: true, password: true });
      return;
    }
    
    try {
      setLoading(true);
      await login({ email, password });
      navigate('/');
    } catch (err) {
      console.error('Ошибка входа:', err);
      alert('Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  const handleSSOLogin = () => {
    navigate('/sso');
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
            <label className="input-label">Email</label>
            <input
              type="email"
              className={`login-input ${touched.email && errors.email ? 'error' : ''}`}
              placeholder="Введите email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
            />
            {touched.email && errors.email && (
              <span className="error-message">{errors.email}</span>
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

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <button className="sso-btn" onClick={handleSSOLogin}>
          Войти через корпоративный аккаунт (SSO)
        </button>
      </div>
    </div>
  );
};

export default LoginPage;