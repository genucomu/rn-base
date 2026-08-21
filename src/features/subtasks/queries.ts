import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSubtask,
  deleteSubtask,
  listSubtasks,
  reorderSubtasks,
  updateSubtask,
} from '@/features/subtasks/api';
import type { CreateSubtaskInput, Subtask, UpdateSubtaskInput } from '@/features/subtasks/types';

const SUBTASKS_KEY = (taskId: string) => ['tasks', taskId, 'subtasks'] as const;

export function useSubtasks(taskId?: string) {
  return useQuery({
    queryKey: taskId ? SUBTASKS_KEY(taskId) : ['subtasks'],
    enabled: Boolean(taskId),
    queryFn: () => {
      if (!taskId) throw new Error('Missing taskId');
      return listSubtasks(taskId);
    },
  });
}

export function useCreateSubtask(taskId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubtaskInput) => {
      if (!taskId) throw new Error('Missing taskId');
      return createSubtask(taskId, input);
    },
    onSuccess: (s: Subtask) => qc.invalidateQueries({ queryKey: SUBTASKS_KEY(s.taskId) }),
  });
}

export function useUpdateSubtask(taskId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSubtaskInput }) => {
      if (!taskId) throw new Error('Missing taskId');
      return updateSubtask(taskId, id, input);
    },
    onSuccess: (s: Subtask) => qc.invalidateQueries({ queryKey: SUBTASKS_KEY(s.taskId) }),
  });
}

export function useDeleteSubtask(taskId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!taskId) throw new Error('Missing taskId');
      return deleteSubtask(taskId, id);
    },
    onSuccess: () => {
      if (taskId) qc.invalidateQueries({ queryKey: SUBTASKS_KEY(taskId) });
    },
  });
}

export function useReorderSubtasks(taskId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (order: { id: string; order: number }[]) => {
      if (!taskId) throw new Error('Missing taskId');
      return reorderSubtasks(taskId, order);
    },
    onSuccess: (arr) => {
      if (arr?.[0]) qc.setQueryData(SUBTASKS_KEY(arr[0].taskId), arr);
    },
  });
}
