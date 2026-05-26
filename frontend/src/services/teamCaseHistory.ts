import api from './api';

export interface TeamCaseHistory {
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

export interface AssignCaseData {
  case_semesters_id: string;
  started_at?: string;
  is_current?: boolean;
}

export const getTeamHistory = async (teamId: string): Promise<TeamCaseHistory[]> => {
  const response = await api.get(`/teams/${teamId}/history`);
  return response.data;
};

export const assignCaseToTeam = async (teamId: string, data: AssignCaseData): Promise<TeamCaseHistory> => {
  const response = await api.post(`/teams/${teamId}/history`, data);
  return response.data;
};

// Завершаем текущий активный кейс
export const endCurrentCase = async (teamId: string): Promise<TeamCaseHistory> => {
  const response = await api.post(`/teams/${teamId}/history/end-current`);
  return response.data;
};