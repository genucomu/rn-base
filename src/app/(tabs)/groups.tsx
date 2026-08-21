import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useCreateGroup, useGroups } from '@/features/groups/queries';
import { useTheme } from '@/hooks/use-theme';

export default function GroupsScreen() {
  const theme = useTheme();
  const { data: groups = [], isLoading, error } = useGroups();
  const createGroup = useCreateGroup();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ThemedText type="subtitle" style={styles.heading}>
            Groups
          </ThemedText>

          <Pressable
            onPress={() =>
              createGroup.mutate({
                name: `Planning team ${groups.length + 1}`,
                description: 'Nuevo equipo generado desde la vista de grupos.',
                color: '#a78bfa',
              })
            }
            style={({ pressed }) => [
              styles.createButton,
              { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <ThemedText type="smallBold">+ Create group</ThemedText>
          </Pressable>

          {isLoading && <ThemedText>Loading groups…</ThemedText>}
          {error && <ThemedText themeColor="textSecondary">Could not load groups.</ThemedText>}

          {!isLoading &&
            groups.map((group) => (
              <Pressable
                key={group.id}
                onPress={() => router.push({ pathname: '/groups/[id]', params: { id: group.id } })}
                style={({ pressed }) => [
                  styles.groupCard,
                  { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.9 : 1 },
                ]}
              >
                <ThemedView style={[styles.dot, { backgroundColor: group.color }]} />
                <ThemedView style={styles.cardText}>
                  <ThemedText type="default" style={styles.name}>
                    {group.name}
                  </ThemedText>
                  <ThemedText themeColor="textSecondary" type="small">
                    {group.members.length} members · {group.status}
                  </ThemedText>
                  <ThemedText themeColor="textSecondary" type="small" style={styles.description}>
                    {group.description}
                  </ThemedText>
                </ThemedView>
              </Pressable>
            ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingBottom: BottomTabInset,
  },
  contentContainer: {
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  heading: {
    marginBottom: Spacing.one,
  },
  createButton: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  groupCard: {
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 6,
  },
  cardText: {
    flex: 1,
    gap: Spacing.one,
  },
  name: {
    fontWeight: '700',
  },
  description: {
    marginTop: Spacing.one,
  },
});
