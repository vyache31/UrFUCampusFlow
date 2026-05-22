export interface ReportMember {
  name: string;
  group: string;
}

export interface TeamReport {
  id: string;
  name: string;
  project: string;
  members: ReportMember[];
}

export const testReportData: TeamReport[] = [
  {
    id: '1',
    name: 'Скомпилированные гении',
    project: 'Разработка мобильного приложения для оценки кредитного риска МСБ',
    members: [
      { name: 'Абдыкеримов Бексултан Талантович', group: 'РИ-240932' },
      { name: 'Попова Анна Михайловна', group: 'РИ-240932' },
      { name: 'Семёнов Вячеслав Андреевич', group: 'РИ-240932' },
      { name: 'Соловьев Даниил Сергеевич', group: 'РИ-240932' },
      { name: 'Хамитова Ксения Андреевна', group: 'РИ-240932' }
    ]
  },
  {
    id: '2',
    name: 'IT`шники',
    project: 'Разработка мобильного приложения для оценки кредитного риска МСБ',
    members: [
      { name: 'Козлов Дмитрий Игоревич', group: 'РИ-240932' },
      { name: 'Морозова Екатерина Владимировна', group: 'РИ-240932' },
      { name: 'Новиков Артем Павлович', group: 'РИ-240932' }
    ]
  },
  {
    id: '3',
    name: 'Фронт-тигры',
    project: 'Разработка мобильного приложения для оценки кредитного риска МСБ',
    members: [
      { name: 'Соколов Павел Андреевич', group: 'РИ-240932' },
      { name: 'Волкова Анастасия Дмитриевна', group: 'РИ-240932' }
    ]
  }
];