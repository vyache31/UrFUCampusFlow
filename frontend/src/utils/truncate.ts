// === СТАНДАРТНЫЕ ЗНАЧЕНИЯ ===

// Для карточек (кейсы, команды) - места много
const CARD_TITLE_LENGTH = 55;
const CARD_DESCRIPTION_LENGTH = 150;

// Для таблицы встреч - места мало, обрезаем сильнее
const MEETING_PROJECT_LENGTH = 35;  // Название проекта
const MEETING_TEAM_LENGTH = 25;     // Название команды

// === ФУНКЦИИ ===

// Простая обрезка строки
export const truncate = (str: string, maxLength: number): string => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};

// Обрезка с тултипом
export const truncateWithTooltip = (str: string, maxLength: number) => {
  if (!str) return { displayText: '', fullText: '' };
  if (str.length <= maxLength) {
    return { displayText: str, fullText: str };
  }
  return {
    displayText: str.slice(0, maxLength) + '...',
    fullText: str
  };
};

// === ДЛЯ КАРТОЧЕК (кейсы, команды) ===
export const truncateCardTitle = (str: string) => truncateWithTooltip(str, CARD_TITLE_LENGTH);
export const truncateCardDescription = (str: string) => truncate(str, CARD_DESCRIPTION_LENGTH);

// === ДЛЯ ТАБЛИЦЫ ВСТРЕЧ ===
export const truncateMeetingProject = (str: string) => truncateWithTooltip(str, MEETING_PROJECT_LENGTH);
export const truncateMeetingTeam = (str: string) => truncateWithTooltip(str, MEETING_TEAM_LENGTH);