import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoIcon, SearchIcon } from '../Icons/Icons';
import { searchAll, type SearchResult } from '../../../services/search';
import { connectOutlook, getOutlookStatus, disconnectOutlook } from '../../../services/outlook';
import { truncateWithTooltip } from '../../../utils/truncate';
import './header.css';

const USER_EMAIL_MAX_LENGTH = 30;

const Header = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isOutlookConnected, setIsOutlookConnected] = useState(false);
  const [isCheckingOutlook, setIsCheckingOutlook] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [userEmail, setUserEmail] = useState<string>('');
  
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Проверка авторизации при загрузке
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthenticated(true);
      try {
        const payload = token.split('.')[1];
        const decodedPayload = JSON.parse(atob(payload));
        setUserEmail(decodedPayload.sub || decodedPayload.email || '');
      } catch {
        setUserEmail('');
      }
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthenticated(false);
      setUserEmail('');
    }
  }, []);

  useEffect(() => {
    const checkOutlookStatus = async () => {
      if (!isAuthenticated) {
        setIsCheckingOutlook(false);
        return;
      }
      
      try {
        const status = await getOutlookStatus();
        setIsOutlookConnected(status.is_active);
      } catch {
        setIsOutlookConnected(false);
      } finally {
        setIsCheckingOutlook(false);
      }
    };
    checkOutlookStatus();
  }, [isAuthenticated]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    
    if (code) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOutlookConnected(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (error) {
      console.error('Ошибка авторизации Outlook:', error);
      alert('Не удалось подключить Outlook. Попробуйте снова.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const toggleDropdown = () => {
    if (isAuthenticated) {
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      navigate('/login');
    }
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
    setUserEmail('');
    navigate('/login');
  };

  const handleConnectOutlook = async () => {
    setIsDropdownOpen(false);
    try {
      const { authorize_url } = await connectOutlook();
      window.location.href = authorize_url;
    } catch (error) {
      console.error('Ошибка при подключении Outlook:', error);
      alert('Не удалось подключить Outlook');
    }
  };

  const handleDisconnectOutlook = async () => {
    setIsDropdownOpen(false);
    if (window.confirm('Вы уверены, что хотите отключить Outlook?')) {
      try {
        await disconnectOutlook();
        setIsOutlookConnected(false);
        alert('Outlook отключён');
      } catch {
        alert('Не удалось отключить Outlook');
      }
    }
  };

  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length >= 2) {
      const results = await searchAll(query);
      setSearchResults(results);
      setShowResults(true);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
    setIsSearching(false);
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSearching(true);
      debounceTimerRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 500);
    } else {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, performSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const wrapper = document.querySelector('.user-menu-wrapper');
      if (wrapper && !wrapper.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    setShowResults(false);
    setSearchQuery('');
    if (result.type === 'case') {
      navigate(`/cases/${result.id}`);
    } else {
      navigate(`/teams/${result.id}`);
    }
  };

  const { displayText, fullText } = truncateWithTooltip(userEmail, USER_EMAIL_MAX_LENGTH);
  const displayName = isAuthenticated && userEmail ? displayText : 'Войти';

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo" onClick={() => navigate('/')}>
          <LogoIcon />
        </div>
        <div className="search-wrapper" ref={searchRef}>
          <div className="search-bar">
            <SearchIcon />
            <input 
              type="text" 
              placeholder="Поиск кейсов и команд..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
            />
            {isSearching && (
              <div className="search-loading">загрузка...</div>
            )}
          </div>
          {showResults && searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result) => (
                <div 
                  key={`${result.type}-${result.id}`} 
                  className="search-result-item" 
                  onClick={() => handleResultClick(result)}
                >
                  <span className={`result-type ${result.type}`}>
                    {result.type === 'case' ? 'Кейс' : 'Команда'}
                  </span>
                  <span className="result-title">{result.title}</span>
                </div>
              ))}
            </div>
          )}
          {showResults && searchQuery.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
            <div className="search-results empty">
              <div className="search-result-item">Ничего не найдено</div>
            </div>
          )}
        </div>
      </div>
      <div className="user-menu-wrapper">
        <div 
          className={`user-name ${!isAuthenticated ? 'guest' : ''}`}
          onClick={toggleDropdown} 
          title={isAuthenticated ? fullText : ''}
        >
          {displayName}
        </div>
        {isAuthenticated && (
          <div className={`user-dropdown ${isDropdownOpen ? 'open' : ''}`} ref={dropdownRef}>
            {!isCheckingOutlook && !isOutlookConnected && (
              <button className="dropdown-item" onClick={handleConnectOutlook}>
                Связать с Outlook
              </button>
            )}
            {!isCheckingOutlook && isOutlookConnected && (
              <button className="dropdown-item" onClick={handleDisconnectOutlook}>
                Отвязать Outlook
              </button>
            )}
            <button className="dropdown-item" onClick={handleLogout}>
              Выйти
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;