import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoIcon, SearchIcon } from '../Icons/Icons';
import { searchAll, type SearchResult } from '../../../services/search';
import { connectOutlook, getOutlookStatus, disconnectOutlook } from '../../../services/outlook';
import { logout, getTokenPayload } from '../../../services/auth';
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
      const payload = getTokenPayload(token);
      setUserEmail((payload?.sub as string) || (payload?.email as string) || '');
    } else {
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

  const toggleDropdown = () => {
    if (isAuthenticated) {
      setIsDropdownOpen(!isDropdownOpen);
    } else {
      navigate('/login');
    }
  };

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
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
              placeholder="Поиск кейсов, команд и участников..." 
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
              {searchResults.map((result) => {
                if (result.type === 'student') {
                  return (
                    <div key={`student-${result.id}`} className="search-result-student-card">
                      <div className="student-card-header">
                        <span className="result-type student">Участник</span>
                        <span className="student-name">{result.name} #{result.shortId}</span>
                        <span className="student-group">{result.group}</span>
                      </div>
                      
                      {result.cases && result.cases.length > 0 && (
                        <div className="student-cases-list">
                          <div className="student-section-title">Кейсы:</div>
                          {[...result.cases]
                            .sort((a, b) => (a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1))
                            .map((caseItem, idx) => (
                              <div 
                                key={`case-${idx}`}
                                className="student-case-item clickable"
                                onClick={() => navigate(`/cases/${caseItem.id}`)}
                              >
                                <span className="case-title">{caseItem.title}</span>
                                <span className="case-semester">{caseItem.semester_name}</span>
                                <span className={`case-status ${caseItem.is_active ? 'active' : 'archived'}`}>
                                  {caseItem.is_active ? 'В работе' : 'Завершён'}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}

                      {result.teams && result.teams.length > 0 && (
                        <div className="student-teams-list">
                          <div className="student-section-title">Команды:</div>
                          {[...result.teams]
                            .sort((a, b) => (a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1))
                            .map((teamItem, idx) => (
                              <div 
                                key={`team-${idx}`}
                                className="student-team-item clickable"
                                onClick={() => navigate(`/teams/${teamItem.id}`)}
                              >
                                <span className="team-name">{teamItem.name}</span>
                                <span className={`team-status ${teamItem.is_active ? 'active' : 'archived'}`}>
                                  {teamItem.is_active ? 'В команде' : 'Вышел'}
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  );
                }
                
                return (
                  <div 
                    key={`${result.type}-${result.id}`}
                    className="search-result-item"
                    onClick={() => {
                      if (result.type === 'case') navigate(`/cases/${result.id}`);
                      else navigate(`/teams/${result.id}`);
                    }}
                  >
                    <span className={`result-type ${result.type}`}>
                      {result.type === 'case' ? 'Кейс' : 'Команда'}
                    </span>
                    <span className="result-title">{result.title}</span>
                    {result.semester && <span className="result-subtitle">{result.semester}</span>}
                    <span className="result-status">{result.status}</span>
                  </div>
                );
              })}
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