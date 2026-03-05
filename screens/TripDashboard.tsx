import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TripsStackParamList } from '../navigation/types';
import Icon from '../src/components/Icon';
import Loading from '../src/components/Loading';
import { useApp } from '../context/AppState';
import { useUncompletedTrips, useCompletedTrips, useLeaveTrip } from '../src/hooks/useTrips';
import type { Trip } from '../src/types';
import { TripStatus } from '../src/types';
import { colors, fontSize, spacing, borderRadius } from '../src/theme';

const SWIPE_REVEAL = 80;
const RED_FILL = 30;
const RED_TOTAL = SWIPE_REVEAL + RED_FILL;
const SNAP = { damping: 24, stiffness: 260 };

function SwipeableCard({
  tripId,
  openId,
  setOpenId,
  onPress,
  children,
}: {
  tripId: string;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  onPress: () => void;
  children: React.ReactNode;
}) {
  const x = useSharedValue(openId === tripId ? -SWIPE_REVEAL : 0);
  const startX = useSharedValue(0);

  useEffect(() => {
    x.value = withSpring(openId === tripId ? -SWIPE_REVEAL : 0, SNAP);
  }, [openId, tripId]);

  const pan = Gesture.Pan()
    .activeOffsetX(-8)
    .failOffsetY([-12, 12])
    .onStart(() => { startX.value = x.value; })
    .onUpdate((e) => {
      const v = startX.value + e.translationX;
      x.value = v >= 0 ? 0 : v <= -SWIPE_REVEAL ? -SWIPE_REVEAL : v;
    })
    .onEnd((e) => {
      const open = x.value <= -40;
      runOnJS(setOpenId)(open ? tripId : null);
      x.value = withSpring(open ? -SWIPE_REVEAL : 0, { ...SNAP, velocity: e.velocityX });
    });

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, style]}>
        <Pressable onPress={onPress} style={styles.cardInner}>
          {children}
        </Pressable>
      </Animated.View>
    </GestureDetector>
  );
}

type TripDashboardNav = NativeStackNavigationProp<TripsStackParamList, 'TripDashboard'>;

const formatTripDateOnly = (dateStr: string, lang: string) => {
  const date = new Date(dateStr);
  const dayName = date.toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-CN', { weekday: 'short' });
  const monthName = date.toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-CN', { month: 'short' });
  const day = date.getDate();
  if (lang === 'zh') return `${monthName}${day}日 (${dayName})`;
  return `${dayName}, ${monthName} ${day}`;
};

const formatCollapseTime = (dateStr: string, timeRange: string) => {
  const date = new Date(dateStr);
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  const startTime = timeRange.split(' - ')[0];
  return `${y}/${m}/${d}, ${startTime}`;
};

