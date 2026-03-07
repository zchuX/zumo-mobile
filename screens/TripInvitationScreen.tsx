import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from '../src/components/Icon';
import { useApp } from '../context/AppState';
import { useTrip, useUserGroup, useAcceptInvitation, useLeaveTrip } from '../src/hooks/useTrips';
import { TripStatus } from '../src/types';
import type { Trip } from '../src/types';
import { colors, fontSize, spacing } from '../src/theme';

function countdownText(trip: Trip, lang: string): string {
  if (trip.status === TripStatus.COMPLETED) return lang === 'zh' ? '已完成' : 'Completed';
  if (trip.status === TripStatus.IN_PROGRESS) return '';
  const now = Date.now();
  const diff = trip.startTime - now;
  if (diff < 0) return lang === 'zh' ? '计划出发时间已过' : 'Planned start time passed';
  const days = Math.floor(diff / (24 * 3600000));
  const hours = Math.floor((diff % (24 * 3600000)) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (days >= 30) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    return lang === 'zh' ? `将在 ${months} 个月 ${remainingDays} 天后出发` : `Departing in ${months}mo ${remainingDays}d`;
  }
  if (days >= 1) return lang === 'zh' ? `将在 ${days} 天后出发` : `Departing in ${days} days`;
  if (hours > 0) return lang === 'zh' ? `${hours}小时后出发` : `Departing in ${hours}h ${mins}m`;
  return lang === 'zh' ? `${mins}分钟后出发` : `Departing in ${mins}m`;
}

const DEFAULT_AVATAR = 'https://picsum.photos/seed/user/200';
const LOG = '[TripInvitationScreen]';

