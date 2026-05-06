import api from './api';

export interface Team {
  id: string;
  name: string;
  description?: string;
  status: string;
}

export const getTeams = async (): Promise<Team[]> => {
  const response = await api.get('/teams/');
  return response.data;
};

export const getTeamById = async (id: string): Promise<Team> => {
  const response = await api.get(`/teams/${id}`);
  return response.data;
};

export const createTeam = async (data: Partial<Team>): Promise<Team> => {
  const response = await api.post('/teams/', data);
  return response.data;
};

export const updateTeam = async (id: string, data: Partial<Team>): Promise<Team> => {
  const response = await api.patch(`/teams/${id}`, data);
  return response.data;
};

export const deleteTeam = async (id: string): Promise<void> => {
  await api.delete(`/teams/${id}`);
};