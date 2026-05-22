import api from './api';

export interface University {
  id: number;
  name: string;
}

export const getUniversities = async (): Promise<University[]> => {
  const response = await api.get('/universities/');
  return response.data;
};