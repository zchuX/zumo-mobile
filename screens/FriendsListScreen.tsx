import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { FriendsStackParamList } from '../navigation/types';
import Icon from '../src/components/Icon';
import { useApp } from '../context/AppState';
import { useFriends, useRemoveFriend } from '../src/hooks/useFriends';
import type { FriendItem } from '../src/api/friendsService';
import { colors, fontSize, spacing } from '../src/theme';

type FriendsListNav = NativeStackNavigationProp<FriendsStackParamList, 'FriendsList'>;

function getDisplayName(friend: FriendItem): string {
  return (friend.name?.trim() || friend.userArn?.split(/[:/]/).pop()) ?? '—';
}

const SWIPE_REVEAL_WIDTH = 72;

function SwipeableFriendRow({
  friend,
  onPress,
  onRemove,
  lang,
}: {
  friend: FriendItem;
  onPress: () => void;
  onRemove: () => void;
  lang: string;
}) {
  const pan = useRef(new Animated.Value(0)).current;
  const currentX = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10,
      onPanResponderGrant: () => {
        currentX.current = pan.__getValue?.() ?? (pan as any)._value ?? 0;
      },
      onPanResponderMove: (_, g) => {
        const next = Math.min(0, Math.max(-SWIPE_REVEAL_WIDTH, currentX.current + g.dx));
        currentX.current = next;
        pan.setValue(next);
      },
      onPanResponderRelease: () => {
        const x = currentX.current;
        const toValue = x < -SWIPE_REVEAL_WIDTH / 2 ? -SWIPE_REVEAL_WIDTH : 0;
        Animated.spring(pan, { toValue, useNativeDriver: true, damping: 20, stiffness: 300 }).start();
      },
    })
  ).current;
  useEffect(() => {
    const listener = pan.addListener(({ value }) => {
      currentX.current = value;
    });
    return () => pan.removeListener(listener);
  }, [pan]);

  const displayName = getDisplayName(friend);
  return (
    <View style={rowStyles.wrapper}>
      <View style={rowStyles.deleteStrip}>
        <Pressable onPress={onRemove} style={({ pressed }) => [rowStyles.deleteBtn, pressed && rowStyles.pressed]} hitSlop={12}>
          <Icon name="delete" size={22} color={colors.rose[500]} />
          <Text style={rowStyles.deleteLabel}>{lang === 'zh' ? '删除' : 'Delete'}</Text>
        </Pressable>
      </View>
      <Animated.View
        style={[rowStyles.row, { transform: [{ translateX: pan }] }]}
        {...panResponder.panHandlers}
      >
        <Pressable onPress={onPress} style={({ pressed }) => [rowStyles.rowInner, pressed && rowStyles.pressed]}>
          <View style={rowStyles.avatar}>
            <Text style={rowStyles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={rowStyles.rowContent}>
            <Text style={rowStyles.name}>{displayName}</Text>
          </View>
          <Icon name="chevron_right" size={20} color={colors.slate[300]} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  wrapper: { position: 'relative', overflow: 'hidden' as const },
  deleteStrip: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: SWIPE_REVEAL_WIDTH,
    backgroundColor: colors.rose[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.slate[100],
  },
  deleteBtn: { alignItems: 'center', justifyContent: 'center', padding: 8 },
  deleteLabel: { fontSize: 8, fontWeight: '800', color: colors.rose[500], marginTop: 2, textTransform: 'uppercase' as const },
  pressed: { opacity: 0.9 },
  row: { backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.slate[100] },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.p6,
    paddingVertical: spacing.p4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.p4,
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: colors.slate[600] },
  rowContent: { flex: 1 },
  name: { fontSize: 14, fontWeight: '800', color: colors.slate[800] },
});

function groupFriendsByLetter(friends: FriendItem[], search: string) {
  const q = search.trim().toLowerCase();
  const filtered = q
    ? friends.filter((f) => (f.name ?? '').trim().toLowerCase().includes(q))
    : friends;
  const sorted = [...filtered].sort((a, b) => getDisplayName(a).localeCompare(getDisplayName(b)));
  const groups: Record<string, FriendItem[]> = {};
  sorted.forEach((f) => {
    const firstChar = getDisplayName(f).charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(firstChar) ? firstChar : '#';
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(f);
  });
  const keys = Object.keys(groups).sort((a, b) => {
    if (a === '#') return 1;
    if (b === '#') return -1;
    return a.localeCompare(b);
  });
  return keys.map((letter) => ({ letter, members: groups[letter] }));
}

