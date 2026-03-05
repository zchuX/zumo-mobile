import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from '../src/components/Icon';
import { useApp } from '../context/AppState';
import { useCreateTrip } from '../src/hooks/useTrips';
import type { Vehicle } from '../src/types';
import { colors, fontSize, spacing, borderRadius } from '../src/theme';

export default function CreateTripScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t, lang, user, vehicles, setSelectedTripId } = useApp();
  const createTripMutation = useCreateTrip();

  const [step, setStep] = useState<'selection' | 'form'>('selection');
  const [role, setRole] = useState<'driver' | 'passenger'>('driver');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState('08:30');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(vehicles[0] ?? null);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [tempHour, setTempHour] = useState('08');
  const [tempMin, setTempMin] = useState('30');
  const [groupName, setGroupName] = useState(lang === 'zh' ? '拼车小组' : 'Carpool Group');

  const handleSubmit = async () => {
    if (!origin.trim() || !destination.trim()) {
      Alert.alert(lang === 'zh' ? '请填写起点和终点' : 'Please fill in origin and destination');
      return;
    }
    const [hours, minutes] = selectedTime.split(':');
    const startTimeDate = new Date(date);
    startTimeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
    const startTimeTimestamp = startTimeDate.getTime();

    const userId = (user?.userArn ?? user?.id) as string;
    const groupUsers = [
      { userId, name: user?.name ?? 'User', imageUrl: user?.avatar, accept: true },
    ];

    try {
      const newTrip = await createTripMutation.mutateAsync({
        startTime: startTimeTimestamp,
        start: role === 'driver' ? origin : undefined,
        destination: role === 'driver' ? destination : undefined,
        notes: '',
        driver: role === 'driver' ? userId : undefined,
        car:
          role === 'driver' && selectedVehicle
            ? {
                plateNumber: selectedVehicle.licensePlate,
                color: selectedVehicle.color,
                model: selectedVehicle.model,
              }
            : null,
        groups:
          role === 'passenger'
            ? [
                {
                  groupArn: '',
                  tripArn: '',
                  groupName,
                  start: origin,
                  destination,
                  pickupTime: startTimeTimestamp,
                  version: 1,
                  users: groupUsers,
                },
              ]
            : [],
      });
      setSelectedTripId(newTrip.tripArn);
      (navigation as any).navigate('Trips', {
        screen: 'TripDetail',
        params: { tripId: newTrip.tripArn, title: t.tripDetail ?? 'Trip Detail' },
      });
    } catch {
      Alert.alert(lang === 'zh' ? '创建行程失败' : 'Failed to create trip');
    }
  };

  const openTimeModal = () => {
    const [h, m] = selectedTime.split(':');
    setTempHour(h);
    setTempMin(m);
    setShowTimeModal(true);
  };
  const confirmTime = () => {
    setSelectedTime(`${tempHour.padStart(2, '0')}:${tempMin.padStart(2, '0')}`);
    setShowTimeModal(false);
  };

  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  if (step === 'selection') {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
            <Icon name="chevron_left" size={28} color={colors.slate[600]} />
          </Pressable>
        </View>
        <Text style={styles.title}>{t.findCarOrPeople}</Text>
        <Text style={styles.subtitle}>{t.findCarOrPeopleSub}</Text>

        <View style={styles.selectionWrap}>
          <Pressable
            onPress={() => setRole('driver')}
            style={[styles.roleCard, role === 'driver' && styles.roleCardActive]}
          >
            <View style={[styles.roleIconWrap, role === 'driver' && styles.roleIconWrapActive]}>
              <Icon name="emoji_people" size={32} color={role === 'driver' ? colors.white : colors.slate[300]} />
            </View>
            <Text style={[styles.roleTitle, role === 'driver' && styles.roleTitleActive]}>{t.lookingForPeople}</Text>
            <Text style={styles.roleSub}>{t.lookingForPeopleSub}</Text>
          </Pressable>
          <Pressable
            onPress={() => setRole('passenger')}
            style={[styles.roleCard, role === 'passenger' && styles.roleCardActive]}
          >
            <View style={[styles.roleIconWrap, role === 'passenger' && styles.roleIconWrapActive]}>
              <Icon name="person" size={32} color={role === 'passenger' ? colors.white : colors.slate[300]} />
            </View>
            <Text style={[styles.roleTitle, role === 'passenger' && styles.roleTitleActive]}>{t.lookingForCar}</Text>
            <Text style={styles.roleSub}>{t.lookingForCarSub}</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => setStep('form')} style={styles.nextBtn}>
          <Text style={styles.nextBtnText}>{t.next}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.formHeader, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => setStep('selection')} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
          <Icon name="arrow_back_ios_new" size={22} color={colors.slate[600]} />
        </Pressable>
        <Text style={styles.formHeaderTitle}>{t.initiateTrip}</Text>
        <View style={styles.formHeaderBadge}>
          <Text style={styles.formHeaderBadgeText}>{role === 'driver' ? t.driverModeTag : t.passengerModeTag}</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {role === 'driver' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              {t.selectVehicle} <Text style={styles.optional}>({t.optional})</Text>
            </Text>
            <Pressable
              onPress={() => setShowVehicleDropdown(!showVehicleDropdown)}
              style={[styles.dropdown, showVehicleDropdown && styles.dropdownOpen]}
            >
              <View style={styles.dropdownLeft}>
                <View style={styles.dropdownIconWrap}>
                  <Icon name={selectedVehicle ? 'directions_car' : 'no_crash'} size={24} color={colors.sage} />
                </View>
                <View>
                  <Text style={styles.dropdownTitle}>
                    {selectedVehicle ? `${selectedVehicle.brand} ${selectedVehicle.model}` : lang === 'zh' ? '暂未选定车辆' : 'Empty / TBD'}
                  </Text>
                  {selectedVehicle && (
                    <Text style={styles.dropdownSub}>{selectedVehicle.licensePlate}</Text>
                  )}
                </View>
              </View>
              <Icon name="expand_more" size={24} color={colors.slate[300]} />
            </Pressable>
            {showVehicleDropdown && (
              <View style={styles.dropdownList}>
                <Pressable
                  onPress={() => { setSelectedVehicle(null); setShowVehicleDropdown(false); }}
                  style={styles.dropdownRow}
                >
                  <View style={styles.dropdownRowIcon}>
                    <Icon name="no_crash" size={20} color={colors.slate[400]} />
                  </View>
                  <Text style={styles.dropdownRowText}>{lang === 'zh' ? '不选车辆 / 待定' : 'Empty / TBD'}</Text>
                  {!selectedVehicle && <Icon name="check" size={18} color={colors.sage} />}
                </Pressable>
                {vehicles.map((v) => (
                  <Pressable
                    key={v.id}
                    onPress={() => { setSelectedVehicle(v); setShowVehicleDropdown(false); }}
                    style={styles.dropdownRow}
                  >
                    <View style={styles.dropdownRowIcon} />
                    <View>
                      <Text style={styles.dropdownRowText}>{v.brand} {v.model}</Text>
                      <Text style={styles.dropdownRowSub}>{v.licensePlate}</Text>
                    </View>
                    {selectedVehicle?.id === v.id && <Icon name="check" size={18} color={colors.sage} />}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        )}

        {role === 'passenger' && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{t.configureGroup}</Text>
            <View style={styles.groupCard}>
              <TextInput
                style={styles.groupNameInput}
                value={groupName}
                onChangeText={setGroupName}
                placeholder={lang === 'zh' ? '小组名称' : 'Group name'}
                placeholderTextColor={colors.slate[300]}
              />
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.row2}>
            <View style={styles.half}>
              <Text style={styles.sectionLabel}>{t.date}</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.slate[300]}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.sectionLabel}>{t.time}</Text>
              <Pressable onPress={openTimeModal} style={styles.timeBtn}>
                <Text style={styles.timeBtnText}>{selectedTime}</Text>
                <Icon name="schedule" size={20} color={colors.slate[400]} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t.startLocation}</Text>
          <TextInput
            style={styles.input}
            value={origin}
            onChangeText={setOrigin}
            placeholder={t.cityDistrictPlaceholder}
            placeholderTextColor={colors.slate[300]}
          />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t.endLocation}</Text>
          <TextInput
            style={styles.input}
            value={destination}
            onChangeText={setDestination}
            placeholder={t.cityDistrictPlaceholder}
            placeholderTextColor={colors.slate[300]}
          />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          onPress={handleSubmit}
          disabled={createTripMutation.isPending}
          style={[styles.submitBtn, createTripMutation.isPending && styles.submitBtnDisabled]}
        >
          {createTripMutation.isPending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>{t.confirmAndGenerate}</Text>
          )}
        </Pressable>
      </View>

      <Modal visible={showTimeModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowTimeModal(false)}>
          <View style={styles.timeModalContent}>
            <View style={styles.timeModalHeader}>
              <Text style={styles.timeModalTitle}>{t.time}</Text>
              <Pressable onPress={confirmTime}>
                <Text style={styles.timeModalDone}>{lang === 'en' ? 'Done' : '完成'}</Text>
              </Pressable>
            </View>
            <View style={styles.timePickers}>
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                {hours.map((h) => (
                  <Pressable key={h} onPress={() => setTempHour(h)} style={styles.pickerRow}>
                    <Text style={tempHour === h ? styles.pickerRowSelected : styles.pickerRowText}>{h}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <Text style={styles.timeColon}>:</Text>
              <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                {minutes.map((m) => (
                  <Pressable key={m} onPress={() => setTempMin(m)} style={styles.pickerRow}>
                    <Text style={tempMin === m ? styles.pickerRowSelected : styles.pickerRowText}>{m}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: { paddingHorizontal: spacing.p8, marginBottom: spacing.p4 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.9 },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    color: colors.slate[900],
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: spacing.p6,
  },
  subtitle: { fontSize: fontSize.xs, fontWeight: '500', color: colors.slate[400], textAlign: 'center', paddingHorizontal: spacing.p6, marginBottom: spacing.p6 },
  selectionWrap: { flex: 1, paddingHorizontal: spacing.p8, gap: spacing.gap4 },
  roleCard: {
    padding: spacing.p6,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: colors.slate[100],
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  roleCardActive: { borderColor: colors.sage, backgroundColor: colors.sage + '0D' },
  roleIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  roleIconWrapActive: { backgroundColor: colors.sage },
  roleTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.slate[900], marginBottom: 4 },
  roleTitleActive: { color: colors.sage },
  roleSub: { fontSize: fontSize['10'], fontWeight: '700', color: colors.slate[400], textTransform: 'uppercase' },
  nextBtn: {
    marginHorizontal: spacing.p8,
    marginTop: spacing.p6,
    paddingVertical: spacing.p4,
    borderRadius: 24,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnText: { fontSize: fontSize.lg, fontWeight: '800', color: colors.white, textTransform: 'uppercase', letterSpacing: 2 },

  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.p4,
    paddingBottom: spacing.py3,
    borderBottomWidth: 1,
    borderBottomColor: colors.slate[50],
  },
  formHeaderTitle: { fontSize: fontSize.base, fontWeight: '800', color: colors.slate[900], marginLeft: spacing.gap3 },
  formHeaderBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.slate[100],
    borderRadius: 8,
  },
  formHeaderBadgeText: { fontSize: 9, fontWeight: '800', color: colors.slate[400], textTransform: 'uppercase' },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.p6 },
  section: { marginBottom: spacing.p6 },
  sectionLabel: { fontSize: fontSize.xs, fontWeight: '800', color: colors.slate[900], marginLeft: 4, marginBottom: 8 },
  optional: { fontSize: fontSize['10'], fontWeight: '700', color: colors.slate[300] },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.p4,
    backgroundColor: colors.slate[50],
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.slate[100],
  },
  dropdownOpen: { borderColor: colors.sage },
  dropdownLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.gap4 },
  dropdownIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownTitle: { fontSize: fontSize.sm, fontWeight: '800', color: colors.slate[800] },
  dropdownSub: { fontSize: 9, fontWeight: '800', color: colors.slate[400], textTransform: 'uppercase' },
  dropdownList: {
    marginTop: 8,
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.slate[100],
    paddingVertical: 8,
    maxHeight: 240,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.p4,
    paddingVertical: spacing.gap3,
    gap: spacing.gap4,
  },
  dropdownRowIcon: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.slate[100] },
  dropdownRowText: { flex: 1, fontSize: fontSize.sm, fontWeight: '700', color: colors.slate[800] },
  dropdownRowSub: { fontSize: 9, fontWeight: '800', color: colors.slate[400] },
  groupCard: {
    padding: spacing.p4,
    backgroundColor: colors.slate[50],
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.slate[100],
  },
  groupNameInput: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.slate[800],
    marginBottom: spacing.gap3,
    paddingVertical: 4,
  },
  row2: { flexDirection: 'row', gap: spacing.gap4 },
  half: { flex: 1 },
  input: {
    height: 48,
    paddingHorizontal: spacing.p4,
    backgroundColor: colors.slate[50],
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.slate[100],
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.slate[800],
  },
  timeBtn: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.p4,
    backgroundColor: colors.slate[50],
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.slate[100],
  },
  timeBtnText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.slate[800] },
  footer: {
    paddingHorizontal: spacing.p6,
    paddingTop: spacing.p4,
    borderTopWidth: 1,
    borderTopColor: colors.slate[50],
    backgroundColor: colors.white,
  },
  submitBtn: {
    paddingVertical: spacing.p4,
    borderRadius: 24,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { fontSize: fontSize.lg, fontWeight: '800', color: colors.white, textTransform: 'uppercase' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  timeModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  timeModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.p5 },
  timeModalTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.slate[900] },
  timeModalDone: { fontSize: fontSize.base, fontWeight: '700', color: colors.sage },
  timePickers: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.p8 },
  pickerScroll: { maxHeight: 200 },
  pickerRow: { paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center' },
  pickerRowText: { fontSize: fontSize.base, color: colors.slate[500] },
  pickerRowSelected: { fontSize: fontSize.lg, fontWeight: '800', color: colors.sage },
  timeColon: { fontSize: fontSize['2xl'], fontWeight: '800', color: colors.slate[400], marginHorizontal: 8 },
});
