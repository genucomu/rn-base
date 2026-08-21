import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  archiveGroup,
  createGroup,
  getGroupById,
  listGroups,
  updateGroup,
} from '@/features/groups/api';
import type { CreateGroupInput, Group, UpdateGroupInput } from '@/features/groups/types';

const GROUPS_QUERY_KEY = ['groups'] as const;

export function useGroups() {
  return useQuery({
    queryKey: GROUPS_QUERY_KEY,
    queryFn: listGroups,
  });
}

export function useGroup(id?: string) {
  return useQuery({
    queryKey: ['groups', id],
    enabled: Boolean(id),
    queryFn: () => {
      if (!id) {
        throw new Error('Missing group id');
      }
      return getGroupById(id);
    },
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateGroupInput) => createGroup(input),
    onSuccess: (group) => {
      queryClient.setQueryData<Group[]>(GROUPS_QUERY_KEY, (current) => [group, ...(current ?? [])]);
      queryClient.setQueryData(['groups', group.id], group);
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateGroupInput }) => updateGroup(id, input),
    onSuccess: (group) => {
      queryClient.setQueryData<Group[]>(GROUPS_QUERY_KEY, (current) =>
        (current ?? []).map((item) => (item.id === group.id ? group : item)),
      );
      queryClient.setQueryData(['groups', group.id], group);
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
    },
  });
}

export function useArchiveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => archiveGroup(id),
    onSuccess: (group) => {
      queryClient.setQueryData<Group[]>(GROUPS_QUERY_KEY, (current) =>
        (current ?? []).map((item) => (item.id === group.id ? group : item)),
      );
      queryClient.setQueryData(['groups', group.id], group);
      queryClient.invalidateQueries({ queryKey: GROUPS_QUERY_KEY });
    },
  });
}
