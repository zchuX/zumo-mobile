import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from '../src/components/Icon';
import { useApp } from '../context/AppState';
import { useUserGroup, useUpdateUserGroup } from '../src/hooks/useTrips';
import { useFriends } from '../src/hooks/useFriends';
import type { FriendItem } from '../src/api/friendsService';
import type { GroupUser } from '../src/api/tripService';
import { colors, fontSize, spacing } from '../src/theme';

function getDisplayName(friend: FriendItem): string {
  return (friend.name?.trim() || friend.userArn?.split(/[:/]/).pop()) ?? '—';
}

export default function AddMemberSelectionScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { lang, nicknames, selectedGroupArn } = useApp();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: group, isLoading: groupLoading } = useUserGroup(selectedGroupArn);
  const { data: friendsData, isLoading: friendsLoading } = useFriends();
  const updateGroupMutation = useUpdateUserGroup();

  const existingUserIds = useMemo(() => new Set((group?.users ?? []).map((u) => u.userId)), [group?.users]);
  const friends = friendsData?.friends ?? [];
  const filteredFriends = useMemo(() => {
    const q = search.trim().toLowerCase();
    return friends.filter((f) => {
      if (existingUserIds.has(f.userArn)) return false;
      if (!q) return true;
      const name = getDisplayName(f).toLowerCase();
      const arn = (f.userArn ?? '').toLowerCase();
      return name.includes(q) || arn.includes(q);
    });
  }, [friends, search, existingUserIds]);

  const toggleFriend = (userArn: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userArn)) next.delete(userArn);
      else next.add(userArn);
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!selectedGroupArn || !group) return;
    const newUsers: GroupUser[] = selectedIds.size > 0
      ? Array.from(selectedIds).map((arn) => {
          const f = friends.find((x) => x.userArn === arn);
          return { userId: arn, name: f?.name ?? arn };
        })
      : [];
    const users: GroupUser[] = [...(group.users ?? []), ...newUsers];
    try {
      await updateGroupMutation.mutateAsync({ groupArn: selectedGroupArn, params: { users } });
      navigation.goBack();
    } catch {
      Alert.alert(lang === 'zh' ? '添加失败' : 'Failed to add members');
    }
  };

  const isLoading = groupLoading || friendsLoading;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.sage} />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{lang === 'zh' ? '未找到群组' : 'Group not found'}</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{lang === 'zh' ? '返回' : 'Back'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.p4 }]}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
          <Icon name="arrow_back_ios_new" size={24} color={colors.slate[800]} />
        </Pressable>
        <Text style={styles.headerTitle}>{lang === 'zh' ? '添加成员' : 'Add Members'}</Text>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.searchWrap}>
        <Icon name="search" size={20} color={colors.slate[400]} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={lang === 'zh' ? '搜索姓名、备注或 ID...' : 'Search name, nickname, or ID...'}
          placeholderTextColor={colors.slate[400]}
          style={styles.searchInput}
        />
      </View>

      <Text style={styles.sectionLabel}>{lang === 'zh' ? '好友列表' : 'FRIENDS'}</Text>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {filteredFriends.map((friend) => {
          const isSelected = selectedIds.has(friend.userArn);
          const nickname = nicknames[friend.userArn];
          return (
            <Pressable
              key={friend.userArn}
              onPress={() => toggleFriend(friend.userArn)}
              style={[styles.row, isSelected && styles.rowSelected]}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getDisplayName(friend).charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowName, isSelected && styles.rowNameSelected]}>
                  {nickname || getDisplayName(friend)}
                  {nickname ? ` (${getDisplayName(friend)})` : ''}
                </Text>
                <Text style={styles.rowId}>ID: {friend.userArn}</Text>
              </View>
              <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Icon name="check" size={14} color={colors.white} />}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={handleConfirm}
          disabled={updateGroupMutation.isPending || selectedIds.size === 0}
          style={[styles.confirmBtn, (updateGroupMutation.isPending || selectedIds.size === 0) && styles.confirmBtnDisabled]}
        >
          {updateGroupMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.confirmBtnText}>{lang === 'zh' ? '确认添加' : 'Confirm'}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  pressed: { opacity: 0.9 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: fontSize.sm, color: colors.slate[600], marginBottom: 16 },
  backBtn: { paddingVertical: 12, paddingHorizontal: 24, backgroundColor: colors.sage, borderRadius: 12 },
  backBtnText: { color: colors.white, fontWeight: '700' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.p6,
    paddingBottom: spacing.p3,
  },
  headerBtn: { width: 40, height: 40 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.slate[900] },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: spacing.p6,
    marginBottom: spacing.p3,
    paddingHorizontal: spacing.p4,
    paddingVertical: 12,
    backgroundColor: colors.slate[50],
    borderRadius: 20,
  },
  searchInput: { flex: 1, padding: 0, fontSize: 14, fontWeight: '700', color: colors.slate[800] },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate[400],
    marginHorizontal: spacing.p6,
    marginBottom: spacing.p2,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.p6, paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.p4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.slate[100],
    marginBottom: spacing.p2,
  },
  rowSelected: { backgroundColor: colors.sage + '15', borderColor: colors.sage + '40' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.p4,
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: colors.slate[600] },
  rowContent: { flex: 1 },
  rowName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.slate[800] },
  rowNameSelected: { color: colors.sage },
  rowId: { fontSize: 9, fontWeight: '800', color: colors.slate[400], marginTop: 2 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.slate[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: { backgroundColor: colors.sage, borderColor: colors.sage },
  footer: { padding: spacing.p6, paddingTop: spacing.p4 },
  confirmBtn: {
    backgroundColor: colors.sage,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { fontSize: fontSize.base, fontWeight: '800', color: colors.white },
});