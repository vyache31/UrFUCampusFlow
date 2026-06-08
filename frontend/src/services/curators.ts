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

export const assignCuratorToTeam = async (teamId: string, curatorId: string): Promise<Curator> => {
  const response = await api.post(`/teams/${teamId}/curators/${curatorId}`);
  return response.data;
};

export const unassignCuratorFromTeam = async (teamId: string, assignmentId: string): Promise<Curator> => {
  const response = await api.post(`/teams/${teamId}/curators/${assignmentId}/unassign`);
  return response.data;
};

// Получить посещаемость кураторов на встрече
export const getMeetingAttendance = async (teamId: string, meetingId: string): Promise<CuratorAttendance[]> => {
  const response = await api.get(`/teams/${teamId}/meetings/${meetingId}/curator-attendance`);
  return response.data;
};

export const updateMeetingAttendance = async (teamId: string, meetingId: string, attendanceId: string, isPresent: boolean): Promise<CuratorAttendance> => {
  const response = await api.patch(`/teams/${teamId}/meetings/${meetingId}/curator-attendance/${attendanceId}`, {
    is_present: isPresent
  });
  return response.data;
};

export const getAllMeetingAttendance = async (teamId: string): Promise<CuratorAttendance[]> => {
  const meetings = await api.get(`/teams/${teamId}/meetings`);
  const meetingsData = meetings.data;
  
  const allAttendance: CuratorAttendance[] = [];
  
  for (const meeting of meetingsData) {
    try {
      const attendance = await getMeetingAttendance(teamId, meeting.id);
      allAttendance.push(...attendance);
    } catch (error) {
      console.error(`Ошибка загрузки посещаемости для встречи ${meeting.id}:`, error);
    }
  }
  
  return allAttendance;
};

export const getAllTeamCurators = async (teamId: string): Promise<Curator[]> => {
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

export interface CuratorWithStats extends Curator {
  attendanceCount?: number;
}

export const getAllTeamCuratorsWithStats = async (teamId: string): Promise<CuratorWithStats[]> => {
  const response = await api.get(`/teams/${teamId}/curators`);
  const curators = response.data;
  
  const meetingsResponse = await api.get(`/teams/${teamId}/meetings`);
  const meetings = meetingsResponse.data;
  
  const allAttendance: CuratorAttendance[] = [];
  for (const meeting of meetings) {
    try {
      const attendance = await getMeetingAttendance(teamId, meeting.id);
      allAttendance.push(...attendance);
    } catch (error) {
      console.error(`Ошибка загрузки посещаемости для встречи ${meeting.id}:`, error);
    }
  }
  
  const enrichedCurators = await Promise.all(
    curators.map(async (curator: Curator) => {
      try {
        const userResponse = await api.get(`/users/${curator.user_id}`);
        const attendanceCount = allAttendance.filter(a => 
          a.curator_assignment_id === curator.id && a.is_present === true
        ).length;
        
        return {
          ...curator,
          email: userResponse.data.email,
          attendanceCount: attendanceCount
        };
      } catch {
        return {
          ...curator,
          email: `Куратор ${curator.user_id?.slice(-4)}`,
          attendanceCount: 0
        };
      }
    })
  );
  
  return enrichedCurators;
};