export interface TeamMeeting {
  id: string;
  project: string;
  date: string;
  time: string;
}

export const testTeamMeetings: TeamMeeting[] = [
  { id: '1', project: 'Дашборд аналитики по транзакционным данным для малого бизнеса', date: '02.05.26', time: '17:00' },
  { id: '2', project: 'Автоматизация обработки обращений клиентов через AI-ассистента', date: '14.05.26', time: '14:30' },
  { id: '3', project: 'Разработка мобильного приложения для оценки кредитного риска', date: '16.05.26', time: '11:00' },
  { id: '4', project: 'Внедрение CRM-системы для отдела продаж', date: '18.05.26', time: '10:00' },
  { id: '5', project: 'Аналитическая платформа для маркетинга', date: '22.05.26', time: '16:00' },
];