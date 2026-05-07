import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoIcon, SearchIcon } from '../Icons/Icons';
import { searchAll, type SearchResult } from '../../../services/search';
import './header.css';

const Header = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    localStorage.removeItem('access_token');
    navigate('/login');
  };

  const handleConnectOutlook = () => {
    setIsDropdownOpen(false);
    console.log('Связать с Outlook');
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
                <div key={`${result.type}-${result.id}`} className="search-result-item" onClick={() => handleResultClick(result)}>
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
        <div className="user-name" onClick={toggleDropdown}>
          Данил Колбасенко
        </div>
        <div className={`user-dropdown ${isDropdownOpen ? 'open' : ''}`} ref={dropdownRef}>
          <button className="dropdown-item" onClick={handleConnectOutlook}>
            Связать с Outlook
          </button>
          <button className="dropdown-item" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;