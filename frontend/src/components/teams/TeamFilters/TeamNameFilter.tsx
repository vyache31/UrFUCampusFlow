import { useState, useRef, useEffect } from 'react';
import { SelectorArrowIcon } from '../../common/Icons/Icons';
import './teamFilters.css';

interface TeamNameFilterProps {
  teams: { id: string; name: string }[];
  currentTeamId: string;
  onTeamChange: (teamId: string) => void;
}

const TeamNameFilter = ({ teams, currentTeamId, onTeamChange }: TeamNameFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentTeam = teams.find(team => team.id === currentTeamId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div className={`team-status-dropdown ${isOpen ? 'open' : ''}`} ref={dropdownRef}>
      <button className="team-status-selector" onClick={() => setIsOpen(!isOpen)}>
        {currentTeam?.name || 'Все команды'}
        <SelectorArrowIcon />
      </button>
      {isOpen && (
        <div className="team-status-menu team-name-menu">
          <div
            className="team-status-item"
            onClick={() => {
              onTeamChange('');
              setIsOpen(false);
            }}
          >
            Все команды
          </div>
          {teams.map(team => (
            <div
              key={team.id}
              className="team-status-item"
              onClick={() => {
                onTeamChange(team.id);
                setIsOpen(false);
              }}
            >
              {team.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeamNameFilter;
