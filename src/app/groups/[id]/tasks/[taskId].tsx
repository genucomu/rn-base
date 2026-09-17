import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useGroup } from '@/features/groups/queries';
import { formatCents, formatIsoTimestamp } from '@/features/tasks/formatters';
import {
  useAssignTask,
  useChangeTaskStatus,
  useDeleteTask,
  useTask,
} from '@/features/tasks/queries';
import type { TaskDetail } from '@/features/tasks/types';
import { useTheme } from '@/hooks/use-theme';
import { HttpError } from '@/services/http';

function getParam(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function isTaskDetail(value: unknown): value is TaskDetail {
  if (!value || typeof value !== 'object') return false;

  const candidate = value as Partial<TaskDetail>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.title === 'string' &&
    candidate.title.length > 0 &&
    typeof candidate.status === 'string'
  );
}

function displayValue(value: unknown, fallback = 'Sin datos'): string {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function getAssignmentErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    if (error.status === 403) return 'No tenés permisos para asignar esta tarea.';
    if (error.status === 404) return 'La tarea o el miembro ya no existe.';
    if (error.status === 400 || error.status === 422) {
      return error.message || 'La selección no es válida.';
    }
  }

  return 'No se pudo asignar la tarea. Revisá tu conexión e intentá nuevamente.';
}

function getTaskErrorMessage(error: unknown): string {
  if (error instanceof HttpError) {
    if (error.status === 401) return 'Tu sesión expiró. Volvé a iniciar sesión.';
    if (error.status === 404) return 'Tarea no encontrada.';
    return `No se pudo cargar la tarea (${error.status}).`;
  }

  return 'No se pudo cargar la tarea. Revisá tu conexión e intentá nuevamente.';
}

