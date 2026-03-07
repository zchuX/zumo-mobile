import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, useDerivedValue, withSpring, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from '../src/components/Icon';
import Loading from '../src/components/Loading';
import { useApp } from '../context/AppState';
import { useTrip, useStartTrip, useUpdateTripMetadata, useBecomeDriver, useAcceptDriverInvitation } from '../src/hooks/useTrips';
import { useQueryClient } from '@tanstack/react-query';
import { tripKeys } from '../src/data/trips/keys';
import type { Trip } from '../src/types';
import { TripStatus } from '../src/types';
import type { TripsStackParamList } from '../navigation/types';
import { colors, fontSize, spacing, borderRadius } from '../src/theme';

const ROW_H = 52;
const SPRING = { damping: 22, stiffness: 300, mass: 0.8 };

type EditedLocationItem = { locationName: string; arrived: boolean };

type LocationWithGroups = { locationName: string; pickupGroups?: string[]; dropOffGroups?: string[] };
type UserGroupForName = { groupId: string; groupName: string };

/** Returns validation error if any group's drop-off would be before its pick-up in the given order. */
function validatePickupBeforeDropoff(
  orderedLocationNames: string[],
  locations: LocationWithGroups[],
  userGroups?: UserGroupForName[]
): { valid: true } | { valid: false; groupDisplayName: string } {
  const byName = new Map(locations.map((l) => [l.locationName, l]));
  const groupsWithDropoff = new Set<string>();
  for (const loc of locations) {
    for (const g of loc.dropOffGroups ?? []) groupsWithDropoff.add(g);
  }
  for (const groupId of groupsWithDropoff) {
    let pickupIdx = -1;
    let dropoffIdx = -1;
    for (let i = 0; i < orderedLocationNames.length; i++) {
      const loc = byName.get(orderedLocationNames[i]);
      if (!loc) continue;
      if ((loc.pickupGroups ?? []).includes(groupId)) pickupIdx = i;
      if ((loc.dropOffGroups ?? []).includes(groupId)) dropoffIdx = i;
    }
    if (dropoffIdx >= 0 && pickupIdx >= 0 && dropoffIdx < pickupIdx) {
      const groupDisplayName = userGroups?.find((g) => g.groupId === groupId)?.groupName ?? groupId;
      return { valid: false, groupDisplayName };
    }
  }
  return { valid: true };
}

