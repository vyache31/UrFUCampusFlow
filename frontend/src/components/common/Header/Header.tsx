import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogoIcon, SearchIcon } from '../Icons/Icons';
import { searchAll, type SearchResult } from '../../../services/search';
import { connectOutlook, getOutlookStatus, disconnectOutlook } from '../../../services/outlook';
import { logout, getTokenPayload } from '../../../services/auth';
import { truncateWithTooltip } from '../../../utils/truncate';
import { useToast } from '../../../context/ToastContext';
import SearchResults from './SearchResults';
import UserMenu from './UserMenu';
import './header.css';

const USER_EMAIL_MAX_LENGTH = 30;
const MIN_SEARCH_LENGTH = 2;
const SEARCH_DEBOUNCE_MS = 500;

const Header = () => {
  const navigate = useNavigate();
  const { showError, showSuccess, showConfirm } = useToast();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isOutlookConnected, setIsOutlookConnected] = useState(false);
  const [isCheckingOutlook, setIsCheckingOutlook] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthenticated(false);
      setUserEmail('');
      return;
    }
    setIsAuthenticated(true);
    const payload = getTokenPayload(token);
    setUserEmail((payload?.sub as string) || (payload?.email as string) || '');
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsCheckingOutlook(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const status = await getOutlookStatus();
        if (!cancelled) setIsOutlookConnected(status.is_active);
      } catch {
        if (!cancelled) setIsOutlookConnected(false);
      } finally {
        if (!cancelled) setIsCheckingOutlook(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < MIN_SEARCH_LENGTH) {
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }
    const results = await searchAll(query);
    setSearchResults(results);
    setShowResults(true);
    setIsSearching(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (searchQuery.trim().length < MIN_SEARCH_LENGTH) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchResults([]);
      setShowResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(() => performSearch(searchQuery), SEARCH_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery, performSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowResults(false);
      }
      if (!(target as HTMLElement).closest('.user-menu-wrapper')) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleToggleUserMenu = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsDropdownOpen(v => !v);
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
      showError('Не удалось подключить Outlook');
    }
  };

  const handleDisconnectOutlook = () => {
    setIsDropdownOpen(false);
    showConfirm({
      message: 'Вы уверены, что хотите отключить Outlook?',
      confirmText: 'Да',
      cancelText: 'Нет',
      onCancel: () => {},
      onConfirm: async () => {
        try {
          await disconnectOutlook();
          setIsOutlookConnected(false);
          showSuccess('Outlook отключён');
        } catch {
          showError('Не удалось отключить Outlook');
        }
      },
    });
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
              placeholder="Поиск кейсов, команд и участников..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
            />
            {isSearching && <div className="search-loading">загрузка...</div>}
          </div>

          {showResults && (
            <SearchResults
              results={searchResults}
              query={searchQuery}
              isSearching={isSearching}
              onNavigate={navigate}
            />
          )}
        </div>
      </div>

      <UserMenu
        displayName={displayName}
        fullText={fullText}
        isAuthenticated={isAuthenticated}
        isOpen={isDropdownOpen}
        isCheckingOutlook={isCheckingOutlook}
        isOutlookConnected={isOutlookConnected}
        onToggle={handleToggleUserMenu}
        onConnectOutlook={handleConnectOutlook}
        onDisconnectOutlook={handleDisconnectOutlook}
        onLogout={handleLogout}
      />
    </header>
  );
};

export default Header;