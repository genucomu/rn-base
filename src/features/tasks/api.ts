import type {
  AssignTaskInput,
  CreateTaskInput,
  Task,
  TaskDetail,
  TaskType,
  UpdateTaskInput,
} from '@/features/tasks/types';
import { ApiError } from '@/lib/http-client.types';
import { http } from '@/services/http';
import type { PaginatedResponse } from '@/types/pagination';

export async function listTasks(
  groupId: string,
  _filters?: { status?: string; priority?: string },
): Promise<PaginatedResponse<Task>> {
  return http.get<PaginatedResponse<Task>>('/tasks/tasks', {
    groupId,
  });
}

export async function listTaskTypes(): Promise<TaskType[]> {
  return http.get<TaskType[]>('/tasks/task-types');
}

export function getTask(id: string): Promise<TaskDetail> {
  return http.get<TaskDetail>(`/tasks/tasks/${id}`);
}

export function assignTask(id: string, input: AssignTaskInput): Promise<TaskDetail> {
  return http.post<TaskDetail>(`/tasks/tasks/${id}/assign`, input);
}

export async function createTask(groupId: string, input: CreateTaskInput): Promise<Task> {
  if (!groupId) {
    throw new ApiError({ code: 'GROUP_ID_REQUIRED', message: 'groupId is required', status: 422 });
  }

  const title = input.title?.trim();
  if (!title) {
    throw new ApiError({ code: 'TASK_TITLE_REQUIRED', message: 'Title is required', status: 422 });
  }

  const body = {
    groupId,
    typeId: input.typeId,
    title,
    description: input.description,
    priceCents: input.priceCents,
    assigneeId: input.assigneeId,
  };

  return http.post<Task>('/tasks/tasks', body);
}

export async function updateTask(
  groupId: string,
  id: string,
  input: UpdateTaskInput,
): Promise<TaskDetail> {
  if (!groupId) {
    throw new ApiError({ code: 'GROUP_ID_REQUIRED', message: 'groupId is required', status: 422 });
  }

  return http.patch<TaskDetail>(`/tasks/tasks/${id}`, {
    title: input.title?.trim(),
    description: input.description,
    priceCents: input.priceCents,
  });
}

export function changeTaskStatus(id: string, status: Task['status']): Promise<TaskDetail> {
  return http.patch<TaskDetail>(`/tasks/tasks/${id}/status`, { status });
}

export function deleteTask(groupId: string, id: string): Promise<void> {
  if (!groupId) {
    return Promise.reject(
      new ApiError({ code: 'GROUP_ID_REQUIRED', message: 'groupId is required', status: 422 }),
    );
  }

  return http.delete<void>(`/tasks/tasks/${id}`);
}