export default function TripDashboard() {
  const navigation = useNavigation<TripDashboardNav>();
  const insets = useSafeAreaInsets();
  const { t, lang, user, dashboardShowHistory, setDashboardShowHistory, setSelectedTripId, setBriefTrip, setInvitationDetails } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: uncompletedTripsData, isLoading: isLoadingUncompleted, isError: isErrorUncompleted, error: errorUncompleted, refetch: refetchUncompleted } = useUncompletedTrips();
  const { data: completedTripsData, isLoading: isLoadingCompleted, isError: isErrorCompleted, error: errorCompleted, refetch: refetchCompleted } = useCompletedTrips();
  const leaveTripMutation = useLeaveTrip();

  useEffect(() => {
    console.log('[TripDashboard] trip query state', {
      isLoadingUncompleted,
      isLoadingCompleted,
      isErrorUncompleted,
      isErrorCompleted,
      uncompletedCount: uncompletedTripsData?.length ?? 0,
      completedCount: completedTripsData?.length ?? 0,
      errorUncompleted: errorUncompleted instanceof Error ? errorUncompleted.message : errorUncompleted,
      errorCompleted: errorCompleted instanceof Error ? errorCompleted.message : errorCompleted,
    });
  }, [isLoadingUncompleted, isLoadingCompleted, isErrorUncompleted, isErrorCompleted, uncompletedTripsData?.length, completedTripsData?.length, errorUncompleted, errorCompleted]);

  const inProgressTrips = (uncompletedTripsData ?? []).filter((tr: Trip) => tr.status === TripStatus.IN_PROGRESS);
  const upcomingTrips = (uncompletedTripsData ?? []).filter(
    (tr: Trip) => tr.status === TripStatus.CONFIRMED || tr.status === TripStatus.MATCHING
  );
  const invitationTrips = (uncompletedTripsData ?? []).filter((tr: Trip) => tr.status === TripStatus.PENDING);
  const pastTrips = (completedTripsData ?? []).filter((tr: Trip) => tr.status === TripStatus.COMPLETED);

  const handleDeleteTrip = async (id: string) => {
    try {
      setOpenId(null);
      await leaveTripMutation.mutateAsync(id);
    } catch {
      Alert.alert(lang === 'zh' ? '操作失败' : 'Operation failed');
    }
  };

  const renderTripCard = (
    trip: Trip,
    options: { forceExpand?: boolean; isInProgress?: boolean; isInvitation?: boolean } = {}
  ) => {
    const { forceExpand = false, isInProgress = false, isInvitation = false } = options;
    const isDriver = trip.isDriver;
    const passengers = trip.participants.filter((p) => !p.isDriver);
    const confirmedCount = passengers.filter((p) => p.confirmed).length;
    const driverInfo = trip.participants.find((p) => p.isDriver);
    const driverConfirmed = driverInfo?.confirmed;
    const effectivelyCollapsed = isCollapsed && !forceExpand;
    const allConfirmed = confirmedCount === trip.maxCapacity;
    const isGreen = isDriver ? allConfirmed : driverConfirmed;
    let statusText: string | null = isDriver ? null : driverConfirmed ? t.driverConfirmed : t.driverNotConfirmed;
    let labelStyle = isGreen ? styles.labelGreen : styles.labelAmber;
    let labelTextStyle = isGreen ? styles.labelTextGreen : styles.labelTextAmber;
    if (isInvitation) {
      labelStyle = styles.labelInvitation;
      labelTextStyle = styles.labelTextInvitation;
      statusText = t.tripInvitation;
    }
    const timeLeft = isInProgress ? 'IN PROGRESS' : 'UPCOMING';
    const bgImg = `https://picsum.photos/seed/${trip.id}/800/500`;
    const tripIdShort = trip.id.split(':').pop()?.substring(0, 8) ?? '';

    const onPress = () => {
      if (openId === trip.id) {
        setOpenId(null);
        return;
      }
      if (isInvitation) {
        const inviter = trip.participants.find((p) => p.confirmed)?.user.name ?? 'Someone';
        setBriefTrip(trip);
        setInvitationDetails({ type: 'passenger', inviterName: inviter });
        navigation.navigate('TripInvitation');
      } else {
        setSelectedTripId(trip.id);
        navigation.navigate('TripDetail', { tripId: trip.id, title: 'Trip Detail' });
      }
    };

    return (
      <View key={trip.id} style={styles.cardWrap}>
        <View style={styles.actionLayer}>
          <View style={styles.actionSpacer} />
          <View style={styles.actionRed}>
            <View style={styles.actionRedFill} />
            <View style={styles.actionRedContent}>
              <Pressable
                onPress={() => handleDeleteTrip(trip.id)}
                disabled={leaveTripMutation.isPending}
                style={[styles.deleteBtn, leaveTripMutation.isPending && styles.deleteBtnDisabled]}
              >
                <Icon name={leaveTripMutation.isPending ? 'hourglass_empty' : 'delete'} size={20} color={colors.white} />
                <Text style={styles.deleteBtnLabel}>
                  {leaveTripMutation.isPending ? (lang === 'zh' ? '正在处理' : 'Processing') : (lang === 'zh' ? '删除' : 'Delete')}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
        <SwipeableCard tripId={trip.id} openId={openId} setOpenId={setOpenId} onPress={onPress}>
          <Image source={{ uri: bgImg }} style={styles.cardBg} />
          <View style={styles.cardOverlay}>
            {!effectivelyCollapsed && (
              <View style={styles.cardTopRow}>
                <View style={[styles.badge, isInvitation ? styles.badgeInvitation : styles.badgeDriver]}>
                  <Text style={styles.badgeText}>{isInvitation ? 'NEW' : isDriver ? t.driver : t.passenger}</Text>
                </View>
                {!isInProgress && (
                  <View style={styles.timeLeftBadge}>
                    <Text style={styles.timeLeftText}>{timeLeft}</Text>
                  </View>
                )}
              </View>
            )}
            <View style={[styles.cardBottom, effectivelyCollapsed && styles.cardBottomCollapsed]}>
              <View style={styles.cardBottomRow}>
                <Text style={styles.cardMeta}>
                  {effectivelyCollapsed
                    ? formatCollapseTime(trip.date, trip.timeRange)
                    : `${tripIdShort} • ${formatTripDateOnly(trip.date, lang)}`}
                </Text>
                {!isInProgress && statusText && (
                  <View style={[styles.statusBadge, labelStyle]}>
                    <Text style={[styles.statusBadgeText, labelTextStyle]}>{statusText}</Text>
                  </View>
                )}
              </View>
              <View style={styles.originDestRow}>
                <Text style={styles.originDestText}>{trip.origin}</Text>
                <Icon name="arrow_forward" size={12} color={colors.slate[400]} />
                <Text style={[styles.originDestText, styles.destText]} numberOfLines={1}>{trip.destination}</Text>
              </View>
              {!effectivelyCollapsed && (
                <Text style={styles.departText}>
                  {lang === 'zh'
                    ? `${trip.origin} ${trip.timeRange.split(' - ')[0]} 出发`
                    : `Departs ${trip.origin} at ${trip.timeRange.split(' - ')[0]}`}
                </Text>
              )}
            </View>
          </View>
        </SwipeableCard>
      </View>
    );
  };

  const renderHistoryItem = (trip: Trip) => {
    const date = new Date(trip.date);
    const displayDate = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    const startTime = trip.timeRange.split(' - ')[0];
    const isCompleted = trip.status === TripStatus.COMPLETED;
    return (
      <Pressable key={trip.id} onPress={() => { setSelectedTripId(trip.id); navigation.navigate('TripDetail', { tripId: trip.id, title: 'Trip Detail' }); }} style={({ pressed }) => [styles.historyRow, pressed && styles.historyRowPressed]}>
        <View style={styles.historyLeft}>
          <Text style={styles.historyDate}>{displayDate} {startTime}</Text>
          <View style={styles.historyRoute}>
            <Text style={styles.historyRouteText}>{trip.origin}</Text>
            <Icon name="arrow_forward" size={12} color={colors.slate[400]} />
            <Text style={styles.historyRouteText}>{trip.destination}</Text>
          </View>
        </View>
        <View style={[styles.historyStatus, isCompleted ? styles.historyStatusDone : styles.historyStatusUnsettled]}>
          <Text style={[styles.historyStatusText, isCompleted ? styles.historyStatusTextDone : styles.historyStatusTextUnsettled]}>
            {isCompleted ? t.completed : t.unsettled}
          </Text>
        </View>
      </Pressable>
    );
  };

  if (isLoadingUncompleted || isLoadingCompleted) {
    return (
      <View style={styles.loadingWrap}>
        <Loading message={t.loading ?? 'Loading Trips...'} />
      </View>
    );
  }

  const isError = isErrorUncompleted || isErrorCompleted;
  if (isError) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.errorText}>{lang === 'zh' ? '加载行程失败，请重试' : 'Failed to load trips'}</Text>
        <Pressable onPress={() => { refetchUncompleted(); refetchCompleted(); }} style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}>
          <Text style={styles.retryBtnText}>{lang === 'zh' ? '重试' : 'Retry'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.p4 }]}>
        <Pressable onPress={() => setDashboardShowHistory(!dashboardShowHistory)} style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
          <Icon name={dashboardShowHistory ? 'event' : 'history'} size={20} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>{dashboardShowHistory ? t.pastTrips : t.myTrips}</Text>
        <Pressable onPress={() => navigation.navigate('TripSearch')} style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
          <Icon name="search" size={20} color={colors.white} />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {dashboardShowHistory ? (
          <>
            {pastTrips.map(renderHistoryItem)}
            {pastTrips.length === 0 && (
              <Text style={styles.emptyText}>No past trips</Text>
            )}
            <Text style={styles.endOfHistory}>End of History</Text>
          </>
        ) : (
          <View style={styles.mainContent}>
            {inProgressTrips.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t.inProgress}</Text>
                {inProgressTrips.map((tr) => renderTripCard(tr, { forceExpand: true, isInProgress: true }))}
              </View>
            )}
            {invitationTrips.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, styles.sectionTitleInvitation]}>
                  {t.invitedTrips} ({invitationTrips.length})
                </Text>
                {invitationTrips.map((tr) => renderTripCard(tr, { isInvitation: true }))}
              </View>
            )}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t.upcoming} ({upcomingTrips.length})</Text>
                <Pressable onPress={() => setIsCollapsed(!isCollapsed)} style={styles.collapseBtn}>
                  <Icon name={isCollapsed ? 'expand_more' : 'expand_less'} size={14} color={colors.slate[400]} />
                  <Text style={styles.collapseBtnText}>{isCollapsed ? t.expandView : t.collapseView}</Text>
                </Pressable>
              </View>
              <View style={styles.cardList}>
                {upcomingTrips.map((tr) => renderTripCard(tr))}
                {upcomingTrips.length === 0 && inProgressTrips.length === 0 && invitationTrips.length === 0 && (
                  <View style={styles.emptyState}>
                    <Icon name="directions_car" size={60} color={colors.slate[300]} />
                    <Text style={styles.emptyStateText}>No Active Trips</Text>
                  </View>
                )}
              </View>
            </View>
            <Pressable onPress={() => navigation.navigate('TripSearch')} style={({ pressed }) => [styles.joinTripBtn, pressed && styles.pressed]}>
              <Text style={styles.joinTripBtnText}>{t.joinTrip}</Text>
            </Pressable>
            <View style={{ height: 40 }} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingBottom: 40 },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white },
  errorText: { fontSize: fontSize.sm, color: colors.slate[600], marginBottom: spacing.p4, textAlign: 'center' },
  retryBtn: { paddingHorizontal: spacing.p5, paddingVertical: spacing.py3, backgroundColor: colors.sage, borderRadius: borderRadius.ios },
  retryBtnText: { color: colors.white, fontWeight: '700', fontSize: fontSize.sm },
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
  headerTitle: { fontSize: fontSize.base, fontWeight: '800', letterSpacing: -0.5, textTransform: 'uppercase', color: colors.white },
  pressed: { opacity: 0.9 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: spacing.gap4 },
  mainContent: { paddingHorizontal: spacing.p5 },
  section: { marginBottom: spacing.p6 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.gap3, paddingHorizontal: 4 },
  sectionTitle: {
    fontSize: fontSize['11'],
    fontWeight: '800',
    color: colors.slate[800],
    textTransform: 'uppercase',
    letterSpacing: 2,
    paddingHorizontal: 4,
    marginBottom: spacing.gap3,
  },
  sectionTitleInvitation: { color: colors.morandiMustard },
  cardList: { gap: spacing.gap4 },
  collapseBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  collapseBtnText: { fontSize: fontSize['9'], fontWeight: '700', color: colors.slate[400], textTransform: 'uppercase' },
  cardWrap: {
    marginBottom: spacing.gap4,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  actionLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'stretch',
    zIndex: 5,
  },
  actionSpacer: { flex: 1 },
  actionRed: {
    width: RED_TOTAL,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.rose[500],
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
  },
  actionRedFill: { width: RED_FILL, backgroundColor: colors.rose[500] },
  actionRedContent: {
    width: SWIPE_REVEAL,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.gap1,
  },
  deleteBtn: { alignItems: 'center', gap: 4 },
  deleteBtnDisabled: { opacity: 0.5 },
  deleteBtnLabel: { fontSize: fontSize['9'], fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.white },
  card: {
    position: 'relative',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    backgroundColor: colors.black,
    zIndex: 10,
  },
  cardInner: { alignSelf: 'stretch' },
  cardBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%', opacity: 0.7 },
  cardOverlay: { position: 'relative', zIndex: 1 },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.gap3,
    height: 144,
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeDriver: {},
  badgeInvitation: { backgroundColor: 'rgba(181,166,66,0.8)' },
  badgeText: { fontSize: 7, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', color: colors.white },
  timeLeftBadge: { backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 12, paddingVertical: 2, borderRadius: 999 },
  timeLeftText: { fontSize: 8, fontWeight: '800', letterSpacing: 2, color: '#1A1C1E' },
  cardBottom: {
    padding: spacing.p4,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cardBottomCollapsed: { marginTop: spacing.gap4 },
  cardBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardMeta: { fontSize: fontSize['11'], fontWeight: '500', color: colors.slate[300] },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, borderWidth: 1 },
  statusBadgeText: { fontSize: 8, fontWeight: '800' },
  labelGreen: { borderColor: colors.sage + '66', backgroundColor: colors.sage + '1A' },
  labelAmber: { borderColor: colors.amber[500] + '66', backgroundColor: colors.amber[500] + '1A' },
  labelInvitation: { borderColor: colors.morandiMustard + '66', backgroundColor: colors.morandiMustard + '0D' },
  labelTextGreen: { color: colors.sage },
  labelTextAmber: { color: colors.amber[500] },
  labelTextInvitation: { color: colors.morandiMustard },
  originDestRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  originDestText: { fontSize: fontSize.sm, fontWeight: '800', color: colors.white },
  destText: { flex: 1 },
  departText: { fontSize: fontSize['10'], color: colors.slate[400], fontWeight: '500', marginTop: 4 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.p5,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[50],
  },
  historyRowPressed: { backgroundColor: colors.slate[50] },
  historyLeft: {},
  historyDate: { fontSize: fontSize.xs, fontWeight: '700', color: colors.slate[900], marginBottom: 4 },
  historyRoute: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  historyRouteText: { fontSize: fontSize.xs, fontWeight: '500', color: colors.slate[400] },
  historyStatus: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  historyStatusDone: { borderColor: colors.sage + '4D', backgroundColor: colors.sage + '0D' },
  historyStatusUnsettled: { borderColor: colors.rose[500] + '4D', backgroundColor: colors.rose[50] },
  historyStatusText: { fontSize: fontSize['9'], fontWeight: '800', textTransform: 'uppercase' },
  historyStatusTextDone: { color: colors.sage },
  historyStatusTextUnsettled: { color: colors.rose[500] },
  emptyText: { paddingVertical: 80, textAlign: 'center', color: colors.slate[300], fontWeight: '800', fontSize: fontSize['10'], letterSpacing: 2 },
  endOfHistory: { padding: spacing.p8, textAlign: 'center', fontSize: fontSize['10'], color: colors.slate[300], fontWeight: '700', letterSpacing: 2 },
  emptyState: { paddingVertical: 80, alignItems: 'center', opacity: 0.3 },
  emptyStateText: { fontWeight: '800', fontSize: fontSize['10'], textTransform: 'uppercase', letterSpacing: 2, marginTop: 16 },
  joinTripBtn: {
    width: '100%',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.sage,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  joinTripBtnText: { color: colors.sage, fontWeight: '800', fontSize: fontSize.sm, textTransform: 'uppercase', letterSpacing: 2 },
});
