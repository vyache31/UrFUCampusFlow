import api from './api';

export interface Team {
  id: string;
  name: string;
  description?: string;
  status: string;
  notes?: string;
  university_id?: number;
  university_name?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateTeamData {
  name: string;
  description?: string;
  notes?: string;
  university_id: number;
  status: string;
}

export const getTeams = async (limit?: number): Promise<Team[]> => {
  const url = limit ? `/teams/?limit=${limit}` : '/teams/';
  const response = await api.get(url);
  return response.data;
};

export const getTeamById = async (id: string): Promise<Team> => {
  const response = await api.get(`/teams/${id}`);
  return response.data;
};

export const createTeam = async (data: CreateTeamData): Promise<Team> => {
  const response = await api.post('/teams/', data);
  return response.data;
};

export const updateTeam = async (id: string, data: Partial<CreateTeamData>): Promise<Team> => {
  const response = await api.patch(`/teams/${id}`, data);
  return response.data;
};

export const deleteTeam = async (id: string): Promise<void> => {
  await api.delete(`/teams/${id}`);
};