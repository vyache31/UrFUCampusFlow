import api from './api';

export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'monthly';
  interval: number;
  days_of_week?: string[];
  day_of_month?: number;
  index?: 'first' | 'second' | 'third' | 'fourth' | 'last';
  month?: number;
  first_day_of_week?: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
}


export interface RecurrenceRange {
  type: 'noEnd' | 'endDate' | 'numbered';
  start_date: string;
  end_date?: string;
  number_of_occurrences?: number;
  recurrence_time_zone?: string;
}

export interface CreateMeetingsSeriesData {
  title: string;
  start_at: string;
  end_at: string;
  location?: string;
  event_link?: string;
  notes?: string;
  recurrence: {
    pattern: RecurrencePattern;
    range: RecurrenceRange;
  };
}

export interface MeetingsSeriesResponse {
  title: string;
  start_at: string;
  location: string | null;
  end_at: string;
  event_link: string | null;
  recurrence: {
    pattern: RecurrencePattern;
    range: RecurrenceRange;
  };
}

export const createMeetingsSeries = async (teamId: string, data: CreateMeetingsSeriesData): Promise<MeetingsSeriesResponse> => {
  const cleanedData = {
    ...data,
    location: data.location || '',
    event_link: data.event_link || '',
    notes: data.notes || '',
  };
  const response = await api.post(`/teams/${teamId}/meetings-series`, cleanedData);
  return response.data;
};

export const getMeetingsSeries = async (teamId: string): Promise<MeetingsSeriesResponse[]> => {
  const response = await api.get(`/teams/${teamId}/meetings-series`);
  return response.data;
};

export const deleteMeetingsSeries = async (teamId: string, seriesId: string): Promise<void> => {
  await api.delete(`/teams/${teamId}/meetings-series/${seriesId}`);
};