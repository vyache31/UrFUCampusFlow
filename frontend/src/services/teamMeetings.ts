import api from './api';

export interface TeamMeeting {
  id: string;
  title: string;
  location: string | null;
  team_case_history_id: string;
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

export const getTeamMeetings = async (teamId: string): Promise<TeamMeeting[]> => {
  const response = await api.get(`/teams/${teamId}/meetings`);
  return response.data;
};

export const createTeamMeeting = async (teamId: string, data: CreateMeetingData): Promise<TeamMeeting> => {
  const response = await api.post(`/teams/${teamId}/meetings`, data);
  return response.data;
};

export const updateTeamMeeting = async (teamId: string, meetingId: string, data: Partial<CreateMeetingData>): Promise<TeamMeeting> => {
  const response = await api.patch(`/teams/${teamId}/meetings/${meetingId}`, data);
  return response.data;
};

export const deleteTeamMeeting = async (teamId: string, meetingId: string): Promise<void> => {
  await api.delete(`/teams/${teamId}/meetings/${meetingId}`);
};