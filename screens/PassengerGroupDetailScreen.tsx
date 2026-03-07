import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
  Platform,
  Modal,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from '../src/components/Icon';
import { useApp } from '../context/AppState';
import { useUserGroup, useUpdateUserGroup, useTrip } from '../src/hooks/useTrips';
import { colors, fontSize, spacing, borderRadius } from '../src/theme';

const DEFAULT_AVATAR = 'https://picsum.photos/seed/user/200';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function countdownText(pickupTimeMs: number, lang: string): string {
  const now = Date.now();
  const diff = pickupTimeMs - now;
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

export default function PassengerGroupDetailScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {
    lang,
    t,
    user,
    friendIds,
    nicknames,
    selectedGroupArn,
    selectedTripId,
    setSelectedMemberId,
    setMemberProfileSource,
    invitationDetails,
  } = useApp();
  const { data: group, isLoading } = useUserGroup(selectedGroupArn);
  const tripArnToLoad = selectedTripId ?? group?.tripArn ?? null;
  const { data: trip } = useTrip(tripArnToLoad);
  const updateGroupMutation = useUpdateUserGroup();

  const currentUserId = user?.userArn ?? user?.id ?? null;
  const isInGroup =
    !!currentUserId &&
    !!group?.users?.some((u) => u.userId === currentUserId || u.userId === (user?.userArn ?? user?.id));
  const driverParticipant = trip?.participants?.find((p) => p.isDriver);
  const normalizeId = (id: string | undefined) => (id ?? '').replace(/^user:/i, '').trim().toLowerCase();
  const isDriver =
    !!trip &&
    (trip.isDriver === true ||
      (!!currentUserId &&
        (normalizeId(trip.createdBy) === normalizeId(currentUserId) ||
          (!!driverParticipant &&
            (driverParticipant.user?.id === currentUserId ||
              driverParticipant.user?.userArn === currentUserId ||
              normalizeId(driverParticipant.user?.id ?? driverParticipant.user?.userArn) === normalizeId(currentUserId))))));
  const isDriverInvitationView = invitationDetails?.type === 'driver';
  const canEditGroup = !isDriverInvitationView && (isInGroup || isDriver);
  const showShareButton = !isDriverInvitationView && (isInGroup || isDriver);

  const [isEditing, setIsEditing] = useState(false);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupDateObj, setPickupDateObj] = useState<Date>(() => new Date());
  const [showDateTimeModal, setShowDateTimeModal] = useState(false);
  const [calendarViewMonth, setCalendarViewMonth] = useState(() => new Date());
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (group) {
      setPickup(group.start);
      setDropoff(group.destination);
      const d = new Date(group.pickupTime);
      setPickupDateObj(d);
      setPickupDate(d.toISOString().split('T')[0]);
      const HH = d.getHours().toString().padStart(2, '0');
      const mm = d.getMinutes().toString().padStart(2, '0');
      setPickupTime(`${HH}:${mm}`);
      setGroupName(group.groupName);
    }
  }, [group]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.sage} />
        <Text style={styles.loadingText}>
          {lang === 'zh' ? '加载小组详情...' : 'Loading Group Details...'}
        </Text>
      </View>
    );
  }

  if (!group) return null;

  const groupMembers = (group.users || []).map((u) => ({
    id: u.userId,
    name: u.name,
    avatar: u.imageUrl || DEFAULT_AVATAR,
    status: u.accept ? 'accepted' : 'pending',
    hasAccount: true,
  }));

  const handleSave = async () => {
    if (!selectedGroupArn) return;
    try {
      const parts = pickupTime.split(':');
      const hours = Math.min(23, Math.max(0, parseInt(parts[0], 10) || 0));
      const minutes = Math.min(59, Math.max(0, parseInt(parts[1], 10) || 0));
      const newDate = new Date(pickupDate || pickupDateObj.toISOString().split('T')[0]);
      if (isNaN(newDate.getTime())) newDate.setTime(Date.now());
      newDate.setHours(hours, minutes, 0, 0);

      await updateGroupMutation.mutateAsync({
        groupArn: selectedGroupArn,
        params: {
          groupName,
          start: pickup,
          destination: dropoff,
          pickupTime: newDate.getTime(),
        },
      });
      setIsEditing(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleMemberClick = (member: { id: string; hasAccount: boolean }) => {
    if (!isEditing && member.hasAccount) {
      setSelectedMemberId(member.id);
      setMemberProfileSource('passenger_group_detail');
      (navigation.getParent() as any)?.navigate('Friends', {
        screen: 'MemberProfile',
        params: { memberId: member.id, source: 'passenger_group_detail', avatarUrl: member.avatar, displayName: nicknames[member.id] || member.name },
      });
    }
  };

  const handleRemoveMember = async (member: { id: string }) => {
    if (!selectedGroupArn || !group || member.id === currentUserId) return;
    try {
      const newUsers = (group.users ?? []).filter((u) => u.userId !== member.id);
      await updateGroupMutation.mutateAsync({
        groupArn: selectedGroupArn,
        params: { users: newUsers },
      });
    } catch {
      // Error handled by mutation
    }
  };

  const onShare = () => {
    if (tripArnToLoad && selectedGroupArn) {
      navigation.navigate('ShareTrip', { tripId: tripArnToLoad, groupArn: selectedGroupArn });
    }
  };

  const onAddMember = () => {
    navigation.navigate('AddMemberSelection');
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.p4 }]}>
        <View style={styles.headerLeft}>
          {isEditing ? (
            <Pressable
              onPress={() => {
                setIsEditing(false);
                if (group) {
                  setPickup(group.start);
                  setDropoff(group.destination);
                  const d = new Date(group.pickupTime);
                  setPickupDateObj(d);
                  setPickupDate(d.toISOString().split('T')[0]);
                  setPickupTime(d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0'));
                  setGroupName(group.groupName);
                }
              }}
              style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
            >
              <Icon name="close" size={20} color={colors.white} />
            </Pressable>
          ) : (
            <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
              <Icon name="arrow_back_ios_new" size={20} color={colors.white} />
            </Pressable>
          )}
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1} pointerEvents="none">
            {lang === 'zh' ? '乘客小组' : 'Passenger Group'}
          </Text>
        </View>
        <View style={styles.headerRight}>
          {showShareButton && (
            <Pressable onPress={onShare} style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}>
              <Icon name="share" size={20} color={colors.white} />
            </Pressable>
          )}
          {canEditGroup && (
            <Pressable
              onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
              disabled={isEditing && updateGroupMutation.isPending}
              style={({ pressed }) => [styles.headerBtn, pressed && styles.pressed]}
            >
              <Icon name={isEditing ? 'check_circle' : 'edit_square'} size={20} color={colors.white} />
            </Pressable>
          )}
          {!showShareButton && !canEditGroup && <View style={styles.headerSpacer} />}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.scrollContentInner}>
        {/* Trip ID + date + countdown - same layout as Trip Detail */}
        {trip?.id && (
          <View style={styles.tripIdWrap}>
            <View style={styles.tripIdBadge}>
              <Text style={styles.tripIdBadgeText} numberOfLines={1}>
                {lang === 'zh' ? `行程ID  ${trip.id}` : `TRIP ID  ${trip.id}`}
              </Text>
            </View>
          </View>
        )}
        <Text style={styles.dateTitle}>
          {isEditing
            ? (pickupDate
                ? new Date(pickupDateObj).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : (lang === 'zh' ? '选择日期' : 'Select date')) +
              ' ' +
              (() => {
                const [h, m] = (pickupTime || '00:00').split(':').map(Number);
                const d = new Date(2000, 0, 1, isNaN(h) ? 0 : h, isNaN(m) ? 0 : m, 0, 0);
                return d.toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
              })()
            : new Date(group.pickupTime).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) +
              ' ' +
              new Date(group.pickupTime).toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
        </Text>
        {countdownText(group.pickupTime, lang) ? <Text style={styles.countdownText}>{countdownText(group.pickupTime, lang)}</Text> : null}

        {/* ROUTE - same style as Trip Detail: 2 locations with (pick up point) / (drop off point) */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>{lang === 'zh' ? '路线' : 'ROUTE'}</Text>
          </View>
          <View style={styles.timeline}>
            <View style={styles.timelineRow}>
              <Icon name="location_on" size={24} color={colors.sage} />
              <View style={styles.timelineContent}>
                {isEditing ? (
                  <TextInput value={pickup} onChangeText={setPickup} style={styles.timelineInput} placeholder={lang === 'zh' ? '接送点' : 'Pick up point'} />
                ) : (
                  <Text style={styles.timelineNameFirst}>{pickup}</Text>
                )}
                <Text style={styles.timelineAnnotation}>{lang === 'zh' ? '(接送点)' : '(pick up point)'}</Text>
              </View>
            </View>
            <View style={styles.timelineRow}>
              <Icon name="location_on" size={24} color={colors.slate[300]} />
              <View style={styles.timelineContent}>
                {isEditing ? (
                  <TextInput value={dropoff} onChangeText={setDropoff} style={styles.timelineInput} placeholder={lang === 'zh' ? '送达点' : 'Drop off point'} />
                ) : (
                  <Text style={styles.timelineName}>{dropoff}</Text>
                )}
                <Text style={styles.timelineAnnotation}>{lang === 'zh' ? '(送达点)' : '(drop off point)'}</Text>
              </View>
            </View>
          </View>
          {isEditing && (
            <Pressable style={styles.dateTimeEditRow} onPress={() => { setCalendarViewMonth(new Date(pickupDateObj)); setShowDateTimeModal(true); }}>
              <Text style={styles.dateTimeEditLabel}>{lang === 'zh' ? '出发时间' : 'Pick up time'}</Text>
              <Text style={styles.dateTimeEditValue}>
                {pickupDate
                  ? pickupDateObj.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                  : (lang === 'zh' ? '选择日期' : 'Select date')}{' · '}
                {(() => {
                  const [h, m] = (pickupTime || '00:00').split(':').map(Number);
                  const d = new Date(2000, 0, 1, isNaN(h) ? 0 : h, isNaN(m) ? 0 : m, 0, 0);
                  return d.toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                })()}
              </Text>
              <Icon name="chevron_right" size={20} color={colors.slate[400]} />
            </Pressable>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.groupNameLabelWrap}>
            {isEditing ? (
              <TextInput
                value={groupName}
                onChangeText={setGroupName}
                style={styles.groupNameLabelInput}
                placeholder={lang === 'zh' ? '小组名称' : 'Group name'}
              />
            ) : (
              <Text style={styles.groupNameLabel} numberOfLines={1}>{groupName}</Text>
            )}
          </View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>
              {lang === 'zh' ? `成员名单 (${groupMembers.length})` : `MEMBERS (${groupMembers.length})`}
            </Text>
            {isEditing && (
              <Pressable onPress={onAddMember} style={({ pressed }) => [styles.addMemberBtn, pressed && styles.pressed]}>
                <Icon name="person_add" size={14} color={colors.sage} />
                <Text style={styles.addMemberText}>{lang === 'zh' ? '添加成员' : 'ADD MEMBER'}</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.memberListBg}>
          {groupMembers.map((m) => {
            const isFriend = friendIds.has(m.id);
            const nickname = nicknames[m.id];
            const isSelf = m.id === currentUserId;
            const showMinus = isEditing && !isSelf;
            return (
              <Pressable
                key={m.id}
                onPress={() => handleMemberClick(m)}
                style={[styles.memberRow, isEditing && styles.memberRowEditing]}
              >
                <View style={styles.memberLeft}>
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
                    {!isEditing && (
                      <Text style={[styles.memberStatus, m.status === 'accepted' ? styles.statusAccepted : styles.statusPending]}>
                        {m.status === 'accepted'
                          ? lang === 'zh'
                            ? '已接受'
                            : 'ACCEPTED'
                          : lang === 'zh'
                            ? '待确认'
                            : 'PENDING'}
                      </Text>
                    )}
                  </View>
                </View>
                {showMinus && (
                  <Pressable
                    onPress={() => handleRemoveMember(m)}
                    style={({ pressed }) => [styles.removeMemberBtn, pressed && styles.pressed]}
                  >
                    <Icon name="remove" size={20} color={colors.rose[500]} />
                  </Pressable>
                )}
              </Pressable>
            );
          })}
          </View>
        </View>
        </View>
      </ScrollView>

      <Modal visible={showDateTimeModal} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDateTimeModal(false)}>
          <Pressable style={styles.dateTimeModalContent} onPress={() => {}}>
            <View style={styles.dateTimeModalHeader}>
              <Text style={styles.dateTimeModalTitle}>
                {lang === 'zh' ? '日期与时间' : 'Date & Time'}
              </Text>
              <Pressable
                onPress={() => setShowDateTimeModal(false)}
                style={({ pressed }) => [styles.dateTimeConfirmTick, pressed && styles.pressed]}
              >
                <Icon name="check" size={24} color={colors.white} />
              </Pressable>
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
                  <Text key={w} style={styles.weekdayCell}>
                    {w}
                  </Text>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {getCalendarDays(
                  calendarViewMonth.getFullYear(),
                  calendarViewMonth.getMonth(),
                  pickupDateObj
                ).map((cell, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      if (cell.date && !cell.isDisabled) {
                        setPickupDateObj(cell.date);
                        setPickupDate(cell.date.toISOString().split('T')[0]);
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
                    const [h, m] = pickupTime.split(':').map(Number);
                    const d = new Date(pickupDateObj);
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
                      setPickupTime(`${HH}:${mm}`);
                    }
                  }}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white },
  loadingText: { marginTop: 12, fontSize: fontSize.sm, fontWeight: '600', color: colors.slate[500] },
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
  headerLeft: { width: 88, flexDirection: 'row', alignItems: 'center', zIndex: 1 },
  headerCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', marginHorizontal: spacing.gap2 },
  headerRight: { width: 88, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, zIndex: 1 },
  headerTitle: {
    fontSize: fontSize.base,
    fontWeight: '800',
    letterSpacing: -0.5,
    textTransform: 'uppercase',
    color: colors.white,
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
  pressed: { opacity: 0.9 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.p6, paddingBottom: 24 },
  scrollContentInner: {},
  groupNameLabelWrap: { marginBottom: spacing.p5 },
  groupNameLabel: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.sage,
  },
  groupNameLabelInput: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.sage,
    backgroundColor: colors.slate[50],
    borderRadius: 8,
    paddingHorizontal: spacing.p3,
    paddingVertical: 6,
    minHeight: 44,
  },
  section: { marginBottom: spacing.p8 },
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
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.gap3 },
  timeline: { marginLeft: 4 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.p6 },
  timelineContent: { flex: 1, marginLeft: spacing.gap3 },
  timelineName: { fontSize: fontSize.base, fontWeight: '800', color: colors.slate[500] },
  timelineNameFirst: { fontSize: fontSize.xl, fontWeight: '800', color: colors.slate[900] },
  timelineAnnotation: { fontSize: fontSize['11'], fontWeight: '700', color: colors.slate[400], marginTop: 2 },
  timelineInput: {
    fontSize: fontSize.base,
    fontWeight: '800',
    color: colors.slate[800],
    backgroundColor: colors.slate[50],
    borderRadius: 8,
    paddingHorizontal: spacing.p3,
    paddingVertical: 6,
    minHeight: 36,
  },
  dateTimeEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.p4,
    paddingVertical: spacing.p4,
    paddingHorizontal: spacing.p4,
    minHeight: 52,
    backgroundColor: colors.slate[50],
    borderRadius: 12,
  },
  dateTimeEditLabel: { fontSize: fontSize['11'], fontWeight: '800', color: colors.slate[400], textTransform: 'uppercase', marginRight: spacing.gap3 },
  dateTimeEditValue: { flex: 1, fontSize: fontSize.base, fontWeight: '700', color: colors.slate[800] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.p4 },
  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    color: colors.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  memberListBg: {
    backgroundColor: colors.slate[50],
    borderRadius: 16,
    padding: spacing.p4,
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.sage + '1A',
    paddingHorizontal: spacing.p5,
    paddingVertical: 10,
    minHeight: 40,
    borderRadius: borderRadius.full,
  },
  addMemberText: { fontSize: fontSize['11'], fontWeight: '800', color: colors.sage, textTransform: 'uppercase' },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.p4,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 0,
  },
  memberRowEditing: { borderWidth: 1, borderColor: colors.sage + '33' },
  removeMemberBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.rose[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: { marginLeft: spacing.p4, flex: 1 },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberName: { fontSize: fontSize.base, fontWeight: '700', color: colors.slate[800] },
  friendBadge: { backgroundColor: colors.sageLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  friendBadgeText: { fontSize: fontSize['10'], fontWeight: '800', color: colors.sage },
  memberStatus: { fontSize: fontSize['10'], fontWeight: '800', textTransform: 'uppercase', marginTop: 2 },
  statusAccepted: { color: colors.sage },
  statusPending: { color: colors.amber[500] },
  logisticsLabel: {
    fontSize: fontSize['10'],
    fontWeight: '800',
    color: colors.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    marginTop: spacing.p4,
  },
  logisticsValue: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.slate[800],
    marginBottom: 2,
  },
  logisticsLabelFirst: { marginTop: 0 },
  label: {
    fontSize: fontSize['10'],
    fontWeight: '800',
    color: colors.slate[300],
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  value: { fontSize: fontSize.base, fontWeight: '700', color: colors.slate[800], marginBottom: spacing.p4 },
  input: {
    backgroundColor: colors.slate[50],
    borderRadius: borderRadius.ios,
    paddingHorizontal: spacing.p5,
    paddingVertical: spacing.p4,
    minHeight: 48,
    justifyContent: 'center',
    marginBottom: spacing.p4,
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.slate[800],
  },
  inputText: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.slate[800],
  },
  datetimeRow: { gap: spacing.gap3, marginBottom: spacing.p4 },
  datetimeWrap: { gap: spacing.gap3, marginBottom: spacing.p4 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
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
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
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
  calendarDaySelected: {
    backgroundColor: colors.sage,
  },
  calendarDayToday: {
    backgroundColor: colors.slate[200],
  },
  calendarDayDisabled: {
    opacity: 0.4,
  },
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
  calendarDayTextSelected: {
    color: colors.white,
  },
  calendarDayTextDisabled: {
    color: colors.slate[400],
  },
  timeLabel: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    color: colors.slate[400],
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  pickerWrapper: {
    minHeight: 220,
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: spacing.p4,
    overflow: 'hidden',
  },
  dateTimeConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.sage,
    paddingVertical: spacing.py2,
    paddingHorizontal: spacing.p5,
    borderRadius: borderRadius.ios,
    marginTop: spacing.p4,
  },
  dateTimeConfirmText: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.white,
  },
  inputHalf: { flex: 1 },
  timeRow: { flexDirection: 'row', gap: 8 },
});
