import api from './api';

export interface MeetingTask {
  id: string;
  title: string;
  description: string;
  meeting_id: string;
  is_completed: boolean;
}

export interface CreateTaskData {
  title: string;
  description?: string;
}

export interface Meeting {
  id: string;
  title: string;
  location: string | null;
  team_case_history_id: string;
  team_name?: string;
  team_id?: string;
  case_title?: string;
  case_short_title?: string;
  start_at: string;
  end_at: string;
  outlook_event_id: string | null;
  event_link: string | null;
  notes: string | null;
  timezone: number | null;
  tasks?: MeetingTask[];
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

// Получить встречи команды
export const getTeamMeetings = async (teamId: string): Promise<Meeting[]> => {
  try {
    const response = await api.get(`/teams/${teamId}/meetings`);
    return response.data;
  } catch (error) {
    const axiosError = error as { response?: { status?: number } };
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
        
        let shortTitle = currentCase?.case_title || '';
        if (currentCase?.case_id) {
          try {
            const caseResponse = await api.get(`/cases/${currentCase.case_id}`);
            shortTitle = caseResponse.data.short_title || currentCase.case_title;
          } catch {
            shortTitle = currentCase?.case_title || '';
          }
        }
        
        const meetings = await getTeamMeetings(team.id);
        
        meetings.forEach((meeting: Meeting) => {
          allMeetings.push({
            ...meeting,
            team_name: team.name,
            team_id: team.id,
            case_title: shortTitle,
            case_short_title: shortTitle
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

// Создать встречу
export const createTeamMeeting = async (teamId: string, data: CreateMeetingData): Promise<Meeting> => {
  const response = await api.post(`/teams/${teamId}/meetings`, data);
  return response.data;
};

// Обновить встречу
export const updateTeamMeeting = async (
  teamId: string,
  meetingId: string,
  data: Partial<CreateMeetingData>
): Promise<Meeting> => {
  const response = await api.patch(`/teams/${teamId}/meetings/${meetingId}`, data);
  return response.data;
};

// Удалить встречу
export const deleteTeamMeeting = async (teamId: string, meetingId: string): Promise<void> => {
  await api.delete(`/teams/${teamId}/meetings/${meetingId}`);
};

// Получить задачи встречи
export const getMeetingTasks = async (teamId: string, meetingId: string): Promise<MeetingTask[]> => {
  const response = await api.get(`/teams/${teamId}/meetings/${meetingId}/tasks`);
  return response.data;
};

// Создать задачу
export const createMeetingTask = async (teamId: string, meetingId: string, data: CreateTaskData): Promise<MeetingTask> => {
  const response = await api.post(`/teams/${teamId}/meetings/${meetingId}/tasks`, data);
  return response.data;
};

// Обновить задачу
export const updateMeetingTask = async (teamId: string, meetingId: string, taskId: string, isCompleted: boolean): Promise<MeetingTask> => {
  const response = await api.patch(`/teams/${teamId}/meetings/${meetingId}/tasks/${taskId}`, {
    is_completed: isCompleted
  });
  return response.data;
};

// Удалить задачу
export const deleteMeetingTask = async (teamId: string, meetingId: string, taskId: string): Promise<void> => {
  await api.delete(`/teams/${teamId}/meetings/${meetingId}/tasks/${taskId}`);
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