import api from './api';

export interface TeamMember {
  id: string;
  team_id: string;
  student_id: string;
  student_name: string;
  position: string;
  joined_at: string;
  left_at: string | null;
  is_current: boolean;
  group?: string;
  shortId?: string;
}

export interface AddTeamMemberData {
  student_id: string;
  position: string;
  joined_at: string;
}

const getShortId = (studentId: string): string => {
  return studentId.slice(-4);
};

const getStudentById = async (studentId: string) => {
  const response = await api.get(`/students/${studentId}`);
  return response.data;
};

export const getTeamMembers = async (teamId: string, currentOnly: boolean = true): Promise<TeamMember[]> => {
  const response = await api.get(`/teams/${teamId}/members?current_only=${currentOnly}`);
  const members = response.data;
  
  const membersWithDetails = await Promise.all(
    members.map(async (member: TeamMember) => {
      try {
        const student = await getStudentById(member.student_id);
        return {
          ...member,
          group: student.group || '—',
          shortId: getShortId(member.student_id)
        };
      } catch (err) {
        console.error(`Ошибка загрузки данных студента ${member.student_id}:`, err);
        return {
          ...member,
          group: '—',
          shortId: getShortId(member.student_id)
        };
      }
    })
  );
  
  return membersWithDetails;
};

export const addTeamMember = async (teamId: string, data: AddTeamMemberData): Promise<TeamMember> => {
  const response = await api.post(`/teams/${teamId}/members`, data);
  const newMember = response.data;
  
  try {
    const student = await getStudentById(newMember.student_id);
    return {
      ...newMember,
      group: student.group || '—',
      shortId: getShortId(newMember.student_id)
    };
  } catch {
    return {
      ...newMember,
      group: '—',
      shortId: getShortId(newMember.student_id)
    };
  }
};

export const endTeamMember = async (teamId: string, memberId: string): Promise<TeamMember> => {
  try {
    const response = await api.post(`/teams/${teamId}/members/${memberId}/end`);
    return response.data;
  } catch (error) {
    const axiosError = error as { response?: { status?: number; data?: { detail?: string } } };
    if (axiosError.response?.status === 409) {
      console.log(`Участник ${memberId} уже завершил членство или не может быть завершён`);
      return {} as TeamMember;
    }
    throw error;
  }
};