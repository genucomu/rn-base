import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCreateTask, useDeleteTask, useTasks } from '@/features/tasks/queries';
import { useTheme } from '@/hooks/use-theme';

export default function TasksListScreen() {
  const theme = useTheme();
  const { id: groupId } = useLocalSearchParams<{ id: string }>();
  const { data: tasks = [], isLoading, error } = useTasks(groupId);
  const createTask = useCreateTask(groupId);
  const deleteTask = useDeleteTask(groupId);
  console.log('tasks: ', tasks);
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText type="linkPrimary">← Back</ThemedText>
          </Pressable>

          <ThemedText type="subtitle">Tasks</ThemedText>

          <Pressable
            onPress={() =>
              createTask.mutate({
                title: `New task ${tasks.length + 1}`,
                description: 'Created from tasks screen',
                priority: 'medium',
              })
            }
            style={({ pressed }) => [
              styles.createButton,
              { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <ThemedText type="smallBold">+ Create task</ThemedText>
          </Pressable>

          {isLoading && <ThemedText>Loading tasks…</ThemedText>}
          {error && <ThemedText themeColor="textSecondary">Could not load tasks.</ThemedText>}

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
});
