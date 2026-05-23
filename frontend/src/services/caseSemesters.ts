import api from './api';

export interface CaseSemester {
  id: string;
  case_id: string;
  semester_id: number;
}

export const getCaseSemesters = async (caseId: string): Promise<CaseSemester[]> => {
  const response = await api.get(`/cases/${caseId}/semesters`);
  return response.data;
};