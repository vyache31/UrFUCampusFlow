import api from './api';

export interface Curator {
  id: string;
  user_id: string;
  team_case_history_id: string;
  assigned_at: string;
  unassigned_at: string | null;
  is_current: boolean;
  email?: string;
  name?: string;
}

export interface CuratorAttendance {
  id: string;
  meeting_id: string;
  curator_assignment_id: string;
  is_present: boolean;
}

export const getAllCurators = async (): Promise<{ id: string; email: string }[]> => {
  try {
    const response = await api.get('/users/?limit=100');
    const allUsers = response.data;
    const curators = allUsers.filter((user: { role_id: number }) => user.role_id === 3);
    return curators.map((user: { id: string; email: string }) => ({
      id: user.id,
      email: user.email,
    }));
  } catch (error) {
    console.error('Ошибка загрузки кураторов:', error);
    return [];
  }
};

// Получить кураторов команды
export const getTeamCurators = async (teamId: string): Promise<Curator[]> => {
  const response = await api.get(`/teams/${teamId}/curators`);
  const curators = response.data;
  
  const enrichedCurators = await Promise.all(
    curators.map(async (curator: Curator) => {
      try {
        const userResponse = await api.get(`/users/${curator.user_id}`);
        return {
          ...curator,
          email: userResponse.data.email,
        };
      } catch {
        return curator;
      }
    })
  );
  
  return enrichedCurators;
};

// Назначить куратора команде
export const assignCuratorToTeam = async (teamId: string, curatorId: string): Promise<Curator> => {
  const response = await api.post(`/teams/${teamId}/curators/${curatorId}`);
  return response.data;
};

// Открепить куратора от команды
export const unassignCuratorFromTeam = async (teamId: string, assignmentId: string): Promise<Curator> => {
  const response = await api.post(`/teams/${teamId}/curators/${assignmentId}/unassign`);
  return response.data;
};

// Получить посещаемость кураторов на встрече
export const getMeetingAttendance = async (teamId: string, meetingId: string): Promise<CuratorAttendance[]> => {
  const response = await api.get(`/teams/${teamId}/meetings/${meetingId}/curator-attendance`);
  return response.data;
};

// Обновить отметку присутствия куратора
export const updateMeetingAttendance = async (teamId: string, meetingId: string, attendanceId: string, isPresent: boolean): Promise<CuratorAttendance> => {
  const response = await api.patch(`/teams/${teamId}/meetings/${meetingId}/curator-attendance/${attendanceId}`, {
    is_present: isPresent
  });
  return response.data;
};