export default function FriendsListScreen() {
  const navigation = useNavigation<FriendsListNav>();
  const insets = useSafeAreaInsets();
  const { t, lang, setSelectedMemberId, setMemberProfileSource } = useApp();
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<TextInput>(null);
  const { data, isLoading, isError, refetch } = useFriends();
  const removeFriendMutation = useRemoveFriend();

  const friends = data?.friends ?? [];
  const grouped = useMemo(() => groupFriendsByLetter(friends, search), [friends, search]);

  useEffect(() => {
    // Prevent entering screen with search auto-focused.
    const t = setTimeout(() => searchInputRef.current?.blur(), 0);
    return () => clearTimeout(t);
  }, []);

  const handleFriendPress = (userArn: string) => {
    Keyboard.dismiss();
    setSelectedMemberId(userArn);
    setMemberProfileSource('friends');
    navigation.navigate('MemberProfile', { memberId: userArn, source: 'friends' });
  };

  const handleAddFriend = () => {
    navigation.navigate('PeopleSearch', { initialQuery: search.trim() || undefined });
  };

  const handleRemoveFriend = (friend: FriendItem) => {
    const name = getDisplayName(friend);
    Alert.alert(
      lang === 'zh' ? '删除好友' : 'Remove friend',
      lang === 'zh' ? `确定要删除 ${name} 吗？` : `Remove ${name} from your friends?`,
      [
        { text: lang === 'zh' ? '取消' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'zh' ? '删除' : 'Remove',
          style: 'destructive',
          onPress: () => {
            removeFriendMutation.mutate(friend.userArn);
          },
        },
      ]
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.p4 }]}>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
            <Icon name="arrow_back_ios_new" size={20} color={colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>{t.friends}</Text>
          <Pressable onPress={handleAddFriend} style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
            <Icon name="person_add" size={20} color={colors.white} />
          </Pressable>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchWrap}>
            <Icon name="search" size={20} color={colors.slate[400]} />
            <TextInput
              ref={searchInputRef}
              value={search}
              onChangeText={setSearch}
              placeholder={lang === 'zh' ? '搜索姓名' : 'Search name'}
              placeholderTextColor={colors.slate[400]}
              style={styles.searchInput}
              autoFocus={false}
              returnKeyType="done"
              blurOnSubmit
              onSubmitEditing={Keyboard.dismiss}
            />
          </View>
        </View>
        <View style={styles.searchListBorder}>
          <View style={styles.searchListBorderLine} />
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.sage} />
            <Text style={styles.loadingText}>{t.loading ?? 'Loading...'}</Text>
          </View>
        ) : isError ? (
          <View style={styles.centered}>
            <Icon name="error_outline" size={48} color={colors.slate[300]} />
            <Text style={styles.errorText}>{lang === 'zh' ? '加载好友列表失败' : 'Failed to load friends'}</Text>
            <Pressable onPress={() => refetch()} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>{lang === 'zh' ? '重试' : 'Retry'}</Text>
            </Pressable>
          </View>
        ) : grouped.length === 0 ? (
          <View style={styles.centered}>
            <Icon name="contacts_product" size={64} color={colors.slate[200]} />
            <Text style={styles.emptyText}>
              {search.trim()
                ? (lang === 'zh' ? '未找到相关好友' : 'No friends found')
                : (lang === 'zh' ? '暂无好友' : 'No friends yet')}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {grouped.map(({ letter, members }) => (
              <View key={letter}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLetter}>{letter}</Text>
                </View>
                {members.map((friend) => (
                  <SwipeableFriendRow
                    key={friend.userArn}
                    friend={friend}
                    onPress={() => handleFriendPress(friend.userArn)}
                    onRemove={() => handleRemoveFriend(friend)}
                    lang={lang}
                  />
                ))}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </TouchableWithoutFeedback>
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
  headerTitle: {
    fontSize: fontSize.base,
    fontWeight: '800',
    letterSpacing: -0.5,
    textTransform: 'uppercase',
    color: colors.white,
  },
  searchSection: {
    marginHorizontal: spacing.p6,
    marginTop: spacing.p6,
    marginBottom: 0,
    gap: spacing.p3,
  },
  searchListBorder: {
    marginTop: spacing.p4,
    marginBottom: spacing.p3,
    paddingHorizontal: spacing.p6,
  },
  searchListBorderLine: {
    height: 2,
    backgroundColor: colors.slate[200],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.slate[300],
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: spacing.p4,
    paddingVertical: 10,
    backgroundColor: colors.slate[50],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.slate[100],
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.slate[800],
    padding: 0,
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.p6 },
  loadingText: { marginTop: 12, fontSize: fontSize.sm, fontWeight: '600', color: colors.slate[500] },
  errorText: { marginTop: 12, fontSize: fontSize.sm, fontWeight: '600', color: colors.slate[500], textAlign: 'center' },
  retryBtn: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: colors.sage, borderRadius: 12 },
  retryBtnText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.white },
  emptyText: { marginTop: 12, fontSize: fontSize.sm, fontWeight: '700', color: colors.slate[400] },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  sectionHeader: {
    paddingHorizontal: spacing.p6,
    paddingVertical: 8,
    backgroundColor: colors.slate[50],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.slate[100],
  },
  sectionLetter: { fontSize: 10, fontWeight: '800', color: colors.sage, letterSpacing: 1 },
});
