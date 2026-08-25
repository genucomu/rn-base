import type {
  CreateGroupInput,
  Group,
  GroupMember,
  UpdateGroupInput,
} from '@/features/groups/types';
import { http } from '@/services/http';

interface ApiGroup {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface GroupListResponse {
  items: ApiGroup[];
}

interface ApiGroupMember {
  userId: string;
  userEmail: string | null;
}

function mapMembers(members: ApiGroupMember[]): GroupMember[] {
  return members.map((member) => ({
    id: member.userId,
    name: member.userEmail ?? member.userId,
    role: '',
  }));
}

function mapGroup(group: ApiGroup): Group {
  return {
    id: group.id,
    name: group.name,
    description: group.description ?? '',
    color: '#64748b',
    ownerId: '',
    memberIds: [],
    members: [],
    status: 'active',
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}

async function withMembers(group: ApiGroup): Promise<Group> {
  const members = await http.get<ApiGroupMember[]>(`/tasks/groups/${group.id}/members`);
  const mappedMembers = mapMembers(members);

  return {
    id: group.id,
    name: group.name,
    description: group.description ?? '',
    color: '#64748b',
    ownerId: mappedMembers[0]?.id ?? '',
    memberIds: mappedMembers.map((member) => member.id),
    members: mappedMembers,
    status: 'active',
    createdAt: group.createdAt,
    updatedAt: group.updatedAt,
  };
}

export async function listGroups(): Promise<Group[]> {
  const response = await http.get<GroupListResponse>('/tasks/groups', { page: 1, limit: 100 });
  return response.items.map(mapGroup);
}

export async function getGroupById(id: string): Promise<Group> {
  const group = await http.get<ApiGroup>(`/tasks/groups/${id}`);
  try {
    const response = await withMembers(group);
    return response;
  } catch (error) {
    console.error('Error fetching group members:', error);
    return mapGroup(group);
  }
}

export async function createGroup(input: CreateGroupInput): Promise<Group> {
  const group = await http.post<ApiGroup>('/tasks/groups', {
    name: input.name.trim(),
    description: input.description,
  });
  const response = await withMembers(group);
  return response;
}

export async function updateGroup(id: string, input: UpdateGroupInput): Promise<Group> {
  const group = await http.patch<ApiGroup>(`/tasks/groups/${id}`, {
    name: input.name?.trim(),
    description: input.description,
  });
  return withMembers(group);
}

export function archiveGroup(id: string): Promise<void> {
  return http.delete<void>(`/tasks/groups/${id}`);
}
