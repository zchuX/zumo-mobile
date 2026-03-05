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
  const canEditGroup = isInGroup || isDriver;
  const showShareButton = isInGroup || isDriver;

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
        params: { memberId: member.id, source: 'passenger_group_detail' },
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
    navigation.navigate('ShareTrip');
  };

  const onAddMember = () => {
    navigation.navigate('AddMemberSelection');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <View style={[styles.header, { top: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
          <Icon name="arrow_back_ios_new" size={24} color={colors.slate[800]} />
        </Pressable>
        <View style={styles.headerRight}>
          {showShareButton && (
            <Pressable onPress={onShare} style={({ pressed }) => [styles.headerIconBtn, pressed && styles.pressed]}>
              <Icon name="share" size={22} color={colors.slate[600]} />
            </Pressable>
          )}
          {canEditGroup && (
            <Pressable
              onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
              disabled={isEditing && updateGroupMutation.isPending}
              style={[styles.editBtn, isEditing && styles.editBtnActive]}
            >
              <Icon name={isEditing ? 'check_circle' : 'edit_square'} size={22} color={isEditing ? colors.sage : colors.slate[400]} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {isEditing ? (
            <TextInput
              value={groupName}
              onChangeText={setGroupName}
              style={styles.groupNameInput}
              placeholder={lang === 'zh' ? '小组名称' : 'Group name'}
            />
          ) : (
            <Text style={styles.groupName} numberOfLines={1}>{groupName}</Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {lang === 'zh' ? `成员名单 (${groupMembers.length})` : `MEMBERS (${groupMembers.length})`}
            </Text>
            {isEditing && (
              <Pressable onPress={onAddMember} style={({ pressed }) => [styles.addMemberBtn, pressed && styles.pressed]}>
                <Icon name="person_add" size={14} color={colors.sage} />
                <Text style={styles.addMemberText}>{lang === 'zh' ? '添加成员' : 'ADD MEMBER'}</Text>
              </Pressable>
            )}
          </View>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{lang === 'zh' ? '行程设置' : 'LOGISTICS'}</Text>
          <View style={styles.logisticsCard}>
            <Text style={styles.label}>{lang === 'zh' ? '接送点' : 'PICKUP'}</Text>
            {isEditing ? (
              <TextInput value={pickup} onChangeText={setPickup} style={styles.input} />
            ) : (
              <Text style={styles.value}>{pickup}</Text>
            )}
            <Text style={styles.label}>{lang === 'zh' ? '送达点' : 'DROP-OFF'}</Text>
            {isEditing ? (
              <TextInput value={dropoff} onChangeText={setDropoff} style={styles.input} />
            ) : (
              <Text style={styles.value}>{dropoff}</Text>
            )}
            <Text style={styles.label}>{lang === 'zh' ? '出发时间' : 'PICKUP TIME'}</Text>
            {isEditing ? (
              <Pressable style={styles.input} onPress={() => { setCalendarViewMonth(new Date(pickupDateObj)); setShowDateTimeModal(true); }}>
                <Text style={styles.inputText}>
                  {pickupDate
                    ? pickupDateObj.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : (lang === 'zh' ? '选择日期' : 'Select date')}
                  {' · '}
                  {(() => {
                    const [h, m] = (pickupTime || '00:00').split(':').map(Number);
                    const d = new Date(2000, 0, 1, isNaN(h) ? 0 : h, isNaN(m) ? 0 : m, 0, 0);
                    return d.toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                  })()}
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.value}>
                {new Date(group.pickupTime).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                {new Date(group.pickupTime).toLocaleTimeString(lang === 'zh' ? 'zh-CN' : 'en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </Text>
            )}
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
  container: { flex: 1, backgroundColor: colors.slate[50] },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white },
  loadingText: { marginTop: 12, fontSize: fontSize.sm, fontWeight: '600', color: colors.slate[500] },
  header: {
    position: 'absolute',
    left: spacing.p6,
    right: spacing.p4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.slate[100],
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.slate[100],
  },
  editBtnActive: { borderColor: colors.sage + '33' },
  pressed: { opacity: 0.9 },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 72, paddingHorizontal: spacing.p6, paddingBottom: 24 },
  card: {
    backgroundColor: colors.white,
    paddingVertical: spacing.p8,
    paddingHorizontal: spacing.p6,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[100],
    marginBottom: spacing.p6,
  },
  groupName: { fontSize: fontSize['2xl'], fontWeight: '800', color: colors.slate[900] },
  groupNameInput: {
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    color: colors.slate[900],
    backgroundColor: colors.slate[50],
    borderRadius: borderRadius.ios,
    paddingHorizontal: spacing.p4,
    paddingVertical: spacing.p4,
    minHeight: 48,
  },
  section: { marginBottom: spacing.p8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.p4 },
  sectionTitle: {
    fontSize: fontSize['11'],
    fontWeight: '800',
    color: colors.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 2,
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
  addMemberText: { fontSize: fontSize['10'], fontWeight: '800', color: colors.sage, textTransform: 'uppercase' },
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
  memberRowEditing: { borderColor: colors.sage + '33' },
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
  memberName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.slate[800] },
  friendBadge: { backgroundColor: colors.sageLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  friendBadgeText: { fontSize: 8, fontWeight: '800', color: colors.sage },
  memberStatus: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', marginTop: 2 },
  statusAccepted: { color: colors.sage },
  statusPending: { color: colors.amber[500] },
  logisticsCard: {
    backgroundColor: colors.white,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.slate[100],
    padding: spacing.p6,
  },
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
