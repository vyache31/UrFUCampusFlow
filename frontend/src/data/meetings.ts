export interface Meeting {
  id: string;
  project: string;
  teamName: string;
  teamId: string;
  day: string;
  time: string;
  date: string;
  isUpcoming?: boolean;
}

export const testMeetings: Meeting[] = [
  {
    id: '1',
    project: 'Веб-приложение для автоматизации документооборота в государственных учреждениях',
    teamName: 'Скомпилированные гении',
    teamId: '1',
    day: 'вт',
    time: '17:00',
    date: '20.04.2026',
    isUpcoming: true
  },
  {
    id: '2',
    project: 'Веб-приложение для мониторинга активности пользователей в социальных сетях',
    teamName: 'IT`шники',
    teamId: '2',
    day: 'ср',
    time: '14:00',
    date: '21.04.2026',
    isUpcoming: true
  },
  {
    id: '3',
    project: 'Мобильное приложение для доставки продуктов с интеграцией служб доставки',
    teamName: 'Фронт-тигры',
    teamId: '3',
    day: 'чт',
    time: '11:00',
    date: '22.04.2026',
    isUpcoming: true
  }
];

// Встречи на неделю 
export const weeklyMeetings: Meeting[] = [
  {
    id: '4',
    project: 'Мобильное приложение для доставки продуктов с интеграцией служб доставки',
    teamName: 'Фронт-тигры',
    teamId: '3',
    day: 'чт',
    time: '11:00',
    date: '22.04.2026',
    isUpcoming: true
  },
  {
    id: '5',
    project: 'CRM-система для отдела продаж с интеграцией 1С и телефонии',
    teamName: 'Бэкенд-мастера',
    teamId: '4',
    day: 'пт',
    time: '15:30',
    date: '23.04.2026',
    isUpcoming: true
  },
  {
    id: '6',
    project: 'Аналитическая платформа для маркетинга с дашбордами в реальном времени',
    teamName: 'Data-джедаи',
    teamId: '5',
    day: 'пн',
    time: '10:00',
    date: '26.04.2026',
    isUpcoming: true
  },
  {
    id: '7',
    project: 'Чат-бот для техподдержки с интеграцией в Telegram и WhatsApp',
    teamName: 'AI-команда',
    teamId: '6',
    day: 'вт',
    time: '13:00',
    date: '27.04.2026',
    isUpcoming: true
  },
  {
    id: '8',
    project: 'Интеграция с внешним API для синхронизации данных с партнёрами',
    teamName: 'Интеграторы',
    teamId: '7',
    day: 'ср',
    time: '16:00',
    date: '28.04.2026',
    isUpcoming: true
  }
];