import api from './api';

export interface Team {
  id: string;
  name: string;
  description: string;
  status: string;
}

export const getTeams = async (): Promise<Team[]> => {
  const response = await api.get('/teams');
  return response.data;
};