function SortableRow({
  index,
  name,
  activeDrag,
  targetSlot,
  dragOffset,
  onReorder,
  styles: st,
}: {
  index: number;
  name: string;
  activeDrag: { value: number };
  targetSlot: { value: number };
  dragOffset: { value: number };
  onReorder: (from: number, to: number) => void;
  styles: Record<string, object>;
}) {
  const pan = Gesture.Pan()
    .onBegin(() => {
      activeDrag.value = index;
      dragOffset.value = 0;
    })
    .onUpdate((e) => {
      if (activeDrag.value !== index) return;
      dragOffset.value = e.translationY;
    })
    .onEnd(() => {
      if (activeDrag.value !== index) return;
      const to = targetSlot.value;
      activeDrag.value = -1;
      dragOffset.value = 0;
      if (to !== index) runOnJS(onReorder)(index, to);
    })
    .onFinalize(() => {
      if (activeDrag.value === index) {
        activeDrag.value = -1;
        dragOffset.value = 0;
      }
    });

  const rowStyle = useAnimatedStyle(() => {
    const d = activeDrag.value;
    const slot = targetSlot.value;
    if (d < 0) return {};
    if (d === index) {
      return {
        zIndex: 100,
        elevation: 8,
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 } as { width: number; height: number },
        shadowColor: '#000',
        transform: [{ translateY: dragOffset.value }, { scale: 1.04 }],
        backgroundColor: '#fff',
        borderRadius: 12,
      };
    }
    let shift = 0;
    if (d < slot && index > d && index <= slot) shift = -ROW_H;
    else if (d > slot && index >= slot && index < d) shift = ROW_H;
    return { transform: [{ translateY: withSpring(shift, SPRING) }] };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[st.sortableRow, rowStyle]}>
        <Icon name="drag_indicator" size={24} color={colors.slate[400]} />
        <View style={st.timelineContent}>
          <Text style={st.timelineName}>{name}</Text>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

type TripDetailRoute = RouteProp<TripsStackParamList, 'TripDetail'>;
type TripDetailNav = NativeStackNavigationProp<TripsStackParamList, 'TripDetail'>;

function formatLocationTime(timestamp: number | undefined | null, tripDate: string, lang: string): string | null {
  if (!timestamp || timestamp <= 0) return null;
  const date = new Date(timestamp);
  const tripD = new Date(tripDate);
  const isSameDay =
    date.getFullYear() === tripD.getFullYear() &&
    date.getMonth() === tripD.getMonth() &&
    date.getDate() === tripD.getDate();
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  if (isSameDay) return timeStr;
  const dateStr = date.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' });
  return `${dateStr} ${timeStr}`;
}

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

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getCalendarDays(year: number, month: number, selectedDate: Date) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startWeekday = first.getDay();
  const daysInMonth = last.getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
  const out: { date: Date | null; label: string; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean; isDisabled: boolean }[] = [];
  for (let i = 0; i < startWeekday; i++) {
    out.push({ date: null, label: '', isCurrentMonth: false, isToday: false, isSelected: false, isDisabled: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dDate = new Date(year, month, d);
    dDate.setHours(0, 0, 0, 0);
    const isToday = dDate.getTime() === today.getTime();
    const isSelected = dDate.getTime() === selDay.getTime();
    const isDisabled = dDate.getTime() < today.getTime();
    out.push({
      date: dDate,
      label: String(d),
      isCurrentMonth: true,
      isToday,
      isSelected,
      isDisabled,
    });
  }
  const remainder = out.length % 7;
  if (remainder) {
    for (let i = 0; i < 7 - remainder; i++) {
      out.push({ date: null, label: '', isCurrentMonth: false, isToday: false, isSelected: false, isDisabled: true });
    }
  }
  return out;
}

export default function TripDetailScreen() {
  const navigation = useNavigation<TripDetailNav>();
  const route = useRoute<TripDetailRoute>();
  const insets = useSafeAreaInsets();
  const tripId = route.params?.tripId ?? null;
  const { t, lang, user, vehicles, friendIds, setSelectedMemberId, setMemberProfileSource, setSelectedGroupArn, setSelectedTripId, setInvitationDetails } = useApp();
  const { data: trip, isLoading, error } = useTrip(tripId);
  const startTripMutation = useStartTrip();
  const updateMetadataMutation = useUpdateTripMetadata();
  const becomeDriverMutation = useBecomeDriver();
  const acceptDriverInvitationMutation = useAcceptDriverInvitation();
  const queryClient = useQueryClient();

  const [showModifyModal, setShowModifyModal] = useState(false);
  const [tempDate, setTempDate] = useState('');
  const [tempTime, setTempTime] = useState('');
  const [tempDateObj, setTempDateObj] = useState<Date>(() => new Date());
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [calendarViewMonth, setCalendarViewMonth] = useState(() => new Date());
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [selectedVehicleArn, setSelectedVehicleArn] = useState<string | null>(null);
  const [isEditingLocations, setIsEditingLocations] = useState(false);
  const [editedLocations, setEditedLocations] = useState<EditedLocationItem[]>([]);
  const [locationOrderError, setLocationOrderError] = useState<string | null>(null);
  const activeDrag = useSharedValue(-1);
  const dragOffset = useSharedValue(0);
  const locCount = useSharedValue(0);

  useEffect(() => {
    locCount.value = editedLocations.length;
  }, [editedLocations.length, locCount]);

  const targetSlot = useDerivedValue(() => {
    const d = activeDrag.value;
    if (d < 0) return -1;
    const n = locCount.value;
    const raw = d + Math.round(dragOffset.value / ROW_H);
    return Math.max(0, Math.min(n - 1, raw));
  });

  const handleReorder = useCallback(
    (from: number, to: number) => {
      if (!trip || from === to) return;
      const next: EditedLocationItem[] = [...editedLocations];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      const orderedNames = next.map((l) => l.locationName);
      const validation = validatePickupBeforeDropoff(
        orderedNames,
        trip.locations,
        trip.userGroups
      );
      if (!validation.valid) {
        setLocationOrderError(
          lang === 'zh'
            ? `不能将 ${validation.groupDisplayName} 的送客点移到接客点之前。`
            : `Cannot move ${validation.groupDisplayName} group's drop-off location prior to pick up.`
        );
        return;
      }
      setLocationOrderError(null);
      setEditedLocations(next);
    },
    [editedLocations, trip, lang]
  );

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <Loading message={t.loading ?? 'Loading Trip Details...'} />
      </View>
    );
  }

  if (!trip || error) {
    return (
      <View style={[styles.centerWrap, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Icon name="error_outline" size={64} color={colors.slate[200]} />
        <Text style={styles.errorTitle}>{lang === 'zh' ? '行程未找到' : 'Trip Not Found'}</Text>
        <Text style={styles.errorSub}>
          {lang === 'zh' ? '抱歉，我们无法找到该行程的详细信息。' : "Sorry, we couldn't find the details for this trip."}
        </Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtnFull}>
          <Text style={styles.backBtnFullText}>{lang === 'en' ? 'Back' : '返回'}</Text>
        </Pressable>
      </View>
    );
  }

  // Invitation as passenger: show prompt to view invitation screen
  const isInvitationPassenger = trip.userTripStatus === 'Invitation' && !trip.isDriver;
  if (isInvitationPassenger) {
    return (
      <View style={[styles.centerWrap, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.inviteIconWrap}>
          <Icon name="mail" size={48} color={colors.sage} />
        </View>
        <Text style={styles.inviteTitle}>{lang === 'zh' ? '行程邀请' : 'Trip Invitation'}</Text>
        <Text style={styles.inviteSub}>
          {lang === 'zh' ? '您收到此行程的邀请，请查看详情。' : "You've been invited to this trip. View details."}
        </Text>
        <Pressable
          onPress={() => navigation.navigate('TripInvitation', { trip, type: 'passenger', inviterName: 'Someone', title: t.tripInvitation })}
          style={styles.primaryBtn}
        >
          <Text style={styles.primaryBtnText}>{lang === 'zh' ? '查看邀请' : 'View Invitation'}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.goBack()} style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnText}>{lang === 'en' ? 'Back' : '返回'}</Text>
        </Pressable>
      </View>
    );
  }

  // Completed trip
  if (trip.status === TripStatus.COMPLETED) {
    const driver = trip.participants.find((p) => p.isDriver);
    const passengers = trip.participants.filter((p) => !p.isDriver);
    const handleMemberClick = (id: string) => {
      setSelectedMemberId(id);
      setMemberProfileSource('trip_detail');
      const participant = [driver, ...passengers].find((p) => (p.user.id ?? p.user.userArn) === id);
      (navigation.getParent() as any)?.navigate('Friends', {
        screen: 'MemberProfile',
        params: {
          memberId: id,
          source: 'trip_detail',
          avatarUrl: participant?.user?.avatar,
          displayName: participant?.user?.name,
        },
      });
    };

    return (
      <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.p4 }]}>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
            <Icon name="arrow_back_ios_new" size={20} color={colors.white} />
          </Pressable>
          <Text style={styles.headerTitle}>{lang === 'zh' ? '行程详情' : 'Trip Details'}</Text>
          <View style={styles.headerSpacer} />
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>{lang === 'zh' ? '已完成行程' : 'TRIP COMPLETED'}</Text>
          </View>
          <View style={styles.originDestRow}>
            <Text style={styles.originDestTitle}>{trip.origin}</Text>
            <Icon name="arrow_forward" size={20} color={colors.slate[300]} />
            <Text style={styles.originDestTitle}>{trip.destination}</Text>
          </View>
          <Text style={styles.completedDate}>
            {lang === 'zh' ? `完成于 ${trip.date}` : `Completed on ${trip.date}`}
          </Text>
          <View style={styles.tripIdBadge}>
            <Text style={styles.tripIdBadgeText} numberOfLines={1}>
              {lang === 'zh' ? `行程ID  ${trip.id}` : `TRIP ID  ${trip.id}`}
            </Text>
          </View>

          {trip.locations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{lang === 'zh' ? '路线' : 'ROUTE'}</Text>
              <View style={styles.timeline}>
                {trip.locations.map((loc, idx) => (
                  <View key={idx} style={styles.timelineRow}>
                    <Icon
                      name={loc.arrived ? 'check_circle' : 'location_on'}
                      size={24}
                      color={colors.slate[300]}
                    />
                    <View style={styles.timelineContent}>
                      {loc.arrivedTime && loc.arrived && (
                        <Text style={styles.timelineTime}>
                          {formatLocationTime(loc.arrivedTime, trip.date, lang)} {lang === 'zh' ? '到达' : 'arrived'}
                        </Text>
                      )}
                      <Text style={styles.timelineName}>{loc.locationName}</Text>
                      {((loc.pickupGroups?.length ?? 0) > 0 || (loc.dropOffGroups?.length ?? 0) > 0) && (
                        <Text style={styles.timelineGroups}>
                          {(loc.pickupGroups?.length ?? 0) > 0 && (lang === 'zh' ? `接 ${(loc.pickupGroups ?? []).join(', ')}` : `Pick up ${(loc.pickupGroups ?? []).join(', ')}`)}
                          {(loc.pickupGroups?.length ?? 0) > 0 && (loc.dropOffGroups?.length ?? 0) > 0 ? <Text style={styles.timelineGroups}> • </Text> : null}
                          {(loc.dropOffGroups?.length ?? 0) > 0 && (lang === 'zh' ? `送 ${(loc.dropOffGroups ?? []).join(', ')}` : `Drop off ${(loc.dropOffGroups ?? []).join(', ')}`)}
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{lang === 'zh' ? '司机' : 'DRIVER'}</Text>
            {driver ? (
              <Pressable onPress={() => handleMemberClick(driver.user.id ?? driver.user.userArn)} style={styles.driverCard}>
                <Image source={{ uri: driver.user.avatar }} style={styles.avatar} />
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{driver.user.name}</Text>
                  {friendIds.has(driver.user.id ?? driver.user.userArn) && (
                    <Text style={styles.friendTag}>{lang === 'zh' ? '好友' : 'FRIEND'}</Text>
                  )}
                  {trip.vehicle && (
                    <Text style={styles.vehicleText}>
                      {trip.vehicle.brand} {trip.vehicle.model}
                    </Text>
                  )}
                </View>
                <Icon name="chevron_right" size={20} color={colors.slate[200]} />
              </Pressable>
            ) : (
              <View style={styles.driverCardPlaceholder}>
                <Text style={styles.placeholderText}>{lang === 'zh' ? '司机信息暂缺' : 'Driver information missing'}</Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{lang === 'zh' ? '乘车人员' : 'PASSENGERS'}</Text>
            {passengers.length === 0 ? (
              <Text style={styles.noPassengers}>{lang === 'zh' ? '无乘车记录' : 'No passenger records'}</Text>
            ) : (
              passengers.map((p) => (
                <Pressable
                  key={p.user.userArn}
                  onPress={() => handleMemberClick(p.user.id ?? p.user.userArn)}
                  style={styles.passengerRow}
                >
                  <Image source={{ uri: p.user.avatar }} style={styles.avatarSmall} />
                  <View style={styles.passengerInfo}>
                    <Text style={styles.passengerName}>{p.user.name}</Text>
                    {friendIds.has(p.user.id ?? p.user.userArn) && (
                      <Text style={styles.friendTagSmall}>{lang === 'zh' ? '我的好友' : 'FRIEND'}</Text>
                    )}
                  </View>
                  <Icon name="chevron_right" size={20} color={colors.slate[200]} />
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Active trip detail
  const driver = trip.participants.find((p) => p.isDriver);
  const passengers = trip.participants.filter((p) => !p.isDriver);
  const cleanMe = (user?.userArn ?? '').replace(/^user:/i, '').trim().toLowerCase();
  const cleanDriverArn = (driver?.user?.userArn ?? trip.createdBy ?? '').replace(/^user:/i, '').trim().toLowerCase();
  const isMeDriver = Boolean(cleanMe && cleanDriverArn && cleanMe === cleanDriverArn);
  const isInvitationDriver = trip.userTripStatus === 'Invitation' && isMeDriver;
  const canStartTrip = !isInvitationDriver && isMeDriver && trip.status !== TripStatus.IN_PROGRESS;
  const canModifyTrip = !isInvitationDriver && isMeDriver && trip.status !== TripStatus.IN_PROGRESS;
  const isDriverFriend = driver ? friendIds.has(driver.user.id ?? driver.user.userArn) : false;

  const handleDriverPress = () => {
    if (driver) {
      const id = driver.user.id ?? driver.user.userArn;
      setSelectedMemberId(id);
      setMemberProfileSource('trip_detail');
      (navigation.getParent() as any)?.navigate('Friends', {
        screen: 'MemberProfile',
        params: {
          memberId: id,
          source: 'trip_detail',
          avatarUrl: driver.user.avatar,
          displayName: driver.user.name,
        },
      });
    }
  };

  const handleAddGroup = () => {
    navigation.navigate('AddPassengerGroup');
  };

  const handleGroupPress = (groupId: string) => {
    if (tripId) setSelectedTripId(tripId);
    setSelectedGroupArn(groupId);
    navigation.navigate('PassengerGroupDetail');
  };

  const handleStartTrip = async () => {
    if (!tripId) return;
    try {
      await startTripMutation.mutateAsync(tripId);
    } catch {
      // error already surfaced by mutation
    }
  };

  const handleAcceptInvitation = async () => {
    if (!tripId) return;
    try {
      await acceptDriverInvitationMutation.mutateAsync(tripId);
      setInvitationDetails(null);
      // Trip cache updated by mutation; isInvitationDriver becomes false, full driver UI shown
    } catch {
      // error already surfaced by mutation
    }
  };

  const statusLabel =
    trip.status === TripStatus.IN_PROGRESS
      ? (lang === 'zh' ? '进行中' : 'In Progress')
      : (lang === 'zh' ? '即将开始' : 'Upcoming');
  const countdown = countdownText(trip, lang);

  const openModifyModal = () => {
    const d = trip.startTime > 0 ? new Date(trip.startTime) : new Date();
    setTempDateObj(d);
    setTempDate(d.toISOString().split('T')[0]);
    const HH = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    setTempTime(`${HH}:${mm}`);
    setSelectedVehicleArn(trip.vehicle?.id ?? null);
    setShowDateTimePicker(false);
    setCalendarViewMonth(d);
    setShowVehicleDropdown(false);
    setShowModifyModal(true);
  };

  const closeModifyModal = () => {
    setShowModifyModal(false);
    setShowDateTimePicker(false);
  };

  const selectedVehicle = selectedVehicleArn ? vehicles.find((v) => v.id === selectedVehicleArn) : null;
  const selectedVehicleLabel =
    selectedVehicleArn === null || !selectedVehicle
      ? (lang === 'zh' ? '不选择车辆' : 'No Vehicle')
      : `${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.licensePlate})`;

  const handleUpdateTime = async () => {
    if (!tripId) return;
    try {
      const [hours, minutes] = tempTime.split(':');
      const newDate = new Date(tempDate);
      newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      await updateMetadataMutation.mutateAsync({
        tripArn: tripId,
        params: { startTime: newDate.getTime(), vehicleArn: selectedVehicleArn },
      });
      closeModifyModal();
    } catch {
      Alert.alert(lang === 'zh' ? '更新时间失败' : 'Failed to update time');
    }
  };

  const handleConfirmLocations = async () => {
    if (!tripId) return;
    setLocationOrderError(null);
    const orderedNames = editedLocations.map((l) => l.locationName);
    const pickupDropoffValidation = validatePickupBeforeDropoff(
      orderedNames,
      trip.locations,
      trip.userGroups
    );
    if (!pickupDropoffValidation.valid) {
      setLocationOrderError(
        lang === 'zh'
          ? `不能将 ${pickupDropoffValidation.groupDisplayName} 的送客点移到接客点之前。`
          : `Cannot move ${pickupDropoffValidation.groupDisplayName} group's drop-off location prior to pick up.`
      );
      return;
    }
    // In-progress: validate that no arrived location was moved to a larger index
    if (trip.status === TripStatus.IN_PROGRESS && trip.locations.length > 0) {
      for (let i = 0; i < editedLocations.length; i++) {
        const item = editedLocations[i];
        if (item.arrived) {
          const origIdx = trip.locations.findIndex((l) => l.locationName === item.locationName);
          if (origIdx !== -1 && i > origIdx) {
            setLocationOrderError(
              lang === 'zh' ? '已到达的地点不能移到后面的位置。' : "Arrived locations cannot be moved to a later position."
            );
            return;
          }
        }
      }
    }
    try {
      await updateMetadataMutation.mutateAsync({
        tripArn: tripId,
        params: { locations: editedLocations.map((l) => l.locationName) },
      });
      queryClient.setQueryData(tripKeys.detail(tripId), (old: Trip | undefined) => {
        if (!old) return old;
        return {
          ...old,
          locations: editedLocations.map((item) => {
            const existing = old.locations.find((l) => l.locationName === item.locationName);
            return existing
              ? { ...existing, locationName: item.locationName, arrived: item.arrived }
              : { locationName: item.locationName, pickupGroups: [], dropOffGroups: [], arrived: item.arrived };
          }),
        };
      });
      setIsEditingLocations(false);
    } catch {
      Alert.alert(lang === 'zh' ? '更新失败' : 'Update failed');
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.p4 }]}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
          <Icon name="arrow_back_ios_new" size={20} color={colors.white} />
        </Pressable>
        <Text style={styles.headerTitle}>{lang === 'zh' ? '行程详情' : 'Trip Details'}</Text>
        {canModifyTrip ? (
          <Pressable onPress={openModifyModal} style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
            <Icon name="edit" size={20} color={colors.white} />
          </Pressable>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
        {countdown ? <Text style={styles.countdownText}>{countdown}</Text> : null}
        <View style={styles.statusWrap}>
          <View style={[styles.statusBadge, trip.status === TripStatus.IN_PROGRESS && styles.statusBadgeActive]}>
            {trip.status === TripStatus.IN_PROGRESS && <View style={styles.statusDot} />}
            <Text style={[styles.statusBadgeText, trip.status === TripStatus.IN_PROGRESS && styles.statusBadgeTextActive]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>{lang === 'zh' ? '路线' : 'ROUTE'}</Text>
            {isEditingLocations ? (
              <View style={styles.editRouteActions}>
                <Pressable
                  onPress={() => {
                    setIsEditingLocations(false);
                    setLocationOrderError(null);
                    if (trip.locations.length > 0) {
                      setEditedLocations(
                        trip.locations.map((l) => ({ locationName: l.locationName, arrived: l.arrived ?? false }))
                      );
                    }
                  }}
                >
                  <Text style={styles.editRouteCancel}>{lang === 'zh' ? '取消' : 'CANCEL'}</Text>
                </Pressable>
                <Pressable onPress={handleConfirmLocations} disabled={updateMetadataMutation.isPending}>
                  <Text style={styles.editRouteConfirm}>
                    {updateMetadataMutation.isPending ? (lang === 'zh' ? '保存中...' : 'SAVING...') : (lang === 'zh' ? '确认' : 'CONFIRM')}
                  </Text>
                </Pressable>
              </View>
            ) : (
              (canModifyTrip || (isMeDriver && trip.status === TripStatus.IN_PROGRESS)) && (
                <Pressable
                  onPress={() => {
                    setIsEditingLocations(true);
                    setLocationOrderError(null);
                    if (trip.locations.length > 0) {
                      setEditedLocations(
                        trip.locations.map((l) => ({ locationName: l.locationName, arrived: l.arrived ?? false }))
                      );
                    } else {
                      setEditedLocations(
                        [trip.origin, trip.destination].filter(Boolean).map((name) => ({ locationName: name, arrived: false }))
                      );
                    }
                  }}
                >
                  <Text style={styles.modifyRouteBtn}>{lang === 'zh' ? '修改路线' : 'MODIFY ROUTE'}</Text>
                </Pressable>
              )
            )}
          </View>
          {locationOrderError ? (
            <Text style={styles.locationOrderError}>{locationOrderError}</Text>
          ) : null}
          <View style={styles.timeline}>
            {isEditingLocations ? (
              editedLocations.map((item, idx) => (
                <SortableRow
                  key={`${idx}-${item.locationName}`}
                  index={idx}
                  name={item.locationName}
                  activeDrag={activeDrag}
                  targetSlot={targetSlot}
                  dragOffset={dragOffset}
                  onReorder={handleReorder}
                  styles={styles}
                />
              ))
            ) : trip.locations.length > 0 ? (
              trip.locations.map((loc, idx) => (
                <View key={idx} style={styles.timelineRow}>
                  <Icon
                    name={loc.arrived ? 'check_circle' : idx === trip.locations.length - 1 ? 'location_on' : 'radio_button_unchecked'}
                    size={24}
                    color={loc.arrived ? colors.slate[300] : idx === 0 ? colors.sage : colors.slate[300]}
                  />
                  <View style={styles.timelineContent}>
                    {!loc.arrived && loc.plannedTime && (
                      <Text style={styles.timelineTime}>
                        {lang === 'zh' ? '预计 ' : ''}{formatLocationTime(loc.plannedTime, trip.date, lang)}
                      </Text>
                    )}
                    {loc.arrived && loc.arrivedTime && (
                      <Text style={styles.timelineTime}>
                        {formatLocationTime(loc.arrivedTime, trip.date, lang)} {lang === 'zh' ? '到达' : 'arrived'}
                      </Text>
                    )}
                    <Text style={[styles.timelineName, !loc.arrived && idx === 0 && styles.timelineNameFirst]}>
                      {loc.locationName}
                    </Text>
                    {((loc.pickupGroups?.length ?? 0) > 0 || (loc.dropOffGroups?.length ?? 0) > 0) && (
                      <Text style={styles.timelineGroups}>
                        {(loc.pickupGroups?.length ?? 0) > 0 && (lang === 'zh' ? `接 ${(loc.pickupGroups ?? []).join(', ')}` : `Pick up ${(loc.pickupGroups ?? []).join(', ')}`)}
                        {(loc.pickupGroups?.length ?? 0) > 0 && (loc.dropOffGroups?.length ?? 0) > 0 ? <Text style={styles.timelineGroups}> • </Text> : null}
                        {(loc.dropOffGroups?.length ?? 0) > 0 && (lang === 'zh' ? `送 ${(loc.dropOffGroups ?? []).join(', ')}` : `Drop off ${(loc.dropOffGroups ?? []).join(', ')}`)}
                      </Text>
                    )}
                  </View>
                </View>
              ))
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

        {(canStartTrip || isInvitationDriver) && (
          <View style={styles.section}>
            {isInvitationDriver ? (
              <Pressable
                onPress={handleAcceptInvitation}
                disabled={acceptDriverInvitationMutation.isPending}
                style={({ pressed }) => [styles.startTripRow, pressed && styles.pressed]}
              >
                <Icon name="check" size={20} color={colors.sage} />
                <Text style={styles.startTripRowText}>
                  {acceptDriverInvitationMutation.isPending ? (lang === 'zh' ? '接受中...' : 'Accepting...') : t.acceptInvitation}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleStartTrip}
                disabled={startTripMutation.isPending}
                style={({ pressed }) => [styles.startTripRow, pressed && styles.pressed]}
              >
                <Icon name="play_arrow" size={20} color={colors.sage} />
                <Text style={styles.startTripRowText}>
                  {startTripMutation.isPending ? (lang === 'zh' ? '启动中...' : 'Starting...') : (lang === 'zh' ? '开始行程' : 'Start trip')}
                </Text>
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Pressable onPress={handleDriverPress} style={styles.driverCard}>
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

        <View style={styles.section}>
          <View style={styles.passengerGroupsLabelWrap}>
            <Text style={styles.sectionLabel}>{lang === 'zh' ? '乘客小组' : 'PASSENGER GROUPS'}</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupsScroll}>
            {!isInvitationDriver && (
              <Pressable onPress={handleAddGroup} style={styles.addGroupBtn}>
                <Icon name="add" size={32} color={colors.sage} />
                <Text style={styles.addGroupLabel}>{lang === 'zh' ? '邀请乘客' : 'Invite Passenger'}</Text>
              </Pressable>
            )}
            {trip.userGroups.map((g) => (
              <Pressable key={g.groupId} onPress={() => handleGroupPress(g.groupId)} style={styles.groupChip}>
                <View style={styles.groupAvatar}>
                  {g.imageUrl ? (
                    <Image source={{ uri: g.imageUrl }} style={StyleSheet.absoluteFill} />
                  ) : (
                    <Icon name="group" size={24} color={colors.slate[300]} />
                  )}
                </View>
                <Text style={styles.groupName} numberOfLines={1}>{g.groupName}</Text>
                <Text style={styles.groupConfirmed}>{lang === 'zh' ? '已确认' : 'CONFIRMED'}</Text>
              </Pressable>
            ))}
            {trip.userGroups.length === 0 && passengers.map((p, idx) => (
              <View key={idx} style={styles.groupChip}>
                <Image source={{ uri: p.user.avatar }} style={styles.groupAvatarImg} />
                <Text style={styles.groupName} numberOfLines={1}>{p.user.name}</Text>
                <Text style={[styles.groupConfirmed, !p.confirmed && styles.groupPending]}>
                  {p.confirmed ? (lang === 'zh' ? '已确认' : 'CONFIRMED') : (lang === 'zh' ? '待确认' : 'PENDING')}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <Modal visible={showModifyModal} transparent animationType="slide" onRequestClose={closeModifyModal}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdropTouchable} onPress={closeModifyModal} />
          <View style={styles.modalContent} pointerEvents="box-none">
            {showDateTimePicker ? (
              <>
                <View style={styles.dateTimeModalContent}>
                  <View style={styles.dateTimeModalHeader}>
                    <Text style={styles.dateTimeModalTitle}>{lang === 'zh' ? '日期与时间' : 'Date & Time'}</Text>
                    <View style={styles.dateTimeModalHeaderActions}>
                      <Pressable
                        onPress={() => setShowDateTimePicker(false)}
                        style={({ pressed }) => [styles.dateTimeConfirmTick, pressed && styles.pressed]}
                      >
                        <Icon name="check" size={24} color={colors.white} />
                      </Pressable>
                      <Pressable onPress={() => setShowDateTimePicker(false)} style={styles.modalClose}>
                        <Icon name="close" size={24} color={colors.slate[400]} />
                      </Pressable>
                    </View>
                  </View>
                  <View>
                    <View style={styles.calendarHeader}>
                      <Pressable
                        onPress={() =>
                          setCalendarViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))
                        }
                        style={({ pressed }) => [styles.calendarNavBtn, pressed && styles.pressed]}
                      >
                        <Icon name="chevron_left" size={24} color={colors.slate[700]} />
                      </Pressable>
                      <Text style={styles.calendarMonthTitle}>
                        {calendarViewMonth.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </Text>
                      <Pressable
                        onPress={() =>
                          setCalendarViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))
                        }
                        style={({ pressed }) => [styles.calendarNavBtn, pressed && styles.pressed]}
                      >
                        <Icon name="chevron_right" size={24} color={colors.slate[700]} />
                      </Pressable>
                    </View>
                    <View style={styles.weekdayRow}>
                      {WEEKDAYS.map((w) => (
                        <Text key={w} style={styles.weekdayCell}>{w}</Text>
                      ))}
                    </View>
                    <View style={styles.calendarGrid}>
                      {getCalendarDays(
                        calendarViewMonth.getFullYear(),
                        calendarViewMonth.getMonth(),
                        tempDateObj
                      ).map((cell, idx) => (
                        <Pressable
                          key={idx}
                          onPress={() => {
                            if (cell.date && !cell.isDisabled) {
                              setTempDateObj(cell.date);
                              setTempDate(cell.date.toISOString().split('T')[0]);
                            }
                          }}
                          disabled={!cell.date || cell.isDisabled}
                          style={[
                            styles.calendarDay,
                            cell.isSelected && styles.calendarDaySelected,
                            cell.isToday && !cell.isSelected && styles.calendarDayToday,
                            (!cell.date || cell.isDisabled) && styles.calendarDayDisabled,
                          ]}
                        >
                          <View style={styles.calendarDayInner}>
                            <Text
                              style={[
                                styles.calendarDayText,
                                cell.isSelected && styles.calendarDayTextSelected,
                                (!cell.date || cell.isDisabled) && styles.calendarDayTextDisabled,
                              ]}
                            >
                              {cell.label}
                            </Text>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                    <Text style={styles.timeLabel}>{lang === 'zh' ? '时间' : 'Time'}</Text>
                    <View style={styles.pickerWrapper}>
                      <DateTimePicker
                        value={(() => {
                          const [h, m] = tempTime.split(':').map(Number);
                          const d = new Date(tempDateObj);
                          d.setHours(isNaN(h) ? 0 : h, isNaN(m) ? 0 : m, 0, 0);
                          return d;
                        })()}
                        mode="time"
                        display="spinner"
                        themeVariant="light"
                        textColor={colors.slate[900]}
                        accentColor={colors.sage}
                        onChange={(_, date) => {
                          if (date) {
                            const HH = date.getHours().toString().padStart(2, '0');
                            const mm = date.getMinutes().toString().padStart(2, '0');
                            setTempTime(`${HH}:${mm}`);
                          }
                        }}
                      />
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{lang === 'zh' ? '修改行程信息' : 'Modify Trip Info'}</Text>
                  <Pressable onPress={closeModifyModal} style={styles.modalClose}>
                    <Icon name="close" size={24} color={colors.slate[400]} />
                  </Pressable>
                </View>
                <View style={styles.modalBody}>
                  <Text style={styles.modalLabel}>{lang === 'zh' ? '日期与时间' : 'Date & Time'}</Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.modalInput}
                    onPress={() => {
                      setCalendarViewMonth(new Date(tempDateObj));
                      setShowDateTimePicker(true);
                    }}
                  >
                    <Text style={styles.modalInputText}>
                      {tempDate
                        ? tempDateObj.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : (lang === 'zh' ? '选择日期' : 'Select date')}
                      {' · '}
                      {(() => {
                        const [h, m] = (tempTime || '00:00').split(':').map(Number);
                        const d = new Date(2000, 0, 1, isNaN(h) ? 0 : h, isNaN(m) ? 0 : m, 0, 0);
                        return d.toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                      })()}
                    </Text>
                  </TouchableOpacity>

                  {isMeDriver && vehicles.length > 0 && (
                    <>
                      <Text style={styles.modalLabel}>{lang === 'zh' ? '车辆' : 'Vehicle'}</Text>
                      <Pressable
                        style={styles.dropdownTrigger}
                        onPress={() => setShowVehicleDropdown(!showVehicleDropdown)}
                      >
                        <Text style={styles.dropdownTriggerText} numberOfLines={1}>{selectedVehicleLabel}</Text>
                        <Icon name={showVehicleDropdown ? 'expand_less' : 'expand_more'} size={24} color={colors.slate[500]} />
                      </Pressable>
                      {showVehicleDropdown && (
                        <View style={styles.vehicleDropdownList}>
                          {vehicles.map((v) => (
                            <Pressable
                              key={v.id}
                              onPress={() => {
                                setSelectedVehicleArn(v.id);
                                setShowVehicleDropdown(false);
                              }}
                              style={[styles.vehicleOption, selectedVehicleArn === v.id && styles.vehicleOptionSelected]}
                            >
                              <Text style={styles.vehicleOptionText} numberOfLines={1}>{v.brand} {v.model} ({v.licensePlate})</Text>
                              {selectedVehicleArn === v.id && <Icon name="check" size={20} color={colors.sage} />}
                            </Pressable>
                          ))}
                          <Pressable
                            onPress={() => {
                              setSelectedVehicleArn(null);
                              setShowVehicleDropdown(false);
                            }}
                            style={[styles.vehicleOption, !selectedVehicleArn && styles.vehicleOptionSelected]}
                          >
                            <Text style={styles.vehicleOptionText}>{lang === 'zh' ? '不选择车辆' : 'No Vehicle'}</Text>
                            {!selectedVehicleArn && <Icon name="check" size={20} color={colors.sage} />}
                          </Pressable>
                        </View>
                      )}
                    </>
                  )}
                </View>
                <Pressable
                  onPress={handleUpdateTime}
                  disabled={updateMetadataMutation.isPending}
                  style={[styles.modalConfirmBtn, updateMetadataMutation.isPending && styles.modalConfirmBtnDisabled]}
                >
                  {updateMetadataMutation.isPending ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.modalConfirmBtnText}>{t.confirm}</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white },
  centerWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.p8 },
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
  headerSpacer: { width: 32, height: 32 },
  headerTitle: { fontSize: fontSize.base, fontWeight: '800', letterSpacing: -0.5, textTransform: 'uppercase', color: colors.white },
  pressed: { opacity: 0.9 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.p6, paddingBottom: spacing.p8 },
  tripIdWrap: { alignItems: 'center', marginTop: spacing.p4, marginBottom: spacing.gap3 },
  statusWrap: { alignItems: 'center', marginBottom: spacing.gap3 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.p4,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.slate[100],
  },
  statusBadgeActive: { backgroundColor: colors.sage + '15' },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.sage,
    marginRight: 6,
  },
  statusBadgeText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.slate[400] },
  statusBadgeTextActive: { color: colors.sage },
  dateTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    color: colors.slate[900],
    textAlign: 'center',
    marginBottom: 4,
  },
  countdownText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.sage, textAlign: 'center', marginBottom: spacing.p6 },
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
  section: { marginBottom: spacing.p6 },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    color: colors.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.gap3,
    marginLeft: 4,
  },
  timeline: { marginLeft: 4 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.p6 },
  sortableRow: { flexDirection: 'row', alignItems: 'center', height: ROW_H, paddingHorizontal: spacing.gap2 },
  timelineContent: { flex: 1, marginLeft: spacing.gap3 },
  timelineTime: { fontSize: fontSize['10'], fontWeight: '700', color: colors.slate[400], marginBottom: 2 },
  timelineName: { fontSize: fontSize.base, fontWeight: '800', color: colors.slate[500] },
  timelineNameFirst: { fontSize: fontSize.xl, fontWeight: '800', color: colors.slate[900] },
  timelineGroups: { fontSize: fontSize['11'], fontWeight: '700', color: colors.slate[400], marginTop: 2 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.gap3 },
  editRouteActions: { flexDirection: 'row', gap: spacing.gap3 },
  editRouteCancel: { fontSize: fontSize['10'], fontWeight: '800', color: colors.slate[400], textTransform: 'uppercase' },
  editRouteConfirm: { fontSize: fontSize['10'], fontWeight: '800', color: colors.sage, textTransform: 'uppercase' },
  modifyRouteBtn: { fontSize: fontSize['10'], fontWeight: '800', color: colors.sage, textTransform: 'uppercase', letterSpacing: 2 },
  locationOrderError: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.rose[500],
    marginTop: spacing.gap2,
    marginBottom: spacing.gap2,
  },
  moveBtns: { flexDirection: 'row', gap: 4 },
  moveBtn: { padding: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdropTouchable: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.p6,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.p6 },
  modalTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.slate[900] },
  modalClose: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.slate[100], alignItems: 'center', justifyContent: 'center' },
  modalBody: { gap: spacing.gap3, marginBottom: spacing.p6 },
  pickerWrapper: {
    minHeight: 220,
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: spacing.p4,
  },
  dateTimeModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.p6,
    paddingBottom: spacing.p8 + 24,
  },
  dateTimeModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.p4,
  },
  dateTimeModalHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateTimeConfirmTick: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTimeModalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.slate[900],
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.p4,
  },
  calendarNavBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarMonthTitle: {
    fontSize: fontSize.base,
    fontWeight: '800',
    color: colors.slate[800],
  },
  weekdayRow: { flexDirection: 'row', marginBottom: 6 },
  weekdayCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: colors.slate[400],
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.p4,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  calendarDaySelected: { backgroundColor: colors.sage },
  calendarDayToday: { backgroundColor: colors.slate[200] },
  calendarDayDisabled: { opacity: 0.4 },
  calendarDayInner: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarDayText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.slate[800],
    textAlign: 'center',
  },
  calendarDayTextSelected: { color: colors.white },
  calendarDayTextDisabled: { color: colors.slate[400] },
  timeLabel: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    color: colors.slate[400],
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  dateTimeConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.sage,
    paddingVertical: spacing.py2,
    paddingHorizontal: spacing.p5,
    borderRadius: 12,
    marginTop: spacing.p4,
  },
  dateTimeConfirmText: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.white,
  },
  modalLabel: { fontSize: fontSize.xs, fontWeight: '800', color: colors.slate[400], textTransform: 'uppercase' },
  modalInput: {
    backgroundColor: colors.slate[50],
    borderRadius: 20,
    paddingHorizontal: spacing.p4,
    paddingVertical: spacing.py3,
    justifyContent: 'center',
  },
  modalInputText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.slate[800] },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.slate[50],
    borderRadius: 20,
    paddingHorizontal: spacing.p4,
    paddingVertical: spacing.py3,
    borderWidth: 1,
    borderColor: colors.slate[200],
  },
  dropdownTriggerText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.slate[800], flex: 1 },
  vehicleDropdownList: {
    maxHeight: 200,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.slate[200],
    marginTop: 4,
    overflow: 'hidden',
  },
  vehicleSelectWrap: { gap: 8 },
  vehicleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: spacing.p4,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[100],
  },
  vehicleOptionSelected: { backgroundColor: colors.sage + '15' },
  vehicleOptionText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.slate[800], flex: 1 },
  modalConfirmBtn: {
    backgroundColor: colors.sage,
    paddingVertical: spacing.p4,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnDisabled: { opacity: 0.7 },
  modalConfirmBtnText: { fontSize: fontSize.base, fontWeight: '800', color: colors.white },
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.p5,
    backgroundColor: colors.slate[50],
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.slate[100],
  },
  driverCardPlaceholder: { padding: spacing.p6, alignItems: 'center', borderRadius: 28, borderWidth: 1, borderColor: colors.slate[200], borderStyle: 'dashed' },
  driverPlaceholder: { flex: 1, paddingVertical: spacing.p4, alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, marginRight: spacing.gap3, backgroundColor: colors.slate[200] },
  avatarSmall: { width: 48, height: 48, borderRadius: 24, marginRight: spacing.gap3, backgroundColor: colors.slate[200] },
  driverInfo: { flex: 1 },
  driverRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  driverName: { fontSize: fontSize.lg, fontWeight: '800', color: colors.slate[800] },
  driverRole: { fontSize: fontSize['11'], fontWeight: '800', color: colors.slate[400], textTransform: 'uppercase', marginTop: 2 },
  vehicleInfo: { fontSize: fontSize.base, fontWeight: '700', color: colors.slate[800], marginTop: 4 },
  vehicleText: { fontSize: fontSize.sm, fontWeight: '800', color: colors.slate[400], marginTop: 2 },
  friendBadge: { backgroundColor: colors.sage + '1A', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  friendBadgeText: { fontSize: fontSize['10'], fontWeight: '800', color: colors.sage },
  friendTag: { fontSize: fontSize['10'], fontWeight: '800', color: colors.sage },
  friendTagSmall: { fontSize: fontSize['10'], fontWeight: '800', color: colors.sage, marginTop: 2 },
  acceptedBadge: { backgroundColor: colors.sage, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  acceptedBadgeText: { fontSize: fontSize.xs, fontWeight: '800', color: colors.white },
  placeholderText: { fontSize: fontSize.base, fontWeight: '700', color: colors.slate[400] },
  passengerGroupsLabelWrap: { marginBottom: spacing.gap4 },
  groupsScroll: { flexDirection: 'row', gap: spacing.gap4, paddingVertical: 4 },
  addGroupBtn: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.gap3,
  },
  addGroupLabel: { fontSize: fontSize['11'], fontWeight: '800', color: colors.slate[500], marginTop: 4, textAlign: 'center' },
  groupChip: { width: 64, alignItems: 'center' },
  groupAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.slate[100], alignItems: 'center', justifyContent: 'center', marginBottom: 4, overflow: 'hidden' },
  groupAvatarImg: { width: 64, height: 64, borderRadius: 32, marginBottom: 4 },
  groupName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.slate[800], textAlign: 'center' },
  groupConfirmed: { fontSize: fontSize['10'], fontWeight: '800', color: colors.sage, marginTop: 2 },
  groupPending: { color: colors.slate[400] },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.p4,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.slate[50],
    marginBottom: spacing.gap2,
  },
  passengerInfo: { flex: 1 },
  passengerName: { fontSize: fontSize.base, fontWeight: '700', color: colors.slate[800] },
  noPassengers: { fontSize: fontSize.sm, color: colors.slate[400], textAlign: 'center', paddingVertical: spacing.p6 },
  completedBadge: {
    alignSelf: 'center',
    paddingHorizontal: spacing.p4,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.slate[100],
    marginBottom: spacing.p6,
  },
  completedBadgeText: { fontSize: fontSize['10'], fontWeight: '800', color: colors.slate[400], textTransform: 'uppercase' },
  originDestRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.gap4, marginBottom: spacing.gap2 },
  originDestTitle: { fontSize: fontSize['2xl'], fontWeight: '800', color: colors.slate[900] },
  completedDate: { fontSize: fontSize.sm, fontWeight: '700', color: colors.sage, textAlign: 'center', marginBottom: spacing.p6 },
  errorTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.slate[800], marginBottom: 8, textAlign: 'center' },
  errorSub: { fontSize: fontSize.sm, color: colors.slate[400], textAlign: 'center', marginBottom: spacing.p8 },
  backBtnFull: { width: '100%', backgroundColor: colors.sage, paddingVertical: spacing.p4, borderRadius: 20 },
  backBtnFullText: { fontSize: fontSize.base, fontWeight: '800', color: colors.white, textAlign: 'center' },
  inviteIconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: colors.sage + '1A', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.p6 },
  inviteTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.slate[900], marginBottom: 8 },
  inviteSub: { fontSize: fontSize.sm, color: colors.slate[500], textAlign: 'center', marginBottom: spacing.p6 },
  primaryBtn: { width: '100%', backgroundColor: colors.sage, paddingVertical: spacing.p4, borderRadius: 24, alignItems: 'center', marginBottom: spacing.gap3 },
  primaryBtnText: { fontSize: fontSize.lg, fontWeight: '800', color: colors.white },
  secondaryBtn: { width: '100%', paddingVertical: spacing.py3 },
  secondaryBtnText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.slate[500], textAlign: 'center' },
  startTripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.sage + '1A',
    paddingVertical: 10,
    paddingHorizontal: spacing.p5,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  startTripRowText: { fontSize: fontSize['10'], fontWeight: '800', color: colors.sage, textTransform: 'uppercase' },
});
