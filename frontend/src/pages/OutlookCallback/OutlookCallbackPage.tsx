import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { completeOutlookConnection } from '../../services/outlook';

const OutlookCallbackPage = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('Завершаем подключение Outlook...');
  const isConnectionStartedRef = useRef(false);

  useEffect(() => {
    const finishConnection = async () => {
      if (isConnectionStartedRef.current) {
        return;
      }

      isConnectionStartedRef.current = true;

      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        console.error('Ошибка авторизации Outlook:', error);
        setMessage('Не удалось подключить Outlook');
        alert('Не удалось подключить Outlook. Попробуйте снова.');
        navigate('/', { replace: true });
        return;
      }

      if (!code) {
        setMessage('Не получен код авторизации Outlook');
        alert('Не получен код авторизации Outlook');
        navigate('/', { replace: true });
        return;
      }

      try {
        await completeOutlookConnection(code);
        setMessage('Outlook подключён');
        navigate('/', { replace: true });
      } catch (err) {
        console.error('Ошибка при завершении подключения Outlook:', err);
        setMessage('Не удалось подключить Outlook');
        alert('Не удалось подключить Outlook. Попробуйте снова.');
        navigate('/', { replace: true });
      }
    };

    finishConnection();
  }, [navigate]);

  return (
    <main style={{ padding: '48px', fontFamily: 'sans-serif' }}>
      {message}
    </main>
  );
};

export default OutlookCallbackPage;
