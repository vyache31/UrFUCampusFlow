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
}

export interface AddTeamMemberData {
  student_id: string;
  position: string;
  joined_at: string;
}

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
          group: student.group || '—'
        };
      } catch (err) {
        console.error(`Ошибка загрузки данных студента ${member.student_id}:`, err);
        return {
          ...member,
          group: '—'
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
      group: student.group || '—'
    };
  } catch {
    return {
      ...newMember,
      group: '—'
    };
  }
};

export const endTeamMember = async (teamId: string, memberId: string): Promise<TeamMember> => {
  const response = await api.post(`/teams/${teamId}/members/${memberId}/end`);
  return response.data;
};