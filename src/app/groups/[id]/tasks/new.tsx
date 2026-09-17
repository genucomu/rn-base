import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useGroup } from '@/features/groups/queries';
import { useCreateTask, useTaskTypes } from '@/features/tasks/queries';
import type { CreateTaskInput } from '@/features/tasks/types';
import { useTheme } from '@/hooks/use-theme';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function NewTaskScreen() {
  const theme = useTheme();
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const { data: group, isLoading: isGroupLoading, error: groupError } = useGroup(groupId);
  const {
    data: taskTypes = [],
    isLoading: areTaskTypesLoading,
    error: taskTypesError,
  } = useTaskTypes();
  const createTask = useCreateTask(groupId);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [typeId, setTypeId] = useState<string | null>(null);
  const [priceCents, setPriceCents] = useState('');
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);

    if (!groupId || !UUID_PATTERN.test(groupId)) {
      setError('El grupo no es válido.');
      return;
    }
    if (!title.trim()) {
      setError('El título es requerido.');
      return;
    }
    if (!description.trim()) {
      setError('La descripción es requerida.');
      return;
    }
    const selectedType = taskTypes.find((taskType) => taskType.id === typeId);
    if (!typeId || !selectedType || !UUID_PATTERN.test(typeId)) {
      setError('Seleccioná un tipo de tarea válido.');
      return;
    }
    if (!/^\d+$/.test(priceCents.trim())) {
      setError('El precio debe ser un entero mayor o igual a cero.');
      return;
    }
    const parsedPriceCents = Number(priceCents.trim());
    if (!Number.isSafeInteger(parsedPriceCents) || parsedPriceCents < 0) {
      setError('El precio está fuera del rango permitido.');
      return;
    }
    if (assigneeId !== null && !UUID_PATTERN.test(assigneeId)) {
      setError('El responsable no es válido.');
      return;
    }

    const input: CreateTaskInput = {
      title: title.trim(),
      description,
      typeId,
      priceCents: parsedPriceCents,
      assigneeId,
    };

    createTask.mutate(input, {
      onSuccess: () => {
        router.replace({ pathname: '/groups/[id]/tasks', params: { id: groupId } });
      },
      onError: (mutationError) => {
        setError(mutationError.message || 'No se pudo crear la tarea.');
      },
    });
  };

  const hasValidType = taskTypes.some(
    (taskType) => taskType.id === typeId && UUID_PATTERN.test(taskType.id),
  );
  const isSubmitDisabled =
    createTask.isPending ||
    isGroupLoading ||
    Boolean(groupError) ||
    !group ||
    areTaskTypesLoading ||
    !hasValidType;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => router.back()}
            disabled={createTask.isPending}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back to tasks"
          >
            <ThemedText type="linkPrimary">← Back</ThemedText>
          </Pressable>

          <ThemedText type="subtitle">Create task</ThemedText>
          {group && <ThemedText themeColor="textSecondary">Group: {group.name}</ThemedText>}
          {(groupError || (!isGroupLoading && !group)) && (
            <ThemedText themeColor="textSecondary">Could not load the group.</ThemedText>
          )}

          <ThemedText type="smallBold">Title</ThemedText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Task title"
            placeholderTextColor={theme.textSecondary}
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            accessibilityLabel="Task title"
            editable={!createTask.isPending}
          />

          <ThemedText type="smallBold">Description</ThemedText>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the task"
            placeholderTextColor={theme.textSecondary}
            multiline
            textAlignVertical="top"
            style={[
              styles.input,
              styles.descriptionInput,
              { color: theme.text, backgroundColor: theme.backgroundElement },
            ]}
            accessibilityLabel="Task description"
            editable={!createTask.isPending}
          />

          <ThemedText type="smallBold">Task type</ThemedText>
          {areTaskTypesLoading && <ActivityIndicator />}
          {taskTypesError && (
            <ThemedText themeColor="textSecondary">Could not load task types.</ThemedText>
          )}
          {!areTaskTypesLoading && !taskTypesError && taskTypes.length === 0 && (
            <ThemedText themeColor="textSecondary">No task types available.</ThemedText>
          )}
          {taskTypes.map((taskType) => (
            <Pressable
              key={taskType.id}
              onPress={() => setTypeId(taskType.id)}
              disabled={createTask.isPending}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor:
                    typeId === taskType.id ? theme.backgroundSelected : theme.backgroundElement,
                  opacity: pressed || createTask.isPending ? 0.7 : 1,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ checked: typeId === taskType.id }}
              accessibilityLabel={`Task type ${taskType.name}`}
            >
              <ThemedText>{taskType.name}</ThemedText>
            </Pressable>
          ))}

          <ThemedText type="smallBold">Price in cents</ThemedText>
          <TextInput
            value={priceCents}
            onChangeText={setPriceCents}
            placeholder="0"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            accessibilityLabel="Price in cents"
            editable={!createTask.isPending}
          />

          <ThemedText type="smallBold">Assignee</ThemedText>
          <Pressable
            onPress={() => setAssigneeId(null)}
            disabled={createTask.isPending}
            style={({ pressed }) => [
              styles.option,
              {
                backgroundColor:
                  assigneeId === null ? theme.backgroundSelected : theme.backgroundElement,
                opacity: pressed || createTask.isPending ? 0.7 : 1,
              },
            ]}
            accessibilityRole="radio"
            accessibilityState={{ checked: assigneeId === null }}
            accessibilityLabel="Unassigned"
          >
            <ThemedText>Sin asignar</ThemedText>
          </Pressable>
          {(group?.members ?? []).map((member) => (
            <Pressable
              key={member.id}
              onPress={() => setAssigneeId(member.id)}
              disabled={createTask.isPending}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor:
                    assigneeId === member.id ? theme.backgroundSelected : theme.backgroundElement,
                  opacity: pressed || createTask.isPending ? 0.7 : 1,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ checked: assigneeId === member.id }}
              accessibilityLabel={`Assignee ${member.name}`}
            >
              <ThemedText>{member.name}</ThemedText>
            </Pressable>
          ))}

          {error && <ThemedText themeColor="textSecondary">{error}</ThemedText>}

          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitDisabled}
            style={({ pressed }) => [
              styles.submitButton,
              {
                backgroundColor: theme.backgroundSelected,
                opacity: pressed || isSubmitDisabled ? 0.6 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Create task"
          >
            {createTask.isPending ? (
              <ActivityIndicator color={theme.text} />
            ) : (
              <ThemedText type="smallBold">Create task</ThemedText>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, paddingBottom: BottomTabInset },
  contentContainer: {
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.two,
  },
  backButton: { paddingVertical: Spacing.one },
  input: {
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#60646C',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  descriptionInput: { minHeight: 120 },
  option: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  submitButton: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
