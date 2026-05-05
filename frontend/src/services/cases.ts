import api from './api';

export interface Case {
  id: string;
  title: string;
  description?: string;
  project_goals?: string;
  required_result?: string;
  grade_criteria?: string;
  status: string;
  semester?: string;
  likes?: number;
  dislikes?: number;
  difficulty_level_id?: number;
  creator_id?: string;
  study_program?: string;
  start_date?: string;
  end_date?: string;
  university_id?: number;
  status_id?: number;
}

export const getCases = async (): Promise<Case[]> => {
  const response = await api.get('/cases/');
  return response.data;
};

export const getCaseById = async (id: string): Promise<Case> => {
  const response = await api.get(`/cases/${id}`);
  return response.data;
};

export const createCase = async (data: Partial<Case>): Promise<Case> => {
  const response = await api.post('/cases/', data);
  return response.data;
};

export const updateCase = async (id: string, data: Partial<Case>): Promise<Case> => {
  const response = await api.patch(`/cases/${id}`, data);
  return response.data;
};

export const deleteCase = async (id: string): Promise<void> => {
  await api.delete(`/cases/${id}`);
};