import api from './api';

export interface Case {
  id: string;
  title: string;
  short_title?: string | null;
  project_goals?: string;
  required_result?: string;
  grade_criteria?: string;
  study_program?: string;
  difficulty_level_id?: number;
  difficulty_level_name?: string;
  status_id?: number;
  status_name?: string;
  case_semesters_id?: string;
  semester_id?: number;
  semester_season?: string;
  semester_year?: number;
  semester_name?: string;
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
}

export const getCases = async (limit?: number): Promise<Case[]> => {
  const url = limit ? `/cases/?limit=${limit}` : '/cases/';
  const response = await api.get(url);
  return response.data.map((item: Record<string, unknown>) => {
    let status = 'Неизвестно';
    const statusId = item.status_id as number;
    
    if (statusId === 1) status = 'Черновик';
    else if (statusId === 2) status = 'На оценке';
    else if (statusId === 3) status = 'Активный';
    else if (statusId === 4) status = 'На доработке';
    else if (statusId === 5) status = 'Архивирован';
    
    return {
      ...item,
      status: status,
      semester: item.semester_name as string || '',
      description: item.project_goals as string || '',
      short_title: item.short_title as string || '',
    };
  });
};

export const getCaseById = async (id: string): Promise<Case> => {
  const response = await api.get(`/cases/${id}`);
  const item = response.data;
  
  let status = 'На оценке';
  const statusId = item.status_id as number;

  if (statusId === 1) status = 'Черновик';
  else if (statusId === 2) status = 'На оценке';
  else if (statusId === 3) status = 'Активный';
  else if (statusId === 4) status = 'На доработке';
  else if (statusId === 5) status = 'Архивирован';

  return {
    ...item,
    status: status,
    semester: item.semester_name || '',
    description: item.project_goals || '',
    short_title: item.short_title || '',
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

export const sendToReview = async (id: string): Promise<Case> => {
  const response = await api.post(`/cases/${id}/submit-for-review`);
  return response.data;
};

export const rejectCase = async (id: string): Promise<Case> => {
  const response = await api.post(`/cases/${id}/reject`);
  return response.data;
};

export const activateCase = async (id: string): Promise<Case> => {
  const response = await api.post(`/cases/${id}/activate`);
  return response.data;
};

export const archiveCase = async (id: string): Promise<Case> => {
  const response = await api.post(`/cases/${id}/archive`);
  return response.data;
};
