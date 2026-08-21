import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTask, deleteTask, getTask, listTasks, updateTask } from '@/features/tasks/api';
import type { CreateTaskInput, UpdateTaskInput } from '@/features/tasks/types';

const TASKS_KEY = (groupId: string) => ['groups', groupId, 'tasks'] as const;

export function useTasks(groupId?: string) {
  return useQuery({
    queryKey: groupId ? TASKS_KEY(groupId) : ['tasks'],
    enabled: Boolean(groupId),
    queryFn: () => {
      if (!groupId) throw new Error('Missing groupId');
      return listTasks(groupId);
    },
  });
}

export function useTask(groupId?: string, taskId?: string) {
  return useQuery({
    queryKey: ['groups', groupId, 'tasks', taskId],
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
      qc.invalidateQueries({ queryKey: TASKS_KEY(task.groupId) });
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
      qc.invalidateQueries({ queryKey: TASKS_KEY(task.groupId) });
      qc.setQueryData(['groups', task.groupId, 'tasks', task.id], task);
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
      if (groupId) qc.invalidateQueries({ queryKey: TASKS_KEY(groupId) });
    },
  });
}
