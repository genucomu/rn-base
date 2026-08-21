import type {
  CreateGroupInput,
  Group,
  GroupStatus,
  UpdateGroupInput,
} from '@/features/groups/types';
import { ApiError } from '@/lib/http-client.types';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const memberSeed: Group['members'] = [
  { id: 'u-1', name: 'María García', role: 'Product owner' },
  { id: 'u-2', name: 'Lucas Pérez', role: 'Frontend' },
  { id: 'u-3', name: 'Sofía Ruiz', role: 'Design' },
  { id: 'u-4', name: 'Mateo López', role: 'QA' },
];

let groups: Group[] = [
  {
    id: 'grp-1',
    name: 'Product Launch',
    description: 'Planificación y seguimiento del lanzamiento de la nueva experiencia.',
    color: '#3b82f6',
    ownerId: 'u-1',
    memberIds: ['u-1', 'u-2', 'u-3'],
    members: [memberSeed[0], memberSeed[1], memberSeed[2]],
    status: 'active',
    createdAt: '2026-08-01T12:00:00.000Z',
    updatedAt: '2026-08-18T16:00:00.000Z',
  },
  {
    id: 'grp-2',
    name: 'Workspace Ops',
    description: 'Operaciones internas y mejoras del flujo de trabajo del equipo.',
    color: '#22c55e',
    ownerId: 'u-2',
    memberIds: ['u-2', 'u-4'],
    members: [memberSeed[1], memberSeed[3]],
    status: 'active',
    createdAt: '2026-08-08T09:15:00.000Z',
    updatedAt: '2026-08-20T11:40:00.000Z',
  },
  {
    id: 'grp-3',
    name: 'Marketing Sprint',
    description: 'Campañas, experiments y seguimiento de conversiones.',
    color: '#f59e0b',
    ownerId: 'u-3',
    memberIds: ['u-1', 'u-3'],
    members: [memberSeed[0], memberSeed[2]],
    status: 'archived',
    createdAt: '2026-07-12T14:05:00.000Z',
    updatedAt: '2026-08-15T10:00:00.000Z',
  },
];

function selectMembers(memberIds: string[] | undefined): Group['members'] {
  if (!memberIds || memberIds.length === 0) {
    return [memberSeed[0]];
  }

  const mapped = memberIds
    .map((memberId) => memberSeed.find((member) => member.id === memberId))
    .filter((member): member is Group['members'][number] => Boolean(member));

  return mapped.length > 0 ? mapped : [memberSeed[0]];
}

function normalizeStatus(status: GroupStatus | undefined): GroupStatus {
  return status === 'archived' ? 'archived' : 'active';
}

export async function listGroups(): Promise<Group[]> {
  await wait(250);
  return groups.map((group) => ({ ...group }));
}

export async function getGroupById(id: string): Promise<Group> {
  await wait(200);
  const match = groups.find((group) => group.id === id);
  if (!match) {
    throw new ApiError({
      code: 'GROUP_NOT_FOUND',
      message: 'No se encontró el grupo solicitado.',
      status: 404,
    });
  }

  return { ...match, members: [...match.members] };
}

export async function createGroup(input: CreateGroupInput): Promise<Group> {
  const trimmedName = input.name.trim();
  if (!trimmedName) {
    throw new ApiError({
      code: 'GROUP_NAME_REQUIRED',
      message: 'El nombre del grupo es obligatorio.',
      status: 422,
    });
  }

  await wait(300);
  const nextGroup: Group = {
    id: `grp-${Date.now()}`,
    name: trimmedName,
    description: input.description ?? 'Sin descripción',
    color: input.color ?? '#8b5cf6',
    ownerId: 'u-1',
    memberIds: input.memberIds ?? ['u-1'],
    members: selectMembers(input.memberIds ?? ['u-1']),
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  groups = [nextGroup, ...groups];
  return { ...nextGroup };
}

export async function updateGroup(id: string, input: UpdateGroupInput): Promise<Group> {
  await wait(250);
  const index = groups.findIndex((group) => group.id === id);
  if (index === -1) {
    throw new ApiError({
      code: 'GROUP_NOT_FOUND',
      message: 'No se encontró el grupo solicitado.',
      status: 404,
    });
  }

  const current = groups[index];
  const updated: Group = {
    ...current,
    name: input.name?.trim() || current.name,
    description: input.description ?? current.description,
    color: input.color ?? current.color,
    status: normalizeStatus(input.status ?? current.status),
    updatedAt: new Date().toISOString(),
  };

  groups[index] = updated;
  return { ...updated };
}

export async function archiveGroup(id: string): Promise<Group> {
  return updateGroup(id, { status: 'archived' });
}
