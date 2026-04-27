import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoIcon, SearchIcon } from '../Icons/Icons';
import { testCases } from '../../../data/cases';
import type { Case } from '../../../data/cases';
import { testTeams } from '../../../data/teams';
import type { Team } from '../../../data/teams';
import './header.css';

interface SearchResult {
  id: string;
  type: 'case' | 'team';
  title: string;
  link: string;
}

const Header = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    navigate('/login');
  };

  const handleConnectOutlook = () => {
    setIsDropdownOpen(false);
    console.log('Связать с Outlook');
  };

  // Выносим поиск в отдельную функцию
  const performSearch = useCallback((query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    const lowerQuery = query.toLowerCase();
    
    const casesResults: SearchResult[] = testCases
      .filter((c: Case) => c.title.toLowerCase().includes(lowerQuery))
      .slice(0, 5)
      .map((c: Case) => ({
        id: c.id,
        type: 'case',
        title: c.title,
        link: `/cases/${c.id}`
      }));

    const teamsResults: SearchResult[] = testTeams
      .filter((t: Team) => t.name.toLowerCase().includes(lowerQuery))
      .slice(0, 5)
      .map((t: Team) => ({
        id: t.id,
        type: 'team',
        title: t.name,
        link: `/teams/${t.id}`
      }));

    const allResults = [...casesResults, ...teamsResults].slice(0, 8);
    setSearchResults(allResults);
    setIsSearchOpen(allResults.length > 0);
  }, []);

  // Поиск при изменении query
  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery, performSearch]);

  // Закрытие поиска при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    setSearchQuery('');
    setIsSearchOpen(false);
    navigate(result.link);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="search-highlight">{part}</mark> : part
    );
  };

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo" onClick={() => navigate('/')}>
          <LogoIcon />
        </div>
        <div className="search-container" ref={searchRef}>
          <div className="search-bar">
            <SearchIcon />
            <input
              ref={inputRef}
              type="text"
              placeholder="Поиск кейсов и команд..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchResults.length > 0 && setIsSearchOpen(true)}
            />
            {searchQuery && (
              <button 
                className="search-clear"
                onClick={() => {
                  setSearchQuery('');
                  inputRef.current?.focus();
                }}
              >
                ✕
              </button>
            )}
          </div>
          
          {isSearchOpen && searchResults.length > 0 && (
            <div className="search-dropdown">
              {searchResults.map((result) => (
                <div
                  key={`${result.type}-${result.id}`}
                  className="search-item"
                  onClick={() => handleResultClick(result)}
                >
                  <span className="search-item-type">
                    {result.type === 'case' ? '📄 Кейс' : '👥 Команда'}
                  </span>
                  <span className="search-item-title">
                    {highlightText(result.title, searchQuery)}
                  </span>
                </div>
              ))}
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