export default function TaskDetailScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string | string[]; taskId?: string | string[] }>();
  const groupId = getParam(params.id);
  const taskId = getParam(params.taskId);
  const { data, isLoading, error, refetch } = useTask(groupId, taskId);
  const {
    data: group,
    isLoading: isGroupLoading,
    error: groupError,
    refetch: refetchGroup,
  } = useGroup(groupId);
  const changeTaskStatus = useChangeTaskStatus(groupId);
  const deleteTask = useDeleteTask(groupId);
  const assignTask = useAssignTask(groupId);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string | null>(null);
  const task = isTaskDetail(data) ? data : undefined;
  const isResponseInvalid = data !== undefined && !task;
  const isNotFound = error instanceof HttpError && error.status === 404;
  const taskIdForSelection = task?.id;
  const taskAssigneeId = task?.assigneeId;

  useEffect(() => {
    if (taskIdForSelection) setSelectedAssigneeId(taskAssigneeId ?? null);
  }, [taskAssigneeId, taskIdForSelection]);

  const renderState = (
    message: string,
    withRetry = false,
    onRetry: () => unknown = () => refetch(),
  ) => (
    <ThemedView className="flex-1 justify-center gap-4 p-6">
      <Pressable onPress={() => router.back()} className="py-1">
        <ThemedText type="linkPrimary">← Back</ThemedText>
      </Pressable>
      <ThemedText type="subtitle">{message}</ThemedText>
      {withRetry && (
        <Pressable
          onPress={() => void onRetry()}
          className="items-center rounded-lg bg-surface-200 px-6 py-4 active:opacity-90"
        >
          <ThemedText>Retry</ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );

  if (!groupId || !taskId) return renderState('Parámetros de tarea inválidos.');
  if (isLoading) {
    return (
      <ThemedView className="flex-1 items-center justify-center gap-4 p-6">
        <ActivityIndicator color={theme.text} />
        <ThemedText>Cargando tarea...</ThemedText>
      </ThemedView>
    );
  }
  if (isNotFound) return renderState('Tarea no encontrada.');
  if (error) return renderState(getTaskErrorMessage(error), true);

  if (isResponseInvalid || !task) return renderState('La respuesta de la tarea es inválida.', true);
  if (!group && !groupError && !isGroupLoading) {
    return renderState('La respuesta del grupo es inválida.', true, refetchGroup);
  }

  const subtasks = task.subtasks;
  const isAssignPending = assignTask.isPending;
  const isMutationPending = changeTaskStatus.isPending || deleteTask.isPending || isAssignPending;
  const members = group?.members ?? [];
  const currentAssignee = members.find((member) => member.id === task.assigneeId);
  const selectedMember = members.find((member) => member.id === selectedAssigneeId);
  const hasValidSelection = Boolean(selectedMember);
  const assignmentValidationMessage = isGroupLoading
    ? 'Cargando miembros del grupo...'
    : groupError
      ? 'No se pudieron cargar los miembros del grupo.'
      : members.length === 0
        ? 'No hay miembros disponibles para asignar esta tarea.'
        : selectedAssigneeId && !hasValidSelection
          ? 'Seleccioná un miembro válido del grupo.'
          : !selectedAssigneeId
            ? 'Seleccioná un miembro para asignar la tarea.'
            : undefined;

  return (
    <ThemedView className="flex-1">
      <SafeAreaView className="flex-1 pb-20">
        <ScrollView>
          <ThemedView className="mx-auto w-full max-w-200 gap-4 px-6 py-6">
            <Pressable onPress={() => router.back()} className="py-1">
              <ThemedText type="linkPrimary">← Back</ThemedText>
            </Pressable>

            <ThemedView type="backgroundElement" className="gap-2 rounded-xl p-4">
              <ThemedText type="subtitle">{task.title}</ThemedText>
              <ThemedText themeColor="textSecondary">
                Status: {displayValue(task.status)}
              </ThemedText>
              <ThemedText themeColor="textSecondary">
                Type: {displayValue(task.typeName)}
                {displayValue(task.typeCode, '') ? ` (${task.typeCode})` : ''}
              </ThemedText>
            </ThemedView>

            <ThemedView type="backgroundElement" className="gap-2 rounded-xl p-4">
              <ThemedText type="default">Description</ThemedText>
              <ThemedText themeColor="textSecondary">
                {displayValue(task.description, 'Sin descripción')}
              </ThemedText>
            </ThemedView>

            <ThemedView type="backgroundElement" className="gap-2 rounded-xl p-4">
              <ThemedText type="default">Task information</ThemedText>
              <ThemedText themeColor="textSecondary">
                Assignee: {currentAssignee?.name ?? displayValue(task.assigneeId, 'Sin asignar')}
              </ThemedText>
              <ThemedView className="gap-2">
                <ThemedText type="smallBold">Assign or reassign</ThemedText>
                {groupError && (
                  <Pressable
                    accessibilityLabel="Reintentar carga de miembros"
                    accessibilityRole="button"
                    className="items-center rounded-lg bg-surface-200 px-4 py-3 active:opacity-90"
                    onPress={() => void refetchGroup()}
                  >
                    <ThemedText>Reintentar</ThemedText>
                  </Pressable>
                )}
                {members.map((member) => {
                  const isSelected = selectedAssigneeId === member.id;

                  return (
                    <Pressable
                      key={member.id}
                      accessibilityLabel={`Asignar tarea a ${member.name}`}
                      accessibilityRole="radio"
                      accessibilityState={{
                        checked: isSelected,
                        disabled: isAssignPending || isGroupLoading,
                      }}
                      className={`rounded-lg border px-3 py-3 ${
                        isSelected ? 'border-primary-500 bg-primary-50' : 'border-surface-200'
                      } ${isAssignPending ? 'opacity-50' : ''}`}
                      disabled={isAssignPending || isGroupLoading}
                      onPress={() => {
                        assignTask.reset();
                        setSelectedAssigneeId(member.id);
                      }}
                    >
                      <ThemedText>{member.name}</ThemedText>
                    </Pressable>
                  );
                })}
                {assignmentValidationMessage && (
                  <ThemedText themeColor="textSecondary">{assignmentValidationMessage}</ThemedText>
                )}
                <Pressable
                  accessibilityLabel={selectedMember ? 'Reasignar tarea' : 'Asignar tarea'}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isMutationPending }}
                  className={`items-center rounded-lg px-4 py-3 ${
                    hasValidSelection && !isMutationPending ? 'bg-primary-500' : 'bg-surface-300'
                  }`}
                  disabled={!hasValidSelection || isMutationPending || isGroupLoading}
                  onPress={() => {
                    if (!selectedMember) return;
                    assignTask.mutate({
                      taskId: task.id,
                      input: { assigneeId: selectedMember.id },
                    });
                  }}
                >
                  <ThemedText>
                    {isAssignPending
                      ? 'Asignando...'
                      : selectedMember
                        ? 'Reasignar tarea'
                        : 'Asignar tarea'}
                  </ThemedText>
                </Pressable>
                {assignTask.isSuccess && (
                  <ThemedText className="text-primary-700">
                    Tarea asignada correctamente.
                  </ThemedText>
                )}
                {assignTask.isError && (
                  <ThemedText className="text-danger-700">
                    {getAssignmentErrorMessage(assignTask.error)}
                  </ThemedText>
                )}
              </ThemedView>
              {task.parentTaskId && (
                <ThemedText themeColor="textSecondary">Parent task: {task.parentTaskId}</ThemedText>
              )}
              <ThemedText themeColor="textSecondary">
                Price: {formatCents(task.priceCents)}
              </ThemedText>
              <ThemedText themeColor="textSecondary">
                Total amount: {formatCents(task.amountCents)}
              </ThemedText>
            </ThemedView>

            <ThemedView type="backgroundElement" className="gap-2 rounded-xl p-4">
              <ThemedText type="default">Dates</ThemedText>
              <ThemedText themeColor="textSecondary">
                Created: {formatIsoTimestamp(task.createdAt)}
              </ThemedText>
              <ThemedText themeColor="textSecondary">
                Updated: {formatIsoTimestamp(task.updatedAt)}
              </ThemedText>
            </ThemedView>

            <ThemedView type="backgroundElement" className="gap-2 rounded-xl p-4">
              <ThemedText type="default">Subtasks</ThemedText>
              {subtasks.length === 0 ? (
                <ThemedText themeColor="textSecondary">No subtasks.</ThemedText>
              ) : (
                subtasks.map((subtask) => (
                  <ThemedView key={subtask.id} className="gap-1 border-surface-300 border-t pt-2">
                    <ThemedText type="smallBold">{displayValue(subtask.title)}</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      Status: {displayValue(subtask.status)}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      Assignee: {displayValue(subtask.assigneeId, 'Sin asignar')}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      Description: {displayValue(subtask.description, 'Sin descripción')}
                    </ThemedText>
                    {subtask.parentTaskId && (
                      <ThemedText type="small" themeColor="textSecondary">
                        Parent task: {subtask.parentTaskId}
                      </ThemedText>
                    )}
                    <ThemedText type="small" themeColor="textSecondary">
                      Amount: {formatCents(subtask.amountCents ?? subtask.priceCents)}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      Created: {formatIsoTimestamp(subtask.createdAt)}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      Updated: {formatIsoTimestamp(subtask.updatedAt)}
                    </ThemedText>
                  </ThemedView>
                ))
              )}
            </ThemedView>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/groups/[id]/tasks/[taskId]/subtasks',
                  params: { id: groupId, taskId: task.id },
                })
              }
              className="items-center rounded-lg bg-surface-200 px-6 py-4 active:opacity-90"
            >
              <ThemedText>Manage subtasks</ThemedText>
            </Pressable>

            <Pressable
              disabled={isMutationPending}
              onPress={() => changeTaskStatus.mutate({ id: task.id, status: 'done' })}
              className={`items-center rounded-lg bg-surface-200 px-6 py-4 ${
                isMutationPending ? 'opacity-50' : 'active:opacity-90'
              }`}
            >
              <ThemedText>{changeTaskStatus.isPending ? 'Guardando...' : 'Mark done'}</ThemedText>
            </Pressable>

            <Pressable
              disabled={isMutationPending}
              onPress={() => deleteTask.mutate(task.id)}
              className={`items-center rounded-lg bg-surface-100 px-6 py-4 ${
                isMutationPending ? 'opacity-50' : 'active:opacity-90'
              }`}
            >
              <ThemedText>{deleteTask.isPending ? 'Eliminando...' : 'Delete task'}</ThemedText>
            </Pressable>

            {(changeTaskStatus.isError || deleteTask.isError) && (
              <ThemedText themeColor="textSecondary">
                No se pudo completar la acción. Intentá nuevamente.
              </ThemedText>
            )}
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}
