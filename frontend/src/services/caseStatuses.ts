import api from './api';

export interface CaseStatus {
  id: number;
  name: string;
}

export const getCaseStatuses = async (): Promise<CaseStatus[]> => {
  const response = await api.get('/case-statuses/');
  return response.data;
};