import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { FriendsStackParamList } from '../navigation/types';
import Icon from '../src/components/Icon';
import { useApp } from '../context/AppState';
import { useFriends, useAddFriend, useWithdrawFriendInvitation, useRemoveFriend } from '../src/hooks/useFriends';
import { useUserProfile } from '../src/hooks/useUsers';
import { colors, fontSize, spacing } from '../src/theme';

type MemberProfileRoute = RouteProp<FriendsStackParamList, 'MemberProfile'>;

function formatRegistrationAge(registeredAt: number, zh: boolean): string {
  const now = Date.now();
  const diffMs = now - registeredAt;
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  if (diffYears >= 1) {
    const age = zh ? `${diffYears} 年` : `${diffYears} ${diffYears === 1 ? 'year' : 'years'}`;
    return zh ? `在 Zumo 已 ${age}` : `Age on Zumo is ${age}`;
  }
  if (diffMonths >= 1) {
    const age = zh ? `${diffMonths} 个月` : `${diffMonths} ${diffMonths === 1 ? 'month' : 'months'}`;
    return zh ? `在 Zumo 已 ${age}` : `Age on Zumo is ${age}`;
  }
  if (diffDays >= 7) {
    const weeks = Math.floor(diffDays / 7);
    const age = zh ? `${weeks} 周` : `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
    return zh ? `在 Zumo 已 ${age}` : `Age on Zumo is ${age}`;
  }
  if (diffDays >= 1) {
    const age = zh ? `${diffDays} 天` : `${diffDays} ${diffDays === 1 ? 'day' : 'days'}`;
    return zh ? `在 Zumo 已 ${age}` : `Age on Zumo is ${age}`;
  }
  return zh ? '在 Zumo 为新用户' : 'Age on Zumo is new member';
}

export default function MemberProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute<MemberProfileRoute>();
  const insets = useSafeAreaInsets();
  const {
    lang,
    user: currentUser,
    nicknames,
    pendingRequestIds,
    setPendingRequestIds,
    incomingRequestIds,
    setIncomingRequestIds,
  } = useApp();
  const memberId = route.params?.memberId ?? '';
  const paramAvatarUrl = route.params?.avatarUrl;
  const paramDisplayName = route.params?.displayName;
  const { data: friendsData } = useFriends();
  const { data: profile } = useUserProfile(memberId || null);
  const addFriendMutation = useAddFriend();
  const withdrawMutation = useWithdrawFriendInvitation();
  const removeFriendMutation = useRemoveFriend();

  const friends = friendsData?.friends ?? [];
  const friend = friends.find((f) => f.userArn === memberId);
  const isFriend = !!friend;
  const isPending = pendingRequestIds.has(memberId);
  const isIncoming = incomingRequestIds.has(memberId);
  const isMe = currentUser && (currentUser.userArn === memberId || currentUser.id === memberId);

  const displayName =
    paramDisplayName ?? profile?.name ?? friend?.name ?? nicknames[memberId] ?? memberId?.split(/[:/]/).pop() ?? memberId ?? '—';
  const avatarUri = paramAvatarUrl ?? friend?.imageUrl ?? profile?.photoUrl ?? null;
  const phone = profile?.phone_number ?? friend?.phone ?? null;
  const email = profile?.email ?? friend?.email ?? null;
  const description = profile?.description ?? null;
  const registeredAt = profile?.registeredAt;
  const tripsCompletedAsDriver = profile?.tripsCompletedAsDriver ?? 0;
  const tripsCompletedAsPassenger = profile?.tripsCompletedAsPassenger ?? 0;
  const registrationAge =
    registeredAt != null ? formatRegistrationAge(registeredAt, lang === 'zh') : null;

  const handleAddFriend = () => {
    addFriendMutation.mutate(memberId, {
      onSuccess: () => {
        setPendingRequestIds((prev) => new Set(prev).add(memberId));
      },
    });
  };

  const handleWithdrawInvitation = () => {
    withdrawMutation.mutate(memberId, {
      onSuccess: () => {
        setPendingRequestIds((prev) => {
          const next = new Set(prev);
          next.delete(memberId);
          return next;
        });
      },
    });
  };

  const handleAcceptInvite = () => {
    addFriendMutation.mutate(memberId);
    setIncomingRequestIds((prev) => {
      const next = new Set(prev);
      next.delete(memberId);
      return next;
    });
  };

  const handleRejectInvite = () => {
    setIncomingRequestIds((prev) => {
      const next = new Set(prev);
      next.delete(memberId);
      return next;
    });
    navigation.goBack();
  };

  const handleRemoveFriend = () => {
    Alert.alert(
      lang === 'zh' ? '删除好友' : 'Remove friend',
      lang === 'zh' ? `确定要将 ${displayName} 从好友列表移除吗？` : `Remove ${displayName} from your friends?`,
      [
        { text: lang === 'zh' ? '取消' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'zh' ? '删除' : 'Remove',
          style: 'destructive',
          onPress: () => {
            removeFriendMutation.mutate(memberId, {
              onSuccess: () => navigation.goBack(),
            });
          },
        },
      ]
    );
  };

  if (!memberId) return null;

  if (isMe) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.p4 }]}>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
            <Icon name="arrow_back_ios_new" size={24} color={colors.slate[600]} />
          </Pressable>
          <Text style={styles.headerTitle}>{lang === 'zh' ? '个人资料' : 'Profile'}</Text>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.centered}>
          <Text style={styles.selfLabel}>{lang === 'zh' ? '这是您自己的资料' : 'This is your own profile'}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.p4 }]}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
          <Icon name="arrow_back_ios_new" size={24} color={colors.slate[600]} />
        </Pressable>
        <Text style={styles.headerTitle}>{lang === 'zh' ? '个人资料' : 'Profile'}</Text>
        {isFriend ? (
          <Pressable
            onPress={handleRemoveFriend}
            disabled={removeFriendMutation.isPending}
            style={({ pressed }) => [styles.headerDeleteBtn, pressed && styles.pressed]}
            hitSlop={8}
          >
            {removeFriendMutation.isPending ? (
              <ActivityIndicator size="small" color={colors.sage} />
            ) : (
              <Icon name="delete" size={22} color={colors.sage} />
            )}
          </Pressable>
        ) : (
          <View style={styles.backBtn} />
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.avatarWrap}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            {isFriend && (
              <View style={styles.verifiedBadge}>
                <Icon name="check" size={14} color={colors.white} />
              </View>
            )}
          </View>
          <Text style={styles.displayName}>{displayName}</Text>

          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}

          {registrationAge ? (
            <View style={styles.registeredRow}>
              <Text style={styles.registrationAgeText}>{registrationAge}</Text>
            </View>
          ) : null}

          {(phone != null && phone !== '') || (email != null && email !== '') ? (
            <View style={styles.contactLines}>
              {phone != null && phone !== '' ? (
                <Text style={styles.contactLineText}>{phone}</Text>
              ) : null}
              {email != null && email !== '' ? (
                <Text style={styles.contactLineText}>{email}</Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <Text style={styles.statsNum}>{tripsCompletedAsDriver}</Text>
              <Text style={styles.statsLabel}>{lang === 'zh' ? '次作为司机完成' : 'trips as driver'}</Text>
            </View>
            <View style={styles.statsDivider} />
            <View style={styles.statsRow}>
              <Text style={styles.statsNum}>{tripsCompletedAsPassenger}</Text>
              <Text style={styles.statsLabel}>{lang === 'zh' ? '次作为乘客完成' : 'trips as passenger'}</Text>
            </View>
          </View>
        </View>

        {!isFriend && (
          <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
            {isIncoming ? (
              <View style={styles.footerRow}>
                <Pressable onPress={handleRejectInvite} style={({ pressed }) => [styles.secondaryBtn, pressed && styles.pressed]}>
                  <Text style={styles.secondaryBtnText}>{lang === 'zh' ? '拒绝' : 'REJECT'}</Text>
                </Pressable>
                <Pressable
                  onPress={handleAcceptInvite}
                  disabled={addFriendMutation.isPending}
                  style={({ pressed }) => [styles.primaryBtn, (addFriendMutation.isPending || pressed) && styles.pressed]}
                >
                  {addFriendMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.primaryBtnText}>{lang === 'zh' ? '接受申请' : 'ACCEPT'}</Text>
                  )}
                </Pressable>
              </View>
            ) : isPending ? (
              <View style={styles.footerSingle}>
                <Pressable
                  onPress={handleWithdrawInvitation}
                  disabled={withdrawMutation.isPending}
                  style={({ pressed }) => [styles.revokeBtn, (withdrawMutation.isPending || pressed) && styles.pressed]}
                >
                  {withdrawMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.slate[500]} />
                  ) : (
                    <>
                      <Icon name="person_remove" size={20} color={colors.slate[500]} />
                      <Text style={styles.revokeBtnText}>
                        {lang === 'zh' ? '撤回好友邀请' : 'Withdraw friend invitation'}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            ) : (
              <View style={styles.footerSingle}>
                <Pressable
                  onPress={handleAddFriend}
                  disabled={addFriendMutation.isPending}
                  style={({ pressed }) => [styles.primaryBtn, (addFriendMutation.isPending || pressed) && styles.pressed]}
                >
                  {addFriendMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <>
                      <Icon name="person_add" size={20} color={colors.white} />
                      <Text style={styles.primaryBtnText}>
                        {lang === 'zh' ? '发送好友邀请' : 'Send friend invitation'}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate[50] },
  pressed: { opacity: 0.9 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.p6,
    paddingBottom: spacing.p3,
    backgroundColor: 'transparent',
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: colors.slate[900] },
  headerDeleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  selfLabel: { fontSize: fontSize.sm, color: colors.slate[500] },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.p6, paddingBottom: 24 },
  card: {
    backgroundColor: 'transparent',
    borderRadius: 24,
    padding: spacing.p6,
    marginBottom: spacing.p6,
    alignItems: 'center',
  },
  avatarWrap: { position: 'relative', marginBottom: spacing.p4 },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.slate[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.slate[200] },
  avatarText: { fontSize: 40, fontWeight: '800', color: colors.slate[600] },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.white,
  },
  displayName: { fontSize: 22, fontWeight: '800', color: colors.slate[900], marginBottom: spacing.p4, textAlign: 'center' },
  description: {
    fontSize: fontSize.sm,
    color: colors.slate[600],
    textAlign: 'center',
    marginTop: spacing.gap2,
    paddingHorizontal: spacing.p4,
  },
  registeredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.p3,
    paddingHorizontal: spacing.p4,
    backgroundColor: 'transparent',
    marginTop: spacing.gap2,
    alignSelf: 'stretch',
  },
  registrationAgeText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.slate[500] },
  contactLines: { alignItems: 'center', marginTop: spacing.gap2 },
  contactLineText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.slate[600], marginBottom: 4, textAlign: 'center' },
  statsCard: {
    alignSelf: 'stretch',
    marginTop: spacing.p6,
    backgroundColor: 'transparent',
    borderRadius: 32,
    padding: spacing.p6,
  },
  statsRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.gap4 },
  statsNum: { fontSize: fontSize['3xl'], fontWeight: '800', color: colors.sage, marginRight: spacing.gap2 },
  statsLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.slate[500], textTransform: 'uppercase', letterSpacing: 2 },
  statsDivider: { width: 32, borderTopWidth: 2, borderTopColor: colors.sage + '33', marginVertical: spacing.gap2 },
  footer: {
    paddingHorizontal: spacing.p6,
    paddingTop: spacing.p6,
    marginTop: spacing.p4,
    backgroundColor: 'transparent',
  },
  footerRow: { flexDirection: 'row', gap: spacing.p4 },
  footerSingle: { width: '100%', alignSelf: 'stretch' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.sage,
    paddingVertical: 16,
    borderRadius: 28,
    width: '100%',
  },
  primaryBtnText: { fontSize: fontSize.sm, fontWeight: '800', color: colors.white },
  secondaryBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.slate[300],
    paddingVertical: 16,
    borderRadius: 28,
  },
  secondaryBtnText: { fontSize: fontSize.sm, fontWeight: '800', color: colors.slate[500] },
  revokeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.slate[300],
    paddingVertical: 16,
    borderRadius: 28,
    width: '100%',
  },
  revokeBtnText: { fontSize: fontSize.base, fontWeight: '800', color: colors.slate[600] },
});
