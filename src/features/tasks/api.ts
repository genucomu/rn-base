import type { CreateTaskInput, Task, UpdateTaskInput } from '@/features/tasks/types';
import { ApiError } from '@/lib/http-client.types';

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

let tasks: Task[] = [
  {
    id: 't-1',
    groupId: 'grp-1',
    title: 'Define launch metrics',
    description: 'Definir KPIs y dashboards iniciales',
    status: 'in_progress',
    priority: 'high',
    assigneeId: 'u-2',
    dueDate: '2026-09-01T00:00:00.000Z',
    completedAt: null,
    createdAt: '2026-08-10T10:00:00.000Z',
    updatedAt: '2026-08-18T10:00:00.000Z',
  },
  {
    id: 't-2',
    groupId: 'grp-1',
    title: 'Write release notes',
    description: 'Borrador de notas para stakeholders',
    status: 'todo',
    priority: 'medium',
    assigneeId: 'u-1',
    dueDate: undefined,
    completedAt: null,
    createdAt: '2026-08-12T09:00:00.000Z',
    updatedAt: '2026-08-12T09:00:00.000Z',
  },
  {
    id: 't-3',
    groupId: 'grp-2',
    title: 'Upgrade workspace infra',
    description: 'Actualizar dependencias y scripts internos',
    status: 'todo',
    priority: 'low',
    assigneeId: 'u-4',
    dueDate: undefined,
    completedAt: null,
    createdAt: '2026-08-09T08:00:00.000Z',
    updatedAt: '2026-08-09T08:00:00.000Z',
  },
];

export async function listTasks(
  groupId: string,
  _filters?: { status?: string; priority?: string },
): Promise<Task[]> {
  await wait(200);
  return tasks.filter((t) => t.groupId === groupId);
}

export async function getTask(groupId: string, id: string): Promise<Task> {
  await wait(150);
  const match = tasks.find((t) => t.groupId === groupId && t.id === id);
  if (!match) {
    throw new ApiError({ code: 'TASK_NOT_FOUND', message: 'Task not found', status: 404 });
  }
  return { ...match };
}

export async function createTask(groupId: string, input: CreateTaskInput): Promise<Task> {
  const title = input.title?.trim();
  if (!title) {
    throw new ApiError({ code: 'TASK_TITLE_REQUIRED', message: 'Title is required', status: 422 });
  }

  await wait(250);
  const newTask: Task = {
    id: `t-${Date.now()}`,
    groupId,
    title,
    description: input.description ?? '',
    status: 'todo',
    priority: input.priority ?? 'medium',
    assigneeId: input.assigneeId,
    dueDate: input.dueDate,
    completedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tasks = [newTask, ...tasks];
  return { ...newTask };
}

export async function updateTask(
  groupId: string,
  id: string,
  input: UpdateTaskInput,
): Promise<Task> {
  await wait(200);
  const idx = tasks.findIndex((t) => t.groupId === groupId && t.id === id);
  if (idx === -1) {
    throw new ApiError({ code: 'TASK_NOT_FOUND', message: 'Task not found', status: 404 });
  }

  const current = tasks[idx];
  const updated: Task = {
    ...current,
    title: input.title?.trim() || current.title,
    description: input.description ?? current.description,
    status: (input.status as Task['status']) ?? current.status,
    priority: (input.priority as Task['priority']) ?? current.priority,
    assigneeId: input.assigneeId ?? current.assigneeId,
    dueDate: input.dueDate ?? current.dueDate,
    completedAt: input.status === 'done' ? new Date().toISOString() : current.completedAt,
    updatedAt: new Date().toISOString(),
  };

  tasks[idx] = updated;
  return { ...updated };
}

export async function deleteTask(groupId: string, id: string): Promise<void> {
  await wait(150);
  const idx = tasks.findIndex((t) => t.groupId === groupId && t.id === id);
  if (idx === -1) {
    throw new ApiError({ code: 'TASK_NOT_FOUND', message: 'Task not found', status: 404 });
  }
  tasks = tasks.filter((t) => !(t.groupId === groupId && t.id === id));
}
