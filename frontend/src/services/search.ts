import api from './api';

export interface SearchResult {
  id: string;
  title: string;
  type: 'case' | 'team' | 'student';
  status?: string;
  semester?: string;
  group?: string;
  shortId?: string;
  name?: string;
  cases?: Array<{
    id: string;
    title: string;
    semester_name: string;
    is_active: boolean;
  }>;
  teams?: Array<{
    id: string;
    name: string;
    is_active: boolean;
  }>;
}

const getStudentWithDetails = async (studentId: string) => {
  const shortId = studentId.slice(-4);
  const cases: { id: string; title: string; semester_name: string; is_active: boolean }[] = [];
  const teams: { id: string; name: string; is_active: boolean }[] = [];
  
  try {
    const teamsResponse = await api.get('/teams/?limit=100');
    const teamsData = teamsResponse.data;
    
    for (const team of teamsData) {
      const membersResponse = await api.get(`/teams/${team.id}/members?current_only=false`);
      const members = membersResponse.data;
      const member = members.find((m: { student_id: string }) => m.student_id === studentId);
      
      if (member) {
        teams.push({
          id: team.id,
          name: team.name,
          is_active: member.is_current
        });
        
        const historyResponse = await api.get(`/teams/${team.id}/history`);
        const history = historyResponse.data;
        
        for (const historyItem of history) {
          const caseStart = new Date(historyItem.started_at);
          const caseEnd = historyItem.ended_at ? new Date(historyItem.ended_at) : new Date();
          const memberJoined = new Date(member.joined_at);
          const memberLeft = member.left_at ? new Date(member.left_at) : new Date();
          
          if (memberJoined <= caseEnd && memberLeft >= caseStart) {
            cases.push({
              id: historyItem.case_id,
              title: historyItem.case_title,
              semester_name: `${historyItem.semester_season === 'FALL' ? 'Осенний' : 'Весенний'} ${historyItem.semester_year}`,
              is_active: historyItem.is_current && member.is_current
            });
          }
        }
      }
    }
    
    const uniqueCases = cases.filter((c, index, self) => 
      index === self.findIndex(t => t.id === c.id)
    );
    const uniqueTeams = teams.filter((t, index, self) => 
      index === self.findIndex(t2 => t2.id === t.id)
    );
    
    return { cases: uniqueCases.slice(0, 5), teams: uniqueTeams.slice(0, 5), shortId };
  } catch (err) {
    console.error('Ошибка загрузки данных студента:', err);
    return { cases: [], teams: [], shortId };
  }
};

export const searchAll = async (query: string): Promise<SearchResult[]> => {
  if (!query.trim()) return [];
  
  try {
    const [casesResponse, teamsResponse, studentsResponse] = await Promise.all([
      api.get('/cases/?limit=100'),
      api.get('/teams/?limit=100'),
      api.get('/students/?limit=100')
    ]);
    
    const cases = casesResponse.data;
    const teams = teamsResponse.data;
    const students = studentsResponse.data;
    
    const filteredCases = cases
      .filter((item: { title?: string; short_title?: string; project_goals?: string }) => 
        item.title?.toLowerCase().includes(query.toLowerCase()) ||
        item.short_title?.toLowerCase().includes(query.toLowerCase()) ||
        item.project_goals?.toLowerCase().includes(query.toLowerCase())
      )
      .map((item: { id: string; title: string; short_title?: string; status_name?: string; semester_name?: string }) => ({
        id: item.id,
        title: item.short_title || item.title,
        type: 'case' as const,
        status: item.status_name || 'Кейс',
        semester: item.semester_name || ''
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
        status: item.status || 'Команда'
      }));
    
    const filteredStudentsRaw = students
      .filter((item: { name: string; group: string }) => 
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        item.group.toLowerCase().includes(query.toLowerCase())
      );
    
    const studentsWithDetails = await Promise.all(
      filteredStudentsRaw.map(async (student: { id: string; name: string; group: string }) => {
        const details = await getStudentWithDetails(student.id);
        return {
          id: student.id,
          name: student.name,
          group: student.group,
          type: 'student' as const,
          shortId: details.shortId,
          cases: details.cases,
          teams: details.teams
        };
      })
    );
    
    return [...filteredCases, ...filteredTeams, ...studentsWithDetails];
  } catch (error) {
    console.error('Ошибка поиска:', error);
    return [];
  }
};