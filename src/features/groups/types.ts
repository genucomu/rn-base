export type GroupStatus = 'active' | 'archived';

export interface GroupMember {
  id: string;
  name: string;
  role: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  color: string;
  ownerId: string;
  memberIds: string[];
  members: GroupMember[];
  status: GroupStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  color?: string;
  memberIds?: string[];
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
  color?: string;
  status?: GroupStatus;
}
