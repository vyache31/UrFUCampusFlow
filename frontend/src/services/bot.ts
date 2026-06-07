import api from './api';

export interface BotMode {
  mode: 'набор' | 'стоп набор';
}

export interface BotCase {
  id: string;
  case_id: string;
  case_title?: string;
  created_at: string;
}

export interface BotCurator {
  id: string;
  user_id: string;
  user_email?: string;
  created_at: string;
}

export interface BotInterview {
  id: string;
  tg_user_id: number;
  case_id: string;
  team_name: string;
  date_time: string;
  created_at: string;
  case_title?: string;
}

// Получить режим бота
export const getBotMode = async (): Promise<BotMode> => {
  const response = await api.get('/bot/mode');
  return response.data;
};

// Изменить режим бота
export const updateBotMode = async (mode: string): Promise<BotMode> => {
  const response = await api.patch('/bot/mode', { mode });
  return response.data;
};

// Получить все кейсы для бота
export const getBotCases = async (): Promise<BotCase[]> => {
  const response = await api.get('/bot/cases');
  const botCases = response.data;
  
  const enriched = await Promise.all(
    botCases.map(async (botCase: BotCase) => {
      try {
        const caseResponse = await api.get(`/cases/${botCase.case_id}`);
        return { ...botCase, case_title: caseResponse.data.title };
      } catch {
        return { ...botCase, case_title: 'Кейс не найден' };
      }
    })
  );
  
  return enriched;
};

// Добавить кейс для бота
export const addBotCase = async (caseId: string): Promise<BotCase> => {
  const response = await api.post('/bot/cases', { case_id: caseId });
  return response.data;
};

// Удалить кейс из бота
export const deleteBotCase = async (botCaseId: string): Promise<void> => {
  await api.delete(`/bot/cases?bot_case_id=${botCaseId}`);
};

// Получить всех кураторов набора
export const getBotCurators = async (): Promise<BotCurator[]> => {
  const response = await api.get('/bot/curators');
  const curators = response.data;
  
  const enriched = await Promise.all(
    curators.map(async (curator: BotCurator) => {
      try {
        const userResponse = await api.get(`/users/${curator.user_id}`);
        return { ...curator, user_email: userResponse.data.email };
      } catch {
        return { ...curator, user_email: 'Куратор не найден' };
      }
    })
  );
  
  return enriched;
};

// Добавить куратора набора
export const addBotCurator = async (curatorId: string): Promise<BotCurator> => {
  const response = await api.post('/bot/curators', { curator_id: curatorId });
  return response.data;
};

// Удалить куратора набора
export const deleteBotCurator = async (curatorId: string): Promise<void> => {
  await api.delete(`/bot/curators?curator_id=${curatorId}`);
};

// Получить все интервью
export const getBotInterviews = async (): Promise<BotInterview[]> => {
  const response = await api.get('/bot/interviews');
  const interviews = response.data;
  
  const enriched = await Promise.all(
    interviews.map(async (interview: BotInterview) => {
      try {
        const botCases = await getBotCases();
        const botCase = botCases.find(bc => bc.case_id === interview.case_id);
        return { ...interview, case_title: botCase?.case_title || 'Кейс не найден' };
      } catch {
        return { ...interview, case_title: 'Кейс не найден' };
      }
    })
  );
  
  return enriched;
};

// Добавить интервью
export const addBotInterview = async (data: {
  tg_user_id: number;
  case_id: string;
  team_name: string;
  date_time: string;
}): Promise<BotInterview> => {
  const response = await api.post('/bot/interviews', data);
  return response.data;
};

// Удалить интервью
export const deleteBotInterview = async (interviewId: string): Promise<void> => {
  await api.delete(`/bot/interviews?interview_id=${interviewId}`);
};