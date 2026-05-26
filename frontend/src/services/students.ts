import api from './api';

export interface Student {
  id: string;
  name: string;
  group: string;
  university_id: number;
  created_at: string;
  updated_at: string | null;
}

export interface CreateStudentData {
  name: string;
  group: string;
  university_id: number;
}

export const createStudent = async (data: CreateStudentData): Promise<Student> => {
  const response = await api.post('/students/', data);
  return response.data;
};