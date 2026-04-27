export interface Team {
  id: string;
  name: string;
  description: string;
  status: 'Интервью' | 'Отказ' | 'Работает над кейсом' | 'Архив';
  members?: { name: string; role: string; university: string; group: string }[];
  caseId?: string;
  createdAt: string;
}

export const testTeams: Team[] = [
  {
    id: '1',
    name: 'Скомпилированные гении',
    description: 'Команда опытных разработчиков, специализирующихся на высоконагруженных системах. Проект: интернет-магазин книг с личным кабинетом и корзиной. Распределение: аналитик описывает 3 основных пользовательских сценария (поиск, заказ, оплата); дизайнер отрисовывает 12 экранов; фронтендер верстает и натягивает на API; бэкендер 1 — каталог и поиск, бэкендер 2 — корзина, заказы и платежи. Дополнительно: DevOps настроил CI/CD, тестировщик покрыл код unit-тестами.',
    status: 'Работает над кейсом',
    members: [
      { name: 'Иванов Иван Иванович', role: 'Team Lead', university: 'СПбГУ', group: 'P3310' },
      { name: 'Петрова Анна Сергеевна', role: 'Backend Developer', university: 'ИТМО', group: 'P3310' },
      { name: 'Сидоров Алексей Дмитриевич', role: 'Frontend Developer', university: 'Политех', group: 'P3311' },
      { name: 'Козлова Мария Андреевна', role: 'QA Engineer', university: 'СПбГУ', group: 'P3312' }
    ],
    caseId: '1',
    createdAt: '2024-01-20'
  },
  {
    id: '2',
    name: 'IT`шники',
    description: 'Команда занимается разработкой мобильных приложений. Специализация: React Native, Node.js, MongoDB. Опыт работы над коммерческими проектами в сфере финтеха и e-commerce. Готовы к сложным задачам и жестким дедлайнам.',
    status: 'Интервью',
    members: [
      { name: 'Козлов Дмитрий Игоревич', role: 'Team Lead', university: 'Политех', group: 'P3210' },
      { name: 'Морозова Екатерина Владимировна', role: 'Mobile Developer', university: 'Политех', group: 'P3211' },
      { name: 'Новиков Артем Павлович', role: 'Backend Developer', university: 'ИТМО', group: 'P3212' }
    ],
    createdAt: '2024-01-22'
  },
  {
    id: '3',
    name: 'Фронт-тигры - эксперты в фронтенд разработке',
    description: 'Команда специализируется на фронтенд разработке. Эксперты в React, Vue, Angular, TypeScript. Имеют опыт создания сложных SPA приложений с нуля, оптимизации производительности и рефакторинга легаси кода.',
    status: 'Архив',
    members: [
      { name: 'Соколов Павел Андреевич', role: 'Frontend Lead', university: 'СПбГУ', group: 'P4010' },
      { name: 'Волкова Анастасия Дмитриевна', role: 'React Developer', university: 'ИТМО', group: 'P4011' }
    ],
    createdAt: '2023-11-01'
  }
];