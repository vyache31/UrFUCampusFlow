const CARD_TITLE_LENGTH = 55;
const CARD_DESCRIPTION_LENGTH = 150;

const MEETING_PROJECT_LENGTH = 35;
const MEETING_TEAM_LENGTH = 25;

export const truncate = (str: string, maxLength: number): string => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
};

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

export const truncateCardTitle = (str: string) => truncateWithTooltip(str, CARD_TITLE_LENGTH);
export const truncateCardDescription = (str: string) => truncate(str, CARD_DESCRIPTION_LENGTH);

export const truncateMeetingProject = (str: string) => truncateWithTooltip(str, MEETING_PROJECT_LENGTH);
export const truncateMeetingTeam = (str: string) => truncateWithTooltip(str, MEETING_TEAM_LENGTH);