import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTask, deleteTask, getTask, listTasks, updateTask } from '@/features/tasks/api';
import type { CreateTaskInput, UpdateTaskInput } from '@/features/tasks/types';
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
      return getTask(groupId, taskId);
    },
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
      qc.setQueryData(queryKeys.tasks.detail(task.groupId, task.id), task);
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
    onSuccess: () => {
      if (groupId) qc.invalidateQueries({ queryKey: queryKeys.tasks.list(groupId) });
    },
  });
}