export default function TripInvitationScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    lang,
    t,
    user,
    friendIds,
    nicknames,
    selectedTripId,
    setSelectedTripId,
    setSelectedGroupArn,
    setInvitationDetails,
    setSelectedMemberId,
    setMemberProfileSource,
    briefTrip,
  } = useApp();

  const { data: tripFromApi, isLoading: tripLoading } = useTrip(selectedTripId);
  const trip = tripFromApi ?? (briefTrip?.id === selectedTripId ? briefTrip : null);
  const groupArn = trip?.userGroupArn ?? (briefTrip?.id === selectedTripId ? briefTrip?.userGroupArn ?? null : null);
  const { data: group, isLoading: groupLoading, isError: groupError, error: groupErrorDetail } = useUserGroup(groupArn);
  const acceptMutation = useAcceptInvitation();
  const leaveMutation = useLeaveTrip();

  if (__DEV__) {
    console.log(LOG, 'trip state', {
      selectedTripId,
      tripFromApi: tripFromApi ? { id: tripFromApi.id, userGroupArn: tripFromApi.userGroupArn } : null,
      briefTrip: briefTrip ? { id: briefTrip.id, userGroupArn: briefTrip.userGroupArn } : null,
      tripSource: tripFromApi ? 'api' : briefTrip?.id === selectedTripId ? 'briefTrip' : 'none',
      trip: trip ? { id: trip.id, userGroupArn: trip.userGroupArn } : null,
      groupArn,
      groupLoading,
      group: group ? { groupArn: group.groupArn, groupName: group.groupName, usersCount: group.users?.length } : null,
      groupError,
      groupErrorDetail: groupErrorDetail?.message ?? groupErrorDetail,
    });
  }

  const currentUserId = user?.userArn ?? user?.id ?? null;

  const handleBack = () => {
    setInvitationDetails(null);
    navigation.navigate('TripDashboard');
  };

  const handleAccept = async () => {
    if (!groupArn) return;
    try {
      await acceptMutation.mutateAsync(groupArn);
      setInvitationDetails(null);
      setSelectedGroupArn(groupArn);
      if (trip?.id) setSelectedTripId(trip.id);
      navigation.navigate('TripDetail', { tripId: trip!.id, title: t.tripDetail ?? 'Trip Detail' });
    } catch {
      // Error handled by mutation
    }
  };

  const handleReject = async () => {
    if (!selectedTripId) return;
    try {
      await leaveMutation.mutateAsync(selectedTripId);
      setInvitationDetails(null);
      handleBack();
    } catch {
      // Error handled by mutation
    }
  };

  const handleMemberClick = (memberId: string) => {
    setSelectedMemberId(memberId);
    setMemberProfileSource('trip_invitation');
    (navigation.getParent() as any)?.navigate('Friends', {
      screen: 'MemberProfile',
      params: {
        memberId,
        source: 'trip_invitation',
        avatarUrl: groupMembers.find((m) => m.id === memberId)?.avatar,
        displayName: nicknames[memberId] || groupMembers.find((m) => m.id === memberId)?.name,
      },
    });
  };

  const isLoading = tripLoading || groupLoading;
  if (isLoading || !trip) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.sage} />
        <Text style={styles.loadingText}>
          {lang === 'zh' ? '加载邀请详情...' : 'Loading invitation...'}
        </Text>
      </View>
    );
  }

  if (!groupArn || (!groupLoading && !group)) {
    if (__DEV__) {
      console.warn(LOG, 'showing unable to load group', {
        reason: !groupArn ? 'no groupArn' : 'groupArn set but group null/undefined after load',
        groupArn: groupArn ?? undefined,
        groupLoading,
        groupError: groupError ?? false,
        groupErrorDetail: groupErrorDetail?.message ?? groupErrorDetail,
      });
    }
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Icon name="error_outline" size={48} color={colors.slate[400]} />
        <Text style={styles.loadingText}>
          {lang === 'zh' ? '无法加载小组信息' : 'Unable to load group'}
        </Text>
        <Pressable onPress={handleBack} style={styles.backBtnFull}>
          <Text style={styles.backBtnFullText}>{lang === 'zh' ? '返回' : 'Back'}</Text>
        </Pressable>
      </View>
    );
  }

  const driver = trip.participants.find((p) => p.isDriver);
  const isDriverFriend = driver ? friendIds.has(driver.user?.id ?? driver.user?.userArn ?? '') : false;
  const groupMembers = (group?.users ?? []).map((u) => ({
    id: u.userId,
    name: u.name,
    avatar: u.imageUrl || DEFAULT_AVATAR,
    status: u.accept ? 'accepted' : 'pending',
  }));
  const isAccepting = acceptMutation.isPending;
  const isRejecting = leaveMutation.isPending;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.p4 }]}>
        <Pressable onPress={handleBack} style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
          <Icon name="arrow_back_ios_new" size={20} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {lang === 'zh' ? '行程邀请' : 'Trip Invitation'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Trip ID at top - same layout as Trip Detail */}
        <View style={styles.tripIdWrap}>
          <View style={styles.tripIdBadge}>
            <Text style={styles.tripIdBadgeText} numberOfLines={1}>
              {lang === 'zh' ? `行程ID  ${trip.id}` : `TRIP ID  ${trip.id}`}
            </Text>
          </View>
        </View>
        <Text style={styles.dateTitle}>
          {trip.date === 'TBD' ? 'TBD' : new Date(trip.date).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}{' '}
          {trip.timeRange.split(' - ')[0]}
        </Text>
        {countdownText(trip, lang) ? <Text style={styles.countdownText}>{countdownText(trip, lang)}</Text> : null}

        {/* ROUTE - same format as Trip Detail (2 locations: origin → destination) */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>{lang === 'zh' ? '路线' : 'ROUTE'}</Text>
          </View>
          <View style={styles.timeline}>
            {trip.locations.length >= 2 ? (
              trip.locations.slice(0, 2).map((loc, idx) => {
                const isLast = idx === 1;
                return (
                  <View key={idx} style={styles.timelineRow}>
                    <Icon
                      name={isLast ? 'location_on' : 'radio_button_unchecked'}
                      size={24}
                      color={idx === 0 ? colors.sage : colors.slate[300]}
                    />
                    <View style={styles.timelineContent}>
                      <Text style={[styles.timelineName, idx === 0 && styles.timelineNameFirst]}>{loc.locationName}</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <>
                <View style={styles.timelineRow}>
                  <Icon name="location_on" size={24} color={colors.sage} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineNameFirst}>{trip.origin}</Text>
                  </View>
                </View>
                <View style={styles.timelineRow}>
                  <Icon name="location_on" size={24} color={colors.slate[300]} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineName}>{trip.destination}</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Driver - same layout as Trip Detail (no section label, no invite button) */}
        <View style={styles.section}>
          <Pressable
            onPress={() => driver && handleMemberClick(driver.user?.id ?? driver.user?.userArn ?? '')}
            style={styles.driverCard}
          >
            {driver ? (
              <>
                <Image source={{ uri: driver.user.avatar }} style={styles.avatar} />
                <View style={styles.driverInfo}>
                  <View style={styles.driverRow}>
                    <Text style={styles.driverName}>{driver.user.name}</Text>
                    {isDriverFriend && (
                      <View style={styles.friendBadge}>
                        <Text style={styles.friendBadgeText}>{lang === 'zh' ? '我的好友' : 'FRIEND'}</Text>
                      </View>
                    )}
                    <View style={styles.acceptedBadge}>
                      <Text style={styles.acceptedBadgeText}>{lang === 'zh' ? '已接受' : 'ACCEPTED'}</Text>
                    </View>
                  </View>
                  <Text style={styles.driverRole}>{t.driver}</Text>
                  {trip.vehicle && (
                    <Text style={styles.vehicleInfo}>
                      {trip.vehicle.color} {trip.vehicle.brand} {trip.vehicle.model} | {trip.vehicle.licensePlate}
                    </Text>
                  )}
                </View>
              </>
            ) : (
              <View style={styles.driverPlaceholder}>
                <Text style={styles.placeholderText}>{lang === 'zh' ? '司机招募中' : 'Looking for Driver'}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Group name - between Driver and Members */}
        <View style={styles.groupNameWrap}>
          <Text style={styles.groupNameText} numberOfLines={1}>{group?.groupName ?? ''}</Text>
        </View>

        {/* Members */}
        <View style={styles.section}>
          <View style={styles.membersSectionHeader}>
            <Text style={styles.sectionLabel}>
              {lang === 'zh' ? `成员名单 (${groupMembers.length})` : `MEMBERS (${groupMembers.length})`}
            </Text>
          </View>
          {groupMembers.map((m) => {
            const isFriend = friendIds.has(m.id);
            const nickname = nicknames[m.id];
            const isSelf = m.id === currentUserId;
            const isPending = m.status === 'pending';
            const showAcceptReject = isSelf && isPending;

            return (
              <View key={m.id} style={[styles.memberRow, isPending && styles.memberRowPending]}>
                <Pressable
                  onPress={() => !showAcceptReject && handleMemberClick(m.id)}
                  style={styles.memberLeft}
                >
                  <Image source={{ uri: m.avatar }} style={styles.avatar} />
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>
                        {nickname || m.name}
                        {nickname ? ` (${m.name})` : ''}
                      </Text>
                      {isFriend && (
                        <View style={styles.friendBadge}>
                          <Text style={styles.friendBadgeText}>{lang === 'zh' ? '好友' : 'Friend'}</Text>
                        </View>
                      )}
                    </View>
                    {!showAcceptReject && (
                      <Text style={[styles.memberStatus, m.status === 'accepted' ? styles.statusAccepted : styles.statusPending]}>
                        {m.status === 'accepted'
                          ? (lang === 'zh' ? '已接受' : 'ACCEPTED')
                          : (lang === 'zh' ? '待确认' : 'PENDING')}
                      </Text>
                    )}
                    {showAcceptReject && (
                      <View style={styles.acceptRejectLine}>
                        <Pressable
                          onPress={handleAccept}
                          disabled={isAccepting || isRejecting}
                          style={({ pressed }) => [styles.acceptBtn, pressed && styles.pressed, (isAccepting || isRejecting) && styles.btnDisabled]}
                        >
                          <Icon name="check" size={18} color={colors.white} />
                          <Text style={styles.acceptBtnText}>{t.acceptInvitation}</Text>
                        </Pressable>
                        <Pressable
                          onPress={handleReject}
                          disabled={isAccepting || isRejecting}
                          style={({ pressed }) => [styles.rejectBtn, pressed && styles.pressed, (isAccepting || isRejecting) && styles.btnDisabled]}
                        >
                          <Icon name="close" size={18} color={colors.slate[600]} />
                          <Text style={styles.rejectBtnText}>{lang === 'zh' ? '拒绝' : 'Reject'}</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </Pressable>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.p6,
  },
  loadingText: { marginTop: 12, fontSize: fontSize.sm, fontWeight: '600', color: colors.slate[500] },
  backBtnFull: {
    marginTop: spacing.p6,
    paddingVertical: spacing.py3,
    paddingHorizontal: spacing.p6,
    backgroundColor: colors.sage,
    borderRadius: 12,
  },
  backBtnFullText: { fontSize: fontSize.sm, fontWeight: '800', color: colors.white },
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
    flex: 1,
    marginHorizontal: spacing.gap2,
    textAlign: 'center',
  },
  headerSpacer: { width: 32, height: 32 },
  pressed: { opacity: 0.9 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.p6, paddingBottom: spacing.p8 },
  groupNameWrap: {
    paddingTop: spacing.p4,
    paddingBottom: spacing.p4,
    marginBottom: spacing.gap3,
  },
  groupNameText: {
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    color: colors.slate[900],
  },
  tripIdWrap: { alignItems: 'center', marginTop: spacing.p4, marginBottom: spacing.gap3 },
  tripIdBadge: {
    alignSelf: 'center',
    paddingHorizontal: spacing.p4,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.sage + '15',
    borderWidth: 1,
    borderColor: colors.sage + '25',
    marginBottom: spacing.p6,
    maxWidth: '100%',
  },
  tripIdBadgeText: { fontSize: fontSize.xs, fontWeight: '800', color: colors.sage, letterSpacing: 2 },
  dateTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    color: colors.slate[900],
    textAlign: 'center',
    marginBottom: 4,
  },
  countdownText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.sage, textAlign: 'center', marginBottom: spacing.p6 },
  section: { marginBottom: spacing.p6 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.gap3 },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    color: colors.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginLeft: 4,
  },
  membersSectionHeader: { marginBottom: spacing.gap4 },
  timeline: { marginLeft: 4 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.p6 },
  timelineContent: { flex: 1, marginLeft: spacing.gap3 },
  timelineName: { fontSize: fontSize.base, fontWeight: '800', color: colors.slate[500] },
  timelineNameFirst: { fontSize: fontSize.xl, fontWeight: '800', color: colors.slate[900] },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.p5,
    backgroundColor: colors.slate[50],
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.slate[100],
  },
  driverPlaceholder: { flex: 1, paddingVertical: spacing.p4, alignItems: 'center' },
  placeholderText: { fontSize: fontSize.base, fontWeight: '700', color: colors.slate[400] },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: spacing.gap3, backgroundColor: colors.slate[200] },
  driverInfo: { flex: 1 },
  driverRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  driverName: { fontSize: fontSize.lg, fontWeight: '800', color: colors.slate[800] },
  driverRole: { fontSize: fontSize['11'], fontWeight: '800', color: colors.slate[400], textTransform: 'uppercase', marginTop: 2 },
  vehicleInfo: { fontSize: fontSize.base, fontWeight: '700', color: colors.slate[800], marginTop: 4 },
  friendBadge: { backgroundColor: colors.sage + '1A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  friendBadgeText: { fontSize: fontSize['10'], fontWeight: '800', color: colors.sage },
  acceptedBadge: { backgroundColor: colors.sage, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  acceptedBadgeText: { fontSize: fontSize.xs, fontWeight: '800', color: colors.white },
  sectionTitle: {
    fontSize: fontSize['11'],
    fontWeight: '800',
    color: colors.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.p4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.p4,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.slate[100],
    marginBottom: 8,
  },
  memberRowPending: { backgroundColor: colors.amber[50], borderColor: colors.amber[200] },
  memberLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  memberInfo: { marginLeft: spacing.p4, flex: 1 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberName: { fontSize: fontSize.base, fontWeight: '700', color: colors.slate[800] },
  friendBadge: { backgroundColor: colors.sageLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  friendBadgeText: { fontSize: fontSize['10'], fontWeight: '800', color: colors.sage },
  memberStatus: { fontSize: fontSize['10'], fontWeight: '800', textTransform: 'uppercase', marginTop: 2 },
  statusAccepted: { color: colors.sage },
  statusPending: { color: colors.amber[500] },
  acceptRejectLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: spacing.gap3 },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.sage,
    paddingVertical: 10,
    paddingHorizontal: spacing.p4,
    borderRadius: 12,
  },
  acceptBtnText: { fontSize: fontSize.sm, fontWeight: '800', color: colors.white, textTransform: 'uppercase' },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.slate[200],
    paddingVertical: 10,
    paddingHorizontal: spacing.p4,
    borderRadius: 12,
  },
  rejectBtnText: { fontSize: fontSize.sm, fontWeight: '800', color: colors.slate[600], textTransform: 'uppercase' },
  btnDisabled: { opacity: 0.6 },
});
