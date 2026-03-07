import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { FriendsStackParamList } from '../navigation/types';
import Icon from '../src/components/Icon';
import { useApp } from '../context/AppState';
import { useUserSearchByQuery } from '../src/hooks/useUsers';
import type { UserSearchResult } from '../src/api/userService';
import { colors, fontSize, spacing } from '../src/theme';

type PeopleSearchResultsRoute = RouteProp<FriendsStackParamList, 'PeopleSearchResults'>;

function getDisplayName(user: UserSearchResult): string {
  return (user.name?.trim() || user.userArn?.split(/[:/]/).pop()) ?? '—';
}

export default function PeopleSearchResultsScreen() {
  const navigation = useNavigation();
  const route = useRoute<PeopleSearchResultsRoute>();
  const insets = useSafeAreaInsets();
  const { lang, setSelectedMemberId, setMemberProfileSource } = useApp();
  const query = route.params?.query ?? '';
  const { data, isLoading, isError, error } = useUserSearchByQuery(query);

  const results = data?.users ?? [];

  const handleSelectUser = (user: UserSearchResult) => {
    setSelectedMemberId(user.userArn);
    setMemberProfileSource('people_search_results');
    navigation.navigate('MemberProfile', {
      memberId: user.userArn,
      source: 'people_search_results',
      avatarUrl: user.photoUrl ?? undefined,
      displayName: user.name ?? undefined,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.p4 }]}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
          <Icon name="chevron_left" size={28} color={colors.slate[600]} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{lang === 'zh' ? '搜索结果' : 'Search Results'}</Text>
          {query ? <Text style={styles.headerQuery}>"{query}"</Text> : null}
        </View>
        <View style={styles.backBtn} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.sage} />
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Icon name="error_outline" size={64} color={colors.slate[300]} />
          <Text style={styles.emptyTitle}>{lang === 'zh' ? '搜索失败' : 'Search failed'}</Text>
          <Text style={styles.emptySub}>{(error as Error)?.message ?? (lang === 'zh' ? '请稍后重试。' : 'Please try again later.')}</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.centered}>
          <Icon name="person_off" size={64} color={colors.slate[200]} />
          <Text style={styles.emptyTitle}>{lang === 'zh' ? '未找到匹配结果' : 'No matches found'}</Text>
          <Text style={styles.emptySub}>{lang === 'zh' ? '请尝试使用不同的关键词搜索。' : 'Try searching for something else.'}</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.resultCount}>
            {lang === 'zh' ? `找到 ${results.length} 个结果` : `${results.length} PEOPLE FOUND`}
          </Text>
          {results.map((user) => (
            <Pressable
              key={user.userArn}
              onPress={() => handleSelectUser(user)}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              {user.photoUrl ? (
                <Image source={{ uri: user.photoUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getDisplayName(user).charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={styles.rowContent}>
                <Text style={styles.name}>{getDisplayName(user)}</Text>
                <Text style={styles.userArn}>ID: {user.userArn}</Text>
              </View>
              <Icon name="chevron_right" size={24} color={colors.sage} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate[50] },
  pressed: { opacity: 0.9 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.p6,
    paddingBottom: spacing.p4,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[100],
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.slate[900] },
  headerQuery: { fontSize: 10, fontWeight: '700', color: colors.slate[400], marginTop: 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.p6 },
  emptyTitle: { fontSize: fontSize.sm, fontWeight: '800', color: colors.slate[500], marginTop: 12 },
  emptySub: { fontSize: 10, color: colors.slate[400], marginTop: 8, textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.p6, paddingBottom: 24 },
  resultCount: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.slate[400],
    marginBottom: spacing.p3,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.p4,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.slate[100],
    marginBottom: spacing.p3,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.p4,
  },
  avatarImage: { width: 56, height: 56, borderRadius: 16, marginRight: spacing.p4, backgroundColor: colors.slate[200] },
  avatarText: { fontSize: 20, fontWeight: '800', color: colors.slate[600] },
  rowContent: { flex: 1 },
  name: { fontSize: 15, fontWeight: '800', color: colors.slate[800] },
  userArn: { fontSize: 10, fontWeight: '700', color: colors.slate[400], marginTop: 2 },
});
