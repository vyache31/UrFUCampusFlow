import api from './api';

export interface AIGeneratedCase {
  project_description: string;
  project_idea: string;
  technical_details: string;
  difficulty: string;
}

export const generateWithAI = async (caseId: string): Promise<AIGeneratedCase> => {
  const response = await api.post(`/cases/${caseId}/generate-with-ai`);
  return response.data;
};