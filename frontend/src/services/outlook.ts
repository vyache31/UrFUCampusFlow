import api from './api';

export interface ConnectResponse {
  authorize_url: string;
}

export interface OAuthStatusResponse {
  is_active: boolean;
}

// Начать подключение к Outlook
export const connectOutlook = async (): Promise<ConnectResponse> => {
  const response = await api.get('/auth/microsoft/outlook');
  return response.data;
};

// Проверить статус подключения
export const getOutlookStatus = async (): Promise<OAuthStatusResponse> => {
  const response = await api.get('/auth/microsoft/outlook/integration-status');
  return response.data;
};

// Отключить Outlook
export const disconnectOutlook = async (): Promise<OAuthStatusResponse> => {
  const response = await api.delete('/auth/microsoft/outlook/disconnect');
  return response.data;
};