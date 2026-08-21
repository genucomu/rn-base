import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import {
  useCreateSubtask,
  useDeleteSubtask,
  useSubtasks,
  useUpdateSubtask,
} from '@/features/subtasks/queries';
import { useTheme } from '@/hooks/use-theme';

export default function SubtasksScreen() {
  const theme = useTheme();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { data: subtasks = [], isLoading } = useSubtasks(taskId);
  const createSubtask = useCreateSubtask(taskId);
  const updateSubtask = useUpdateSubtask(taskId);
  const deleteSubtask = useDeleteSubtask(taskId);
  const [title, setTitle] = useState('');

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Pressable onPress={() => history.back()} style={styles.backButton}>
            <ThemedText type="linkPrimary">← Back</ThemedText>
          </Pressable>

          <ThemedText type="subtitle">Subtasks</ThemedText>

          <View style={styles.newRow}>
            <TextInput
              placeholder="New subtask title"
              value={title}
              onChangeText={setTitle}
              style={[{ backgroundColor: theme.backgroundElement }, styles.input]}
            />
            <Pressable
              onPress={() => {
                createSubtask.mutate({ title });
                setTitle('');
              }}
              style={({ pressed }) => [
                styles.createButton,
                { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <ThemedText type="smallBold">Add</ThemedText>
            </Pressable>
          </View>

          {isLoading && <ThemedText>Loading subtasks…</ThemedText>}

          {!isLoading &&
            subtasks.map((s) => (
              <ThemedView
                key={s.id}
                style={[styles.row, { backgroundColor: theme.backgroundElement }]}
              >
                <ThemedText type="default">
                  {s.order}. {s.title}
                </ThemedText>
                <View style={styles.rowActions}>
                  <Pressable
                    onPress={() =>
                      updateSubtask.mutate({
                        id: s.id,
                        input: { status: s.status === 'done' ? 'todo' : 'done' },
                      })
                    }
                    style={styles.actionButton}
                  >
                    <ThemedText type="small">{s.status === 'done' ? 'Undo' : 'Done'}</ThemedText>
                  </Pressable>
                  <Pressable onPress={() => deleteSubtask.mutate(s.id)} style={styles.actionButton}>
                    <ThemedText type="small">Delete</ThemedText>
                  </Pressable>
                </View>
              </ThemedView>
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
  newRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  input: {
    flex: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  createButton: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  row: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
  },
  rowActions: { flexDirection: 'row', gap: Spacing.one },
  actionButton: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one },
});
