import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useDeleteTask, useTasks } from '@/features/tasks/queries';
import { useTheme } from '@/hooks/use-theme';

export default function TasksListScreen() {
  const theme = useTheme();
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const { data: tasks = [], isLoading, error } = useTasks(groupId);
  const deleteTask = useDeleteTask(groupId);

  const openCreateTask = () =>
    router.push({ pathname: '/groups/[id]/tasks/new', params: { id: groupId } });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText type="linkPrimary">← Back</ThemedText>
          </Pressable>

          <ThemedText type="subtitle">Tasks</ThemedText>

          <Pressable
            onPress={openCreateTask}
            style={({ pressed }) => [
              styles.createButton,
              { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <ThemedText type="smallBold">+ Create task</ThemedText>
          </Pressable>

          {isLoading && <ThemedText>Loading tasks…</ThemedText>}
          {error && <ThemedText themeColor="textSecondary">Could not load tasks.</ThemedText>}

          {!isLoading && !error && tasks.length === 0 && (
            <ThemedView style={styles.emptyState}>
              <ThemedText themeColor="textSecondary">No tasks yet.</ThemedText>
              <Pressable
                onPress={openCreateTask}
                style={({ pressed }) => [
                  styles.emptyStateButton,
                  { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.9 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Create your first task"
              >
                <ThemedText type="smallBold">Create your first task</ThemedText>
              </Pressable>
            </ThemedView>
          )}

          {!isLoading &&
            tasks.map((task) => (
              <Pressable
                key={task.id}
                onPress={() =>
                  router.push({
                    pathname: '/groups/[id]/tasks/[taskId]',
                    params: { id: groupId, taskId: task.id },
                  })
                }
                style={({ pressed }) => [
                  styles.taskCard,
                  { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <ThemedView style={styles.taskRow}>
                  <ThemedText type="default" style={styles.title}>
                    {task.title}
                  </ThemedText>
                  <ThemedText themeColor="textSecondary" type="small">
                    {task.status} · {task.priority}
                  </ThemedText>
                </ThemedView>
                <Pressable onPress={() => deleteTask.mutate(task.id)} style={styles.deleteButton}>
                  <ThemedText type="small">Delete</ThemedText>
                </Pressable>
              </Pressable>
            ))}
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
  createButton: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  taskCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  taskRow: { flex: 1, gap: Spacing.one },
  title: { fontWeight: '700' },
  deleteButton: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
  emptyState: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.four },
  emptyStateButton: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
