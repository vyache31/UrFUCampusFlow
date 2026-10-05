import type { NavigateFunction } from 'react-router-dom';
import type { SearchResult } from '../../../services/search';

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  isSearching: boolean;
  onNavigate: NavigateFunction;
}

const MIN_SEARCH_LENGTH = 2;

const SearchResults = ({ results, query, isSearching, onNavigate }: SearchResultsProps) => {
  const isQueryValid = query.trim().length >= MIN_SEARCH_LENGTH;

  if (!isQueryValid) return null;

  if (!isSearching && results.length === 0) {
    return (
      <div className="search-results empty">
        <div className="search-result-item">Ничего не найдено</div>
      </div>
    );
  }

  if (results.length === 0) return null;

  return (
    <div className="search-results">
      {results.map(result => {
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
                    .sort((a, b) => Number(b.is_active) - Number(a.is_active))
                    .map((caseItem, idx) => (
                      <div
                        key={`case-${idx}`}
                        className="student-case-item clickable"
                        onClick={() => onNavigate(`/cases/${caseItem.id}`)}
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
                    .sort((a, b) => Number(b.is_active) - Number(a.is_active))
                    .map((teamItem, idx) => (
                      <div
                        key={`team-${idx}`}
                        className="student-team-item clickable"
                        onClick={() => onNavigate(`/teams/${teamItem.id}`)}
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
            onClick={() =>
              onNavigate(result.type === 'case' ? `/cases/${result.id}` : `/teams/${result.id}`)
            }
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
  );
};

export default SearchResults;