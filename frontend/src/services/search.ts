import api from './api';

export interface SearchResult {
  id: string;
  title: string;
  type: 'case' | 'team';
  status?: string;
}

export const searchAll = async (query: string): Promise<SearchResult[]> => {
  if (!query.trim()) return [];
  
  try {
    const casesResponse = await api.get('/cases/');
    const cases = casesResponse.data;
    
    const teamsResponse = await api.get('/teams/');
    const teams = teamsResponse.data;
    
    const filteredCases = cases
      .filter((item: { title?: string; project_goals?: string }) => 
        item.title?.toLowerCase().includes(query.toLowerCase()) ||
        item.project_goals?.toLowerCase().includes(query.toLowerCase())
      )
      .map((item: { id: string; title: string }) => ({
        id: item.id,
        title: item.title,
        type: 'case' as const,
        status: 'case'
      }));
    
    const filteredTeams = teams
      .filter((item: { name?: string; description?: string }) => 
        item.name?.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase())
      )
      .map((item: { id: string; name: string; status: string }) => ({
        id: item.id,
        title: item.name,
        type: 'team' as const,
        status: item.status
      }));
    
    return [...filteredCases, ...filteredTeams];
  } catch (error) {
    console.error('Ошибка поиска:', error);
    return [];
  }
};