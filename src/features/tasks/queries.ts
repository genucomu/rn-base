import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignTask,
  changeTaskStatus,
  createTask,
  deleteTask,
  getTask,
  listTasks,
  listTaskTypes,
  updateTask,
} from '@/features/tasks/api';
import type { AssignTaskInput, CreateTaskInput, UpdateTaskInput } from '@/features/tasks/types';
import { queryKeys } from '@/lib/query-keys';

export function useTasks(groupId?: string) {
  return useQuery({
    queryKey: groupId ? queryKeys.tasks.list(groupId) : queryKeys.tasks.all,
    enabled: Boolean(groupId),
    queryFn: () => {
      if (!groupId) throw new Error('Missing groupId');
      return listTasks(groupId);
    },
    select: (data) => {
      return data.items;
    },
  });
}

export function useTask(groupId?: string, taskId?: string) {
  return useQuery({
    queryKey: groupId && taskId ? queryKeys.tasks.detail(groupId, taskId) : queryKeys.tasks.all,
    enabled: Boolean(groupId && taskId),
    queryFn: () => {
      if (!groupId || !taskId) throw new Error('Missing params');
      return getTask(taskId);
    },
  });
}

export function useTaskTypes() {
  return useQuery({
    queryKey: queryKeys.tasks.types,
    queryFn: listTaskTypes,
  });
}

export function useCreateTask(groupId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => {
      if (!groupId) throw new Error('Missing groupId');
      return createTask(groupId, input);
    },
    onSuccess: (task) => {
      if (!task.groupId) throw new Error('Invalid task response: missing groupId');
      qc.invalidateQueries({ queryKey: queryKeys.tasks.list(task.groupId) });
    },
  });
}

export function useUpdateTask(groupId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) => {
      if (!groupId) throw new Error('Missing groupId');
      return updateTask(groupId, id, input);
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.list(task.groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.tasks.detail(task.groupId, task.id) });
    },
  });
}

export function useChangeTaskStatus(groupId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => {
      if (!groupId) throw new Error('Missing groupId');
      return changeTaskStatus(id, status as Parameters<typeof changeTaskStatus>[1]);
    },
    onSuccess: (task) => {
      qc.setQueryData(queryKeys.tasks.detail(task.groupId, task.id), task);
      qc.invalidateQueries({ queryKey: queryKeys.tasks.detail(task.groupId, task.id) });
      qc.invalidateQueries({ queryKey: queryKeys.tasks.list(task.groupId) });
    },
  });
}

export function useAssignTask(groupId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: AssignTaskInput }) => {
      if (!groupId || !taskId || !input.assigneeId) throw new Error('Missing params');
      return assignTask(taskId, input);
    },
    onSuccess: (task) => {
      qc.setQueryData(queryKeys.tasks.detail(task.groupId, task.id), task);
      qc.invalidateQueries({ queryKey: queryKeys.tasks.detail(task.groupId, task.id) });
      qc.invalidateQueries({ queryKey: queryKeys.tasks.list(task.groupId) });
    },
  });
}

export function useDeleteTask(groupId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!groupId) throw new Error('Missing groupId');
      return deleteTask(groupId, id);
    },
    onSuccess: (_data, id) => {
      if (groupId) {
        qc.invalidateQueries({ queryKey: queryKeys.tasks.list(groupId) });
        qc.removeQueries({ queryKey: queryKeys.tasks.detail(groupId, id) });
      }
    },
  });
}
