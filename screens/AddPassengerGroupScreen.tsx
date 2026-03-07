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
import { useTrip, useCreateUserGroup, useTripUsers } from '../src/hooks/useTrips';
import { useFriends } from '../src/hooks/useFriends';
import type { FriendItem } from '../src/api/friendsService';
import type { GroupUser } from '../src/api/tripService';
import { colors, fontSize, spacing } from '../src/theme';

function getDisplayName(friend: FriendItem): string {
  return (friend.name?.trim() || friend.userArn?.split(/[:/]/).pop()) ?? '—';
}

function normalizeUserId(id: string | null | undefined): string {
  return (id ?? '').replace(/^user:/i, '').trim().toLowerCase();
}

function extractUserIdFromUserTrip(u: { arn?: string; userStatusKey?: string } | null | undefined): string | null {
  // Backend doesn't currently expose userId directly; it is typically embedded in `userStatusKey` or `arn`.
  const key = (u?.userStatusKey ?? '').trim();
  if (key) {
    const tail = key.split('#').pop() ?? key;
    if (tail) return tail;
  }
  const arn = (u?.arn ?? '').trim();
  if (arn) return arn.split('/').pop() ?? arn.split(':').pop() ?? arn;
  return null;
}

export default function AddPassengerGroupScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { lang, user, nicknames, selectedTripId } = useApp();
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState('');

  const { data: trip } = useTrip(selectedTripId ?? null);
  const { data: tripUsersData } = useTripUsers(selectedTripId ?? null);
  const { data: friendsData, isLoading: friendsLoading } = useFriends();
  const createGroupMutation = useCreateUserGroup();

  const usersAlreadyInTrip = useMemo(() => {
    const ids = new Set<string>();
    const users = tripUsersData?.users ?? [];
    for (const ut of users) {
      const raw = extractUserIdFromUserTrip(ut);
      if (!raw) continue;
      ids.add(normalizeUserId(raw));
    }
    if (trip?.participants?.length) {
      for (const p of trip.participants) {
        const id = p.user?.userArn ?? p.user?.id ?? '';
        if (id) ids.add(normalizeUserId(id));
      }
    }
    return ids;
  }, [tripUsersData?.users, trip?.participants]);

  const friends = friendsData?.friends ?? [];
  const filteredFriends = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter((f) => {
      const name = getDisplayName(f).toLowerCase();
      const arn = (f.userArn ?? '').toLowerCase();
      return name.includes(q) || arn.includes(q);
    });
  }, [friends, search]);

  const currentUserArn = user?.userArn ?? user?.id ?? '';
  const selfIsAlreadyInTrip = usersAlreadyInTrip.has(normalizeUserId(currentUserArn));
  const totalPassengers = (selfIsAlreadyInTrip ? 0 : 1) + selectedIds.size; // self (if eligible) + selected friends
  const defaultGroupName = user?.name ? (lang === 'zh' ? `${user.name} 的小组` : `${user.name}'s Group`) : (lang === 'zh' ? '我的小组' : 'My Group');
  const displayGroupName = groupName.trim() || defaultGroupName;

  const canCreateGroup = totalPassengers > 0;

  const handleCreateGroup = async () => {
    if (!canCreateGroup || !selectedTripId || !trip || !user) return;
    const friendUsers: GroupUser[] = Array.from(selectedIds).map((arn) => {
      const f = friends.find((x) => x.userArn === arn);
      return { userId: arn, name: f?.name ?? arn };
    });
    const users: GroupUser[] = [
      ...(selfIsAlreadyInTrip ? [] : [{ userId: currentUserArn, name: user.name ?? 'Me' }]),
      ...friendUsers,
    ];
    const pickupTime = Math.floor(Date.now() / 1000);
    try {
      await createGroupMutation.mutateAsync({
        tripArn: selectedTripId,
        groupName: displayGroupName,
        start: trip.origin ?? '',
        destination: trip.destination ?? '',
        pickupTime,
        users,
      });
      navigation.navigate('TripDetail', { tripId: selectedTripId, title: 'Trip Detail' });
    } catch {
      Alert.alert(lang === 'zh' ? '创建小组失败' : 'Failed to create group');
    }
  };

  const toggleFriend = (userArn: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userArn)) next.delete(userArn);
      else next.add(userArn);
      return next;
    });
  };

  if (!selectedTripId || !trip) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{lang === 'zh' ? '未选择行程' : 'No trip selected'}</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{lang === 'zh' ? '返回' : 'Back'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.p4 }]}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
          <Icon name="arrow_back_ios_new" size={20} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>{lang === 'zh' ? '新建乘客组' : 'New Passenger Group'}</Text>
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
            placeholder={lang === 'zh' ? '搜索姓名、备注或 ID...' : 'Search name, nickname, or ID...'}
            placeholderTextColor={colors.slate[400]}
            style={styles.searchInput}
          />
        </View>

        <Text style={styles.sectionLabel}>{lang === 'zh' ? '我' : 'ME'}</Text>
        <View style={[styles.meRow, selfIsAlreadyInTrip && styles.rowDisabled]}>
          <View style={styles.avatar}>
            <Text style={[styles.avatarText, selfIsAlreadyInTrip && styles.textDisabled]}>{(user.name ?? 'Me').charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.rowContent}>
            <Text style={[styles.rowName, selfIsAlreadyInTrip && styles.textDisabled]} numberOfLines={1}>
              {user.name} ({lang === 'zh' ? '本人' : 'Myself'})
            </Text>
            {selfIsAlreadyInTrip ? (
              <Text style={styles.rowHint} numberOfLines={1}>
                {lang === 'zh' ? '已在行程中，无法加入新小组' : 'Already in trip'}
              </Text>
            ) : (
              <Text style={styles.rowHintMuted} numberOfLines={1}>
                {lang === 'zh' ? '将加入本小组' : 'Will be in this group'}
              </Text>
            )}
          </View>
        </View>

        <Text style={styles.sectionLabel}>{lang === 'zh' ? '好友' : 'FRIENDS'}</Text>
        {filteredFriends.length === 0 ? (
          <View style={styles.friendsEmpty}>
            <Icon name="group" size={48} color={colors.slate[200]} />
            <Text style={styles.friendsEmptyText}>
              {search.trim() ? (lang === 'zh' ? '未找到好友' : 'No friends found') : (lang === 'zh' ? '暂无好友' : 'No friends')}
            </Text>
          </View>
        ) : (
          filteredFriends.map((friend) => {
            const isInTrip = usersAlreadyInTrip.has(normalizeUserId(friend.userArn));
            const isSelected = selectedIds.has(friend.userArn);
            const nickname = nicknames[friend.userArn];
            return (
              <Pressable
                key={friend.userArn}
                onPress={() => (isInTrip ? null : toggleFriend(friend.userArn))}
                disabled={isInTrip}
                style={[styles.row, isSelected && styles.rowSelected, isInTrip && styles.rowDisabled]}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{getDisplayName(friend).charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.rowContent}>
                  <Text
                    style={[
                      styles.rowName,
                      isSelected && styles.rowNameSelected,
                      isInTrip && styles.textDisabled,
                    ]}
                    numberOfLines={1}
                  >
                    {nickname || getDisplayName(friend)}
                    {nickname ? ` (${getDisplayName(friend)})` : ''}
                  </Text>
                  <Text style={styles.rowId}>ID: {friend.userArn}</Text>
                </View>
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected, isInTrip && styles.checkboxDisabled]}>
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
          onPress={handleCreateGroup}
          disabled={!canCreateGroup || createGroupMutation.isPending}
          style={({ pressed }) => [
            styles.confirmBtn,
            (!canCreateGroup || createGroupMutation.isPending) && styles.confirmBtnDisabled,
            pressed && canCreateGroup && !createGroupMutation.isPending && styles.pressed,
          ]}
        >
          {createGroupMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.confirmBtnText}>{lang === 'zh' ? '创建小组' : 'Create Group'}</Text>
          )}
        </Pressable>
        <View style={styles.scrollBottomSpacer} />
      </ScrollView>
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
  pressed: { opacity: 0.9 },
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
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate[400],
    marginBottom: spacing.p2,
  },
  meRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.p4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.sage + '40',
    marginBottom: spacing.p4,
  },
  meRowLocked: { backgroundColor: colors.sage + '10' },
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
  rowDisabled: { opacity: 0.45 },
  textDisabled: { color: colors.slate[400] },
  rowHint: { fontSize: 10, fontWeight: '700', color: colors.slate[400], marginTop: 2 },
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
  lockedBadge: { marginLeft: 8 },
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
  checkboxDisabled: { borderColor: colors.slate[200] },
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