import api from './api';

export interface Case {
  id: string;
  title: string;
  project_goals?: string;
  required_result?: string;
  grade_criteria?: string;
  study_program?: string;
  difficulty_level_id?: number;
  difficulty_level_name?: string;
  status_id?: number;
  status_name?: string;
  university_id?: number;
  university_name?: string;
  start_date?: string;
  end_date?: string;
  creator_id?: string;
  creator_email?: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
  semester?: string;
  likes?: number;
  dislikes?: number;
  description?: string;
  customerOrg?: string;
  customerName?: string;
  programHead?: string;
  educationProgram?: string;
}

export const getCases = async (): Promise<Case[]> => {
  const response = await api.get('/cases/');
  return response.data.map((item: Record<string, unknown>) => ({
    ...item,
    status: item.status_name as string || 'На оценке',
    description: item.project_goals as string || '',
  }));
};

export const getCaseById = async (id: string): Promise<Case> => {
  const response = await api.get(`/cases/${id}`);
  const item = response.data;
  return {
    ...item,
    status: item.status_name || 'На оценке',
    description: item.project_goals || '',
  };
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