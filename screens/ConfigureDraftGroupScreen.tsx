import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from '../src/components/Icon';
import { useApp } from '../context/AppState';
import { useFriends } from '../src/hooks/useFriends';
import type { FriendItem } from '../src/api/friendsService';
import { colors, fontSize, spacing } from '../src/theme';

function getDisplayName(friend: FriendItem): string {
  return (friend.name?.trim() || friend.userArn?.split(/[:/]/).pop()) ?? '—';
}

export default function ConfigureDraftGroupScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { lang, user, nicknames, draftPassengerGroup, setDraftPassengerGroup } = useApp();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState('');

  const { data: friendsData, isLoading: friendsLoading } = useFriends();
  const friends = friendsData?.friends ?? [];
  const currentUserArn = user?.userArn ?? user?.id ?? '';
  const defaultGroupName = user?.name ? (lang === 'zh' ? `${user.name} 的小组` : `${user.name}'s Group`) : (lang === 'zh' ? '我的小组' : 'My Group');

  useEffect(() => {
    if (draftPassengerGroup) {
      setGroupName(draftPassengerGroup.groupName);
      const others = draftPassengerGroup.userIds.filter((id) => id !== currentUserArn);
      setSelectedIds(new Set(others));
    } else {
      setGroupName(defaultGroupName);
      setSelectedIds(new Set());
    }
  }, [draftPassengerGroup, currentUserArn, defaultGroupName]);

  const filteredFriends = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((f) => {
      const name = getDisplayName(f).toLowerCase();
      const arn = (f.userArn ?? '').toLowerCase();
      return name.includes(q) || arn.includes(q);
    });
  }, [friends, search]);

  const totalPassengers = 1 + selectedIds.size;
  const displayGroupName = groupName.trim() || defaultGroupName;
  const canSave = totalPassengers > 0;

  const handleSave = () => {
    const userIds = [currentUserArn, ...Array.from(selectedIds)];
    setDraftPassengerGroup({ groupName: displayGroupName, userIds });
    navigation.goBack();
  };

  const toggleFriend = (userArn: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userArn)) next.delete(userArn);
      else next.add(userArn);
      return next;
    });
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.p4 }]}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
          <Icon name="arrow_back_ios_new" size={20} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>{lang === 'zh' ? '乘客小组' : 'Passenger Group'}</Text>
        <View style={styles.headerRightBadge}>
          <Text style={styles.passengerBadgeText}>{totalPassengers}</Text>
          <Icon name="group" size={18} color={colors.white} />
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.searchWrap}>
          <Icon name="search" size={20} color={colors.slate[400]} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={lang === 'zh' ? '搜索姓名' : 'Search name'}
            placeholderTextColor={colors.slate[400]}
            style={styles.searchInput}
          />
        </View>

        <Text style={styles.sectionLabel}>{lang === 'zh' ? '我' : 'ME'}</Text>
        <View style={styles.meRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name ?? 'Me').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.rowContent}>
            <Text style={styles.rowName} numberOfLines={1}>{user?.name} ({lang === 'zh' ? '本人' : 'Myself'})</Text>
            <Text style={styles.rowHintMuted} numberOfLines={1}>{lang === 'zh' ? '将加入本小组' : 'Will be in this group'}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>{lang === 'zh' ? '好友' : 'FRIENDS'}</Text>
        {friendsLoading ? (
          <View style={styles.friendsEmpty}>
            <ActivityIndicator size="small" color={colors.sage} />
            <Text style={styles.friendsEmptyText}>{lang === 'zh' ? '加载好友...' : 'Loading friends...'}</Text>
          </View>
        ) : filteredFriends.length === 0 ? (
          <View style={styles.friendsEmpty}>
            <Icon name="group" size={48} color={colors.slate[200]} />
            <Text style={styles.friendsEmptyText}>
              {search.trim() ? (lang === 'zh' ? '未找到好友' : 'No friends found') : (lang === 'zh' ? '暂无好友' : 'No friends')}
            </Text>
          </View>
        ) : (
          filteredFriends.map((friend) => {
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
                  <Text style={[styles.rowName, isSelected && styles.rowNameSelected]} numberOfLines={1}>
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
          })
        )}

        <Text style={[styles.sectionLabel, styles.groupNameLabel]} numberOfLines={1}>
          {lang === 'zh' ? '小组名称' : 'GROUP NAME'}
        </Text>
        <TextInput
          value={groupName}
          onChangeText={setGroupName}
          placeholder={defaultGroupName}
          placeholderTextColor={colors.slate[400]}
          style={styles.groupNameInput}
        />

        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          style={({ pressed }) => [styles.confirmBtn, !canSave && styles.confirmBtnDisabled, pressed && canSave && styles.pressed]}
        >
          <Text style={styles.confirmBtnText}>{lang === 'zh' ? '完成' : 'Done'}</Text>
        </Pressable>
        <View style={styles.scrollBottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  pressed: { opacity: 0.9 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.p6,
    paddingBottom: spacing.py3,
    backgroundColor: colors.sage,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  headerTitle: { fontSize: fontSize.base, fontWeight: '800', letterSpacing: -0.5, textTransform: 'uppercase', color: colors.white },
  passengerBadgeText: { fontSize: fontSize.sm, fontWeight: '800', color: colors.white },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.p6, paddingBottom: 24 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.p4,
    paddingHorizontal: spacing.p4,
    paddingVertical: 12,
    backgroundColor: colors.slate[50],
    borderRadius: 20,
  },
  searchInput: { flex: 1, padding: 0, fontSize: 14, fontWeight: '700', color: colors.slate[800] },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: colors.slate[400], marginBottom: 8 },
  meRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.p4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.sage + '40',
    marginBottom: spacing.p4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.p4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.slate[100],
    marginBottom: 8,
  },
  rowSelected: { backgroundColor: colors.sage + '15', borderColor: colors.sage + '40' },
  rowHintMuted: { fontSize: 10, fontWeight: '700', color: colors.sage, marginTop: 2, opacity: 0.9 },
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
  friendsEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.p8,
    paddingHorizontal: spacing.p6,
    marginBottom: spacing.p4,
    backgroundColor: colors.slate[50],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.slate[100],
  },
  friendsEmptyText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.slate[400], marginTop: spacing.gap3 },
  groupNameLabel: { marginTop: spacing.p6 },
  groupNameInput: {
    backgroundColor: colors.slate[50],
    borderRadius: 16,
    paddingHorizontal: spacing.p4,
    paddingVertical: 12,
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.slate[800],
    marginBottom: spacing.p6,
  },
  confirmBtn: {
    backgroundColor: colors.sage,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { fontSize: fontSize.base, fontWeight: '800', color: colors.white },
  scrollBottomSpacer: { height: 40 },
});
