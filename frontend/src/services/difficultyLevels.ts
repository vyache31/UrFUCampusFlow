import api from './api';

export interface DifficultyLevel {
  id: number;
  name: string;
}

export const getDifficultyLevels = async (): Promise<DifficultyLevel[]> => {
  const response = await api.get('/case-difficulty-levels/');
  return response.data;
};