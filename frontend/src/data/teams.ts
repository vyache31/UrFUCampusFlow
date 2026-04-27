export interface Team {
  id: string;
  name: string;
  description: string;
  status: 'Интервью' | 'Отказ' | 'Работает над кейсом' | 'Архив';
  members?: { name: string; role: string; university: string; group: string }[];
  caseId?: string;
  caseName?: string;
  createdAt: string;
}

export const testTeams: Team[] = [
  {
    id: '1',
    name: 'Скомпилированные гении',
    description: 'Короткое описание. Проект: интернет-магазин книг с личным кабинетом и корзиной.',
    status: 'Работает над кейсом',
    members: [
      { name: 'Иванов Иван Иванович', role: 'Team Lead', university: 'СПбГУ', group: 'P3310' },
      { name: 'Петрова Анна Сергеевна', role: 'Backend Developer', university: 'ИТМО', group: 'P3310' }
    ],
    caseId: '1',
    caseName: 'Автоматизация обработки обращений клиентов через AI-ассистента',
    createdAt: '2024-01-20'
  },
  {
    id: '2',
    name: 'IT`шники',
    description: 'Среднее описание. Команда занимается разработкой мобильных приложений. Специализация: React Native, Node.js, MongoDB.',
    status: 'Интервью',
    members: [
      { name: 'Козлов Дмитрий Игоревич', role: 'Team Lead', university: 'Политех', group: 'P3210' }
    ],
    createdAt: '2024-01-22'
  },
  {
    id: '3',
    name: 'Фронт-тигры',
    description: 'Длинное описание. Команда специализируется на фронтенд разработке. Эксперты в React, Vue, Angular. Имеют опыт создания сложных SPA приложений с нуля, оптимизации производительности и рефакторинга легаси кода. Также занимаются обучением молодых специалистов.',
    status: 'Отказ',
    members: [],
    createdAt: '2024-01-25'
  },
  {
    id: '4',
    name: 'Data-джедаи',
    description: 'Короткое описание. Аналитики и Data Science специалисты.',
    status: 'Архив',
    members: [],
    createdAt: '2023-12-10'
  },
  {
    id: '5',
    name: 'AI-команда инновационных решений и технологий машинного обучения',
    description: 'Очень длинное описание. Команда занимается разработкой AI-решений для бизнеса. Внедряют нейросети в процессы компаний. Специализируются на компьютерном зрении, NLP, рекомендательных системах. Имеют коммерческий опыт и публикации на международных конференциях.',
    status: 'Интервью',
    members: [
      { name: 'Морозов Артем Дмитриевич', role: 'ML Engineer', university: 'СПбГУ', group: 'P4010' },
      { name: 'Волкова Екатерина Андреевна', role: 'Data Scientist', university: 'ИТМО', group: 'P4011' },
      { name: 'Соколов Павел Сергеевич', role: 'AI Researcher', university: 'Политех', group: 'P4012' }
    ],
    createdAt: '2024-02-01'
  },
  {
    id: '6',
    name: 'Бэкенд-мастера',
    description: 'Среднее описание. Команда профессионалов в области серверной разработки. Специализация: Java, Spring, PostgreSQL, микросервисы.',
    status: 'Работает над кейсом',
    members: [
      { name: 'Лебедев Константин', role: 'Senior Backend', university: 'СПбГУ', group: 'P3510' }
    ],
    caseId: '3',
    caseName: 'Внедрение CRM-системы для отдела продаж',
    createdAt: '2024-02-05'
  },
  {
    id: '7',
    name: 'Интеграторы',
    description: 'Длинное описание. Команда специализируется на интеграции различных систем. Опыт работы с REST API, SOAP, Kafka, Redis. Умеют настраивать CI/CD и обеспечивать высокую доступность сервисов.',
    status: 'Архив',
    members: [],
    createdAt: '2023-11-15'
  },
  {
    id: '8',
    name: 'QA-инженеры',
    description: 'Короткое описание. Тестирование и автоматизация.',
    status: 'Отказ',
    members: [
      { name: 'Новикова Ольга', role: 'QA Lead', university: 'ИТМО', group: 'P3710' }
    ],
    createdAt: '2024-01-30'
  },
  {
    id: '9',
    name: 'DevOps культура и облачные технологии',
    description: 'Очень длинное описание. Команда занимается DevOps практиками. Контейнеризация (Docker), оркестрация (K8s), Infrastructure as Code (Terraform), CI/CD (GitLab CI, Jenkins), мониторинг (Prometheus + Grafana). Опыт работы с облачными провайдерами: AWS, Yandex Cloud, VK Cloud.',
    status: 'Интервью',
    members: [
      { name: 'Крылов Иван', role: 'DevOps Engineer', university: 'СПбГУ', group: 'P4210' },
      { name: 'Савельев Дмитрий', role: 'SysAdmin', university: 'Политех', group: 'P4211' }
    ],
    createdAt: '2024-02-10'
  },
  {
    id: '10',
    name: 'UI/UX команда',
    description: 'Среднее описание. Дизайнеры интерфейсов. Работают в Figma, Sketch, Adobe XD.',
    status: 'Архив',
    members: [],
    createdAt: '2023-10-20'
  },
  {
    id: '11',
    name: 'Кибербезопасность',
    description: 'Короткое описание. Защита информации и пентест.',
    status: 'Работает над кейсом',
    members: [
      { name: 'Андреев Максим', role: 'Security Analyst', university: 'СПбГУ', group: 'P4510' }
    ],
    caseId: '4',
    caseName: 'Чат-бот для технической поддержки',
    createdAt: '2024-02-15'
  },
  {
    id: '12',
    name: 'Аналитики больших данных Big Data Analytics Platform',
    description: 'Очень длинное описание. Команда занимается обработкой и анализом больших данных. Используют стек: Hadoop, Spark, Hive, Kafka. Разрабатывают ETL-пайплайны и строят хранилища данных (Data Lake, DWH).',
    status: 'Интервью',
    members: [],
    createdAt: '2024-02-20'
  }
];