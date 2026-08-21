import type { CreateSubtaskInput, Subtask, UpdateSubtaskInput } from '@/features/subtasks/types';
import { ApiError } from '@/lib/http-client.types';

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

let subtasks: Subtask[] = [
  {
    id: 'st-1',
    taskId: 't-1',
    title: 'Collect metrics',
    status: 'todo',
    order: 1,
    createdAt: '2026-08-11T10:00:00.000Z',
    updatedAt: '2026-08-11T10:00:00.000Z',
  },
  {
    id: 'st-2',
    taskId: 't-1',
    title: 'Design dashboard',
    status: 'todo',
    order: 2,
    createdAt: '2026-08-12T12:00:00.000Z',
    updatedAt: '2026-08-12T12:00:00.000Z',
  },
];

export async function listSubtasks(taskId: string): Promise<Subtask[]> {
  await wait(150);
  return subtasks.filter((s) => s.taskId === taskId).sort((a, b) => a.order - b.order);
}

export async function createSubtask(taskId: string, input: CreateSubtaskInput): Promise<Subtask> {
  const title = input.title?.trim();
  if (!title) {
    throw new ApiError({ code: 'SUBTASK_TITLE_REQUIRED', message: 'Title required', status: 422 });
  }

  await wait(200);
  const next: Subtask = {
    id: `st-${Date.now()}`,
    taskId,
    title,
    status: 'todo',
    order: (subtasks.filter((s) => s.taskId === taskId).length || 0) + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  subtasks = [...subtasks, next];
  return { ...next };
}

export async function updateSubtask(
  taskId: string,
  id: string,
  input: UpdateSubtaskInput,
): Promise<Subtask> {
  await wait(150);
  const idx = subtasks.findIndex((s) => s.taskId === taskId && s.id === id);
  if (idx === -1) {
    throw new ApiError({ code: 'SUBTASK_NOT_FOUND', message: 'Not found', status: 404 });
  }

  const current = subtasks[idx];
  const updated: Subtask = {
    ...current,
    title: input.title?.trim() || current.title,
    status: (input.status as Subtask['status']) ?? current.status,
    order: input.order ?? current.order,
    updatedAt: new Date().toISOString(),
  };

  subtasks[idx] = updated;
  // normalize orders if changed
  const tasksForParent = subtasks
    .filter((s) => s.taskId === taskId)
    .sort((a, b) => a.order - b.order);
  tasksForParent.forEach((s, i) => {
    s.order = i + 1;
  });
  subtasks = [...subtasks.filter((s) => s.taskId !== taskId), ...tasksForParent];

  return { ...updated };
}

export async function deleteSubtask(taskId: string, id: string): Promise<void> {
  await wait(120);
  const idx = subtasks.findIndex((s) => s.taskId === taskId && s.id === id);
  if (idx === -1) {
    throw new ApiError({ code: 'SUBTASK_NOT_FOUND', message: 'Not found', status: 404 });
  }

  subtasks = subtasks.filter((s) => !(s.taskId === taskId && s.id === id));
  // reindex orders
  const tasksForParent = subtasks
    .filter((s) => s.taskId === taskId)
    .sort((a, b) => a.order - b.order);
  tasksForParent.forEach((s, i) => {
    s.order = i + 1;
  });
  subtasks = [...subtasks.filter((s) => s.taskId !== taskId), ...tasksForParent];
}

export async function reorderSubtasks(
  taskId: string,
  order: { id: string; order: number }[],
): Promise<Subtask[]> {
  await wait(150);
  const forTask = subtasks.filter((s) => s.taskId === taskId);
  forTask.forEach((s) => {
    const match = order.find((o) => o.id === s.id);
    if (match) s.order = match.order;
  });
  const normalized = [
    ...subtasks.filter((s) => s.taskId !== taskId),
    ...forTask.sort((a, b) => a.order - b.order),
  ];
  subtasks = normalized;
  return subtasks.filter((s) => s.taskId === taskId).sort((a, b) => a.order - b.order);
}
