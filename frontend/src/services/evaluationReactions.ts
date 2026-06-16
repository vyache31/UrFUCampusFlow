import api from './api';

export interface Reaction {
  id: string;
  evaluation_form_id: string;
  user_id: string;
  reaction: 'LIKE' | 'DISLIKE';
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  response?: {
    status: number;
    data?: unknown;
  };
}

// Получить все реакции для формы оценки
export const getFormReactions = async (evaluationFormId: string): Promise<Reaction[]> => {
  const response = await api.get(`/evaluation-forms/${evaluationFormId}/reactions`);
  return response.data;
};

// Получить реакцию текущего пользователя
export const getMyReaction = async (evaluationFormId: string): Promise<Reaction | null> => {
  try {
    const response = await api.get(`/evaluation-forms/${evaluationFormId}/reactions/me`);
    return response.data;
  } catch {
    return null; 
  }
};

// Создать реакцию
export const createReaction = async (
  evaluationFormId: string, 
  reaction: 'LIKE' | 'DISLIKE'
): Promise<Reaction> => {
  const response = await api.post('/evaluation-reactions', {
    evaluation_form_id: evaluationFormId,
    reaction: reaction
  });
  return response.data;
};

// Обновить реакцию
export const updateReaction = async (
  reactionId: string, 
  reaction: 'LIKE' | 'DISLIKE'
): Promise<Reaction> => {
  const response = await api.patch(`/evaluation-reactions/${reactionId}`, {
    reaction: reaction
  });
  return response.data;
};

// Получить все реакции (для админа)
export const getAllReactions = async (): Promise<Reaction[]> => {
  const response = await api.get('/evaluation-reactions/');
  return response.data;
};

// Получить реакции по типу
export const getReactionsByType = async (reactionType: 'LIKE' | 'DISLIKE'): Promise<Reaction[]> => {
  const response = await api.get(`/evaluation-reactions/${reactionType}`);
  return response.data;
};

// Получить конкретную реакцию по ID
export const getReactionById = async (reactionId: string): Promise<Reaction> => {
  const response = await api.get(`/evaluation-reactions/id/${reactionId}`);
  return response.data;
};