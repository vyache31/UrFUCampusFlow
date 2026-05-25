import api from './api';

export interface Meeting {
  id: string;
  title: string;
  location: string | null;
  team_case_history_id: string;
  team_name?: string;
  case_title?: string;
  start_at: string;
  end_at: string;
  outlook_event_id: string | null;
  event_link: string | null;
  notes: string | null;
  timezone: number | null;
}

export interface CreateMeetingData {
  title: string;
  start_at: string;
  end_at: string;
  location?: string | null;
  event_link?: string | null;
  notes?: string | null;
  timezone?: number | null;
}

interface AxiosError {
  response?: {
    status?: number;
    data?: unknown;
  };
  message?: string;
}

export const getTeamMeetings = async (teamId: string): Promise<Meeting[]> => {
  try {
    const response = await api.get(`/teams/${teamId}/meetings`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 409) {
      console.log(`Команда ${teamId} не имеет активной истории кейсов`);
      return [];
    }
    throw error;
  }
};

export const getAllUpcomingMeetings = async (): Promise<Meeting[]> => {
  try {
    const teamsResponse = await api.get('/teams/?limit=100');
    const teams = teamsResponse.data;
    
    const allMeetings: Meeting[] = [];
    
    for (const team of teams) {
      try {
        const historyResponse = await api.get(`/teams/${team.id}/history`);
        const history = historyResponse.data;
        const currentCase = history.find((h: TeamCaseHistory) => h.is_current === true);
        
        const meetings = await getTeamMeetings(team.id);
        
        meetings.forEach((meeting: Meeting) => {
          allMeetings.push({
            ...meeting,
            team_name: team.name,
            case_title: currentCase?.case_title || meeting.title
          });
        });
      } catch {
        // Игнор команд без истории
      }
    }
    
    allMeetings.sort((a: Meeting, b: Meeting) => 
      new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    );
    
    const now = new Date();
    const upcomingMeetings = allMeetings.filter((meeting: Meeting) => 
      new Date(meeting.start_at) > now
    );
    
    return upcomingMeetings;
  } catch (error) {
    console.error('Ошибка загрузки встреч:', error);
    return [];
  }
};

export const createTeamMeeting = async (teamId: string, data: CreateMeetingData): Promise<Meeting> => {
  const response = await api.post(`/teams/${teamId}/meetings`, data);
  return response.data;
};

export const updateTeamMeeting = async (
  teamId: string,
  meetingId: string,
  data: Partial<CreateMeetingData>
): Promise<Meeting> => {
  const response = await api.patch(`/teams/${teamId}/meetings/${meetingId}`, data);
  return response.data;
};

export const deleteTeamMeeting = async (teamId: string, meetingId: string): Promise<void> => {
  await api.delete(`/teams/${teamId}/meetings/${meetingId}`);
};

// Тип для истории команды
interface TeamCaseHistory {
  id: string;
  team_id: string;
  case_semesters_id: string;
  case_id: string;
  case_title: string;
  semester_id: number;
  semester_season: string;
  semester_year: number;
  started_at: string;
  ended_at: string | null;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}