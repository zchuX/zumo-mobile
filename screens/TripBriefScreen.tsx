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
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { TripsStackParamList } from '../navigation/types';
import Icon from '../src/components/Icon';
import { useApp } from '../context/AppState';
import { useBecomeDriver } from '../src/hooks/useTrips';
import { colors, fontSize, spacing, borderRadius } from '../src/theme';

type TripBriefRoute = RouteProp<TripsStackParamList, 'TripBrief'>;

export default function TripBriefScreen() {
  const navigation = useNavigation();
  const route = useRoute<TripBriefRoute>();
  const insets = useSafeAreaInsets();
  const { trip } = route.params ?? {};
  const {
    lang,
    t,
    friendIds,
    setSelectedTripId,
    setSelectedMemberId,
    setMemberProfileSource,
  } = useApp();
  const becomeDriverMutation = useBecomeDriver();

  if (!trip) return null;

  const driver = trip.participants.find((p) => p.isDriver);
  const isDriverTBD = !driver;
  const isDriverFriend = driver ? friendIds.has(driver.user.id ?? driver.user.userArn) : false;
  const passengers = trip.participants.filter((p) => !p.isDriver);

  const handleBack = () => navigation.goBack();

  const handleDriverProfileClick = () => {
    if (driver) {
      const id = driver.user.id ?? driver.user.userArn;
      setSelectedMemberId(id);
      setMemberProfileSource('trip_brief');
      (navigation.getParent() as any)?.navigate('Friends', {
        screen: 'MemberProfile',
        params: { memberId: id, source: 'trip_brief' },
      });
    }
  };

  const handleJoinAsDriver = async () => {
    try {
      await becomeDriverMutation.mutateAsync(trip.id);
      setSelectedTripId(trip.id);
      navigation.replace('TripDetail', { tripId: trip.id, title: t.tripDetail });
    } catch {
      // Error handled by mutation / could show alert
    }
  };

  const handleAddGroup = () => {
    setSelectedTripId(trip.id);
    navigation.navigate('AddPassengerGroup');
  };

  const tripIdShort = trip.id.split(':').pop()?.substring(0, 8) ?? '';
  const isProcessing = becomeDriverMutation.isPending;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <View style={[styles.backWrap, { top: insets.top + 8 }]}>
        <Pressable onPress={handleBack} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
          <Icon name="arrow_back_ios_new" size={28} color={colors.slate[800]} />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.idBadge}>
            <Text style={styles.idBadgeText}>ID: {tripIdShort}</Text>
          </View>
          <View style={styles.originDestRow}>
            <Text style={styles.place}>{trip.origin}</Text>
            <Icon name="arrow_forward" size={28} color={colors.slate[200]} />
            <Text style={styles.place}>{trip.destination}</Text>
          </View>
          <Text style={styles.meta}>
            {trip.date} • {trip.timeRange.split(' - ')[0]}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.driver}</Text>
          {isDriverTBD ? (
            <View style={styles.driverTbd}>
              <View style={styles.driverPlaceholder}>
                <Icon name="person_outline" size={40} color={colors.slate[300]} />
              </View>
              <Text style={styles.driverTbdText}>{t.driverTBD}</Text>
              <Pressable
                onPress={handleJoinAsDriver}
                disabled={isProcessing}
                style={[styles.joinDriverBtn, isProcessing && styles.joinDriverBtnDisabled]}
              >
                {isProcessing ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.joinDriverBtnText}>{t.joinAsDriver}</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={handleDriverProfileClick} style={({ pressed }) => [styles.driverCard, pressed && styles.pressed]}>
              <Image source={{ uri: driver?.user.avatar }} style={styles.driverAvatar} />
              {isDriverFriend && (
                <View style={styles.friendBadge}>
                  <Text style={styles.friendBadgeText}>{lang === 'zh' ? '好友' : 'Friend'}</Text>
                </View>
              )}
              <Text style={styles.driverName}>{driver?.user.name}</Text>
              <View style={styles.confirmedBadge}>
                <Text style={styles.confirmedBadgeText}>{lang === 'zh' ? '已确认' : 'CONFIRMED'}</Text>
              </View>
            </Pressable>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{lang === 'zh' ? '乘客' : 'PASSENGERS'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.passengersRow}>
            {passengers.map((p) => (
              <View key={p.user.userArn ?? p.user.id ?? ''} style={styles.passengerChip}>
                <Image source={{ uri: p.user.avatar }} style={styles.passengerAvatar} />
                <Text style={styles.passengerName} numberOfLines={1}>{p.user.name}</Text>
              </View>
            ))}
            {passengers.length === 0 && (
              <Text style={styles.noPassengers}>{lang === 'zh' ? '暂无乘客' : 'No passengers yet'}</Text>
            )}
          </ScrollView>
          <Pressable onPress={handleAddGroup} style={({ pressed }) => [styles.addGroupBtn, pressed && styles.pressed]}>
            <Icon name="group_add" size={16} color={colors.sage} />
            <Text style={styles.addGroupBtnText}>{lang === 'zh' ? '作为新小组加入' : 'Join as a new group'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  backWrap: { position: 'absolute', left: spacing.p6, zIndex: 10 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  pressed: { opacity: 0.9 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 72, paddingHorizontal: spacing.p6, paddingBottom: 32 },
  hero: { alignItems: 'center', marginBottom: spacing.p8 },
  idBadge: {
    backgroundColor: colors.sage + '1A',
    paddingHorizontal: spacing.p3,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    marginBottom: spacing.p4,
  },
  idBadgeText: { fontSize: fontSize['10'], fontWeight: '800', color: colors.sage, letterSpacing: 2 },
  originDestRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.p4, marginBottom: 8 },
  place: { fontSize: fontSize['3xl'], fontWeight: '800', color: colors.slate[900] },
  meta: { fontSize: fontSize.xs, fontWeight: '700', color: colors.slate[400], textTransform: 'uppercase', letterSpacing: 2 },
  section: { marginBottom: spacing.p8 },
  sectionTitle: {
    fontSize: fontSize['11'],
    fontWeight: '800',
    color: colors.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.p6,
    textAlign: 'center',
  },
  driverTbd: { alignItems: 'center', gap: spacing.p4 },
  driverPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: colors.slate[50],
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.slate[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverTbdText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.slate[400], marginBottom: spacing.p3 },
  joinDriverBtn: {
    backgroundColor: colors.morandiMustard,
    paddingHorizontal: spacing.p4,
    paddingVertical: spacing.py2,
    borderRadius: borderRadius.full,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  joinDriverBtnDisabled: { opacity: 0.6 },
  joinDriverBtnText: { fontSize: fontSize['11'], fontWeight: '800', color: colors.white, textTransform: 'uppercase' },
  driverCard: { alignItems: 'center', gap: spacing.p3 },
  driverAvatar: { width: 80, height: 80, borderRadius: 28, borderWidth: 4, borderColor: colors.white },
  friendBadge: {
    alignSelf: 'center',
    backgroundColor: colors.sageLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  friendBadgeText: { fontSize: 8, fontWeight: '800', color: colors.sage },
  driverName: { fontSize: fontSize.base, fontWeight: '800', color: colors.slate[800] },
  confirmedBadge: { backgroundColor: colors.sageLight, paddingHorizontal: spacing.p3, paddingVertical: 2, borderRadius: 8 },
  confirmedBadgeText: { fontSize: fontSize['10'], fontWeight: '800', color: colors.sage },
  passengersRow: { flexDirection: 'row', gap: spacing.p6, paddingBottom: spacing.p4 },
  passengerChip: { alignItems: 'center', width: 80 },
  passengerAvatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: colors.white, marginBottom: 8 },
  passengerName: { fontSize: fontSize['11'], fontWeight: '700', color: colors.slate[800], textAlign: 'center' },
  noPassengers: { fontSize: fontSize['10'], color: colors.slate[300], fontWeight: '700', paddingVertical: spacing.p4 },
  addGroupBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.p4 },
  addGroupBtnText: { fontSize: fontSize['11'], fontWeight: '800', color: colors.sage, textTransform: 'uppercase' },
});
