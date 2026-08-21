import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useArchiveGroup, useGroup, useUpdateGroup } from '@/features/groups/queries';
import { useTheme } from '@/hooks/use-theme';

export default function GroupDetailScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: group, isLoading, error } = useGroup(id);
  const updateGroup = useUpdateGroup();
  const archiveGroup = useArchiveGroup();

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText>Loading group…</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  if (error || !group) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText>Group not found.</ThemedText>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ThemedText type="linkPrimary">← Back to groups</ThemedText>
          </Pressable>

          <ThemedView style={[styles.headerCard, { backgroundColor: theme.backgroundElement }]}>
            <ThemedView style={[styles.colorDot, { backgroundColor: group.color }]} />
            <ThemedText type="subtitle">{group.name}</ThemedText>
            <ThemedText themeColor="textSecondary">{group.status}</ThemedText>
          </ThemedView>

          <ThemedView style={[styles.section, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="default">Description</ThemedText>
            <ThemedText themeColor="textSecondary">{group.description}</ThemedText>
          </ThemedView>

          <ThemedView style={[styles.section, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="default">Members</ThemedText>
            {group.members.map((member) => (
              <ThemedView key={member.id} style={styles.memberRow}>
                <ThemedText type="smallBold">{member.name}</ThemedText>
                <ThemedText themeColor="textSecondary" type="small">
                  {member.role}
                </ThemedText>
              </ThemedView>
            ))}
          </ThemedView>

          <Pressable
            onPress={() =>
              router.push({ pathname: '/groups/[id]/tasks', params: { id: group.id } })
            }
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <ThemedText>Open tasks</ThemedText>
          </Pressable>

          <Pressable
            onPress={() =>
              updateGroup.mutate({
                id: group.id,
                input: { name: `${group.name} Updated`, description: group.description },
              })
            }
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.backgroundSelected, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <ThemedText>Rename group</ThemedText>
          </Pressable>

          <Pressable
            onPress={() => archiveGroup.mutate(group.id)}
            style={({ pressed }) => [
              styles.secondaryButton,
              { backgroundColor: theme.backgroundElement, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <ThemedText>Archive group</ThemedText>
          </Pressable>
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
  backButton: {
    paddingVertical: Spacing.one,
  },
  headerCard: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  section: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  memberRow: {
    gap: Spacing.one,
  },
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
