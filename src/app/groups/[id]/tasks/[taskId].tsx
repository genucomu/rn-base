import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useDeleteTask, useTask, useUpdateTask } from '@/features/tasks/queries';
import { useTheme } from '@/hooks/use-theme';

export default function TaskDetailScreen() {
  const theme = useTheme();
  const { id: groupId, taskId } = useLocalSearchParams<{ id: string; taskId: string }>();
  const { data: task, isLoading, error } = useTask(groupId, taskId as string);
  const updateTask = useUpdateTask(groupId);
  const deleteTask = useDeleteTask(groupId);

  if (isLoading) return <ThemedText>Loading task…</ThemedText>;
  if (error || !task) return <ThemedText>Task not found.</ThemedText>;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText type="linkPrimary">← Back</ThemedText>
          </Pressable>

          <ThemedView style={[styles.headerCard, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="subtitle">{task.title}</ThemedText>
            <ThemedText themeColor="textSecondary">
              {task.status} · {task.priority}
            </ThemedText>
          </ThemedView>

          <ThemedView style={[styles.section, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="default">Description</ThemedText>
            <ThemedText themeColor="textSecondary">{task.description}</ThemedText>
          </ThemedView>

          <Pressable
            onPress={() =>
              router.push({
                pathname: '/groups/[id]/tasks/[taskId]/subtasks',
                params: { id: groupId, taskId: task.id },
              })
            }
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <ThemedText>Manage subtasks</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => updateTask.mutate({ id: task.id, input: { status: 'done' } })}
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <ThemedText>Mark done</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => deleteTask.mutate(task.id)}
            style={({ pressed }) => [
              styles.secondaryButton,
              { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <ThemedText>Delete task</ThemedText>
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
    gap: Spacing.three,
  },
  backButton: { paddingVertical: Spacing.one },
  headerCard: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  section: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  primaryButton: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  secondaryButton: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
});
