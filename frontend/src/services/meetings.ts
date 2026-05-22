import api from './api';

export interface Meeting {
  id: string;
  project: string;
  teamName: string;
  teamId: string;
  day: string;
  time: string;
  date: string;
  isUpcoming?: boolean;
}

export const getMeetings = async (): Promise<Meeting[]> => {
  const response = await api.get('/meetings');
  return response.data;
};