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

export interface UpdateStudentData {
  name?: string;
  group?: string;
  university_id?: number;
}

export const createStudent = async (data: CreateStudentData): Promise<Student> => {
  const response = await api.post('/students/', data);
  return response.data;
};

// Обновление студента
export const updateStudent = async (studentId: string, data: UpdateStudentData): Promise<Student> => {
  const response = await api.patch(`/students/${studentId}`, data);
  return response.data;
};

// Поиск студентов по имени
export const searchStudents = async (query: string): Promise<Student[]> => {
  if (!query.trim() || query.trim().length < 2) return [];
  
  try {
    const response = await api.get('/students/?limit=100');
    const allStudents = response.data;
    
    const filtered = allStudents.filter((student: Student) =>
      student.name.toLowerCase().includes(query.toLowerCase())
    );
    
    return filtered;
  } catch (error) {
    console.error('Ошибка поиска студентов:', error);
    return [];
  }
};