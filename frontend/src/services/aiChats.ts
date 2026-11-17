import api from './api';

export interface AICaseDraft {
  title: string | null;
  short_title: string | null;
  project_goals: string | null;
  required_result: string | null;
  grade_criteria: string | null;
}

export interface AIChat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string | null;
  draft: AICaseDraft | null;
}

export interface AIChatMessage {
  id: string;
  chat_id: string;
  position: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface AIChatReply {
  message: AIChatMessage;
  draft: AICaseDraft;
}

export const CHAT_PAGE_SIZE = 20;

export const getAIChats = async (offset = 0, signal?: AbortSignal): Promise<AIChat[]> => {
  const response = await api.get<AIChat[]>('/ai/chats/', {
    params: { limit: CHAT_PAGE_SIZE, offset }, signal,
  });
  return response.data;
};

export const createAIChat = async (title: string): Promise<AIChat> => {
  const response = await api.post<AIChat>('/ai/chats/', { title });
  return response.data;
};

export const getAIChat = async (chatId: string, signal?: AbortSignal): Promise<AIChat> => {
  const response = await api.get<AIChat>(`/ai/chats/${chatId}`, { signal });
  return response.data;
};

export const getAIChatMessages = async (chatId: string, signal?: AbortSignal): Promise<AIChatMessage[]> => {
  const messages: AIChatMessage[] = [];
  const limit = 100;
  let page: AIChatMessage[];
  do {
    const response = await api.get<AIChatMessage[]>(`/ai/chats/${chatId}/messages`, {
      params: { limit, offset: messages.length }, signal,
    });
    page = response.data;
    messages.push(...page);
  } while (page.length === limit);
  return messages;
};

export const sendAIChatMessage = async (chatId: string, content: string): Promise<AIChatReply> => {
  const response = await api.post<AIChatReply>(`/ai/chats/${chatId}/messages`, { content });
  return response.data;
};

export const retryAIChatReply = async (chatId: string): Promise<AIChatReply> => {
  const response = await api.post<AIChatReply>(`/ai/chats/${chatId}/retry`);
  return response.data;
};

export const deleteAIChat = async (chatId: string): Promise<void> => {
  await api.delete(`/ai/chats/${chatId}`);
};
