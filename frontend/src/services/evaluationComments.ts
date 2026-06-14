import api from './api';

export interface EvaluationForm {
  id: string;
  case_id: string;
  creator_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  evaluation_form_id: string;
  user_id: string;
  user_email?: string;
  comment_text: string;
  created_at: string;
  updated_at: string | null;
}

export interface ApiError {
  response?: {
    status: number;
    data?: unknown;
  };
}

export const getEvaluationFormByCaseId = async (caseId: string): Promise<EvaluationForm> => {
  const response = await api.get(`/cases/${caseId}/evaluations/current`);
  return response.data;
};

export const getEvaluationComments = async (evaluationFormId: string): Promise<Comment[]> => {
  const response = await api.get(`/evaluation-forms/${evaluationFormId}/comments`);
  return response.data;
};

export const addEvaluationComment = async (
  evaluationFormId: string, 
  commentText: string
): Promise<Comment> => {
  const response = await api.post('/evaluation-comments', {
    evaluation_form_id: evaluationFormId,
    comment_text: commentText
  });
  return response.data;
};

export const updateEvaluationComment = async (
  commentId: string, 
  commentText: string
): Promise<Comment> => {
  const response = await api.patch(`/evaluation-comments/${commentId}`, {
    comment_text: commentText
  });
  return response.data;
};

export const getEvaluationComment = async (commentId: string): Promise<Comment> => {
  const response = await api.get(`/evaluation-comments/${commentId}`);
  return response.data;
};