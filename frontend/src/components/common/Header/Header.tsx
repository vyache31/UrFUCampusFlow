import { useState, useEffect, useRef } from 'react';
import { LogoIcon, SearchIcon } from '../Icons/Icons';
import './header.css';

const Header = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

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

  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <LogoIcon />
        </div>
        <div className="search-bar">
          <SearchIcon />
          <input type="text" placeholder="Поиск" />
        </div>
      </div>
      <div className="user-menu-wrapper">
        <div className="user-name" onClick={toggleDropdown}>
          Данил Колбасенко
        </div>
        <div className={`user-dropdown ${isDropdownOpen ? 'open' : ''}`} ref={dropdownRef}>
          <button className="dropdown-item">Связать с Outlook</button>
          <button className="dropdown-item">Выйти</button>
        </div>
      </div>
    </header>
  );
};

export default Header;