import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { TripsStackParamList } from '../navigation/types';
import Icon from '../src/components/Icon';
import { useApp } from '../context/AppState';
import { useTrip, useUserGroup } from '../src/hooks/useTrips';
import { colors, fontSize, spacing } from '../src/theme';

type ShareTripRoute = RouteProp<TripsStackParamList, 'ShareTrip'>;

export default function ShareTripScreen() {
  const navigation = useNavigation();
  const route = useRoute<ShareTripRoute>();
  const insets = useSafeAreaInsets();
  const { lang, t, selectedTripId, selectedGroupArn } = useApp();
  const params = route.params;
  const tripId = params?.tripId ?? selectedTripId;
  const groupArn = params?.groupArn ?? selectedGroupArn;
  const { data: trip, isLoading: tripLoading } = useTrip(tripId ?? null);
  const { data: group, isLoading: groupLoading } = useUserGroup(groupArn ?? null);

  const isLoading = tripLoading || groupLoading;
  const origin = trip?.origin ?? group?.start ?? '';
  const destination = trip?.destination ?? group?.destination ?? '';
  const groupName = group?.groupName ?? '';
  const groupSize = group?.users?.length ?? 0;
  const pickupLabel = group?.start ?? origin;
  const dropoffLabel = group?.destination ?? destination;

  const shareMessage =
    lang === 'zh'
      ? `${groupName || '行程'} · ${origin} → ${destination}${groupSize > 0 ? ` · ${lang === 'zh' ? '人数' : 'Passengers'}: ${groupSize}` : ''}`
      : `${groupName || 'Trip'} · ${origin} → ${destination}${groupSize > 0 ? ` · Passengers: ${groupSize}` : ''}`;

  const handleSave = async () => {
    try {
      await Share.share({
        message: shareMessage,
        title: lang === 'zh' ? '分享行程' : 'Share Trip',
      });
    } catch (e) {
      if ((e as Error).message !== 'User did not share') {
        Alert.alert(lang === 'zh' ? '分享失败' : 'Share failed');
      }
    }
  };

  const handleCopyLink = () => {
    Alert.alert(
      lang === 'zh' ? '复制链接' : 'Copy Link',
      lang === 'zh' ? '链接功能即将推出。' : 'Link copy coming soon.'
    );
  };

  const handleEmail = () => {
    const subject = encodeURIComponent(lang === 'zh' ? '行程分享' : 'Trip share');
    const body = encodeURIComponent(shareMessage);
    Linking.openURL(`mailto:?subject=${subject}&body=${body}`).catch(() =>
      Alert.alert(lang === 'zh' ? '无法打开邮件' : "Couldn't open email")
    );
  };

  const handleSms = () => {
    Linking.openURL(`sms:?body=${encodeURIComponent(shareMessage)}`).catch(() =>
      Alert.alert(lang === 'zh' ? '无法打开短信' : "Couldn't open messages")
    );
  };

  if (!tripId || !groupArn) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={styles.loadingText}>{lang === 'zh' ? '缺少行程或群组信息' : 'Missing trip or group info'}</Text>
        <Pressable onPress={() => navigation.goBack()} style={[styles.doneBtn, { marginTop: 16 }]}>
          <Text style={styles.doneBtnText}>{lang === 'zh' ? '返回' : 'Back'}</Text>
        </Pressable>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color={colors.sage} />
        <Text style={styles.loadingText}>{t.loading ?? 'Loading...'}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
          <Icon name="arrow_back_ios_new" size={24} color={colors.slate[800]} />
        </Pressable>
        <Text style={styles.headerTitle}>{lang === 'zh' ? '分享行程' : 'Share Trip'}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.cardBrand}>
            <View style={styles.brandBar} />
            <Text style={styles.brandName}>CoRide</Text>
            <View style={styles.detailBadge}>
              <Text style={styles.detailBadgeText}>{lang === 'zh' ? '行程详情' : 'DETAILS'}</Text>
            </View>
          </View>

          <View style={styles.originDestRow}>
            <Text style={styles.originDestText} numberOfLines={1}>{origin || '—'}</Text>
            <Icon name="arrow_forward" size={22} color={colors.slate[200]} />
            <Text style={styles.originDestText} numberOfLines={1}>{destination || '—'}</Text>
          </View>

          {(groupName || groupSize > 0) && (
            <View style={styles.groupRow}>
              <Icon name="group" size={20} color={colors.slate[400]} />
              <Text style={styles.groupText}>
                {groupName ? `${groupName} · ` : ''}{lang === 'zh' ? `人数: ${groupSize}人` : `Passengers: ${groupSize}`}
              </Text>
            </View>
          )}

          <View style={styles.locRow}>
            <Icon name="location_on" size={20} color={colors.sage} />
            <View style={styles.locTextWrap}>
              <Text style={styles.locFrom}>
                {lang === 'zh' ? '起点: ' : 'From: '}{pickupLabel || '—'}
              </Text>
              <Text style={styles.locTo}>
                {lang === 'zh' ? '终点: ' : 'To: '}{dropoffLabel || '—'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.qrWrap}>
            <View style={styles.qrPlaceholder}>
              <Icon name="qr_code_2" size={64} color={colors.slate[200]} />
            </View>
            <Text style={styles.qrLabel}>
              {lang === 'zh' ? '扫码加入行程分享' : 'SCAN TO JOIN TRIP SHARE'}
            </Text>
          </View>
        </View>

        <View style={styles.actionsGrid}>
          <Pressable onPress={handleSave} style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}>
            <Icon name="download" size={28} color={colors.slate[600]} />
            <Text style={styles.actionLabel}>{lang === 'zh' ? '保存截图' : 'SAVE'}</Text>
          </Pressable>
          <Pressable onPress={handleCopyLink} style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}>
            <Icon name="link" size={28} color={colors.slate[600]} />
            <Text style={styles.actionLabel}>{lang === 'zh' ? '复制链接' : 'LINK'}</Text>
          </Pressable>
          <Pressable onPress={handleEmail} style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}>
            <Icon name="mail" size={28} color={colors.slate[600]} />
            <Text style={styles.actionLabel}>{lang === 'zh' ? '邮件' : 'EMAIL'}</Text>
          </Pressable>
          <Pressable onPress={handleSms} style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}>
            <Icon name="chat_bubble" size={28} color={colors.slate[600]} />
            <Text style={styles.actionLabel}>{lang === 'zh' ? '短信' : 'SMS'}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.doneBtn, pressed && styles.pressed]}
        >
          <Text style={styles.doneBtnText}>{lang === 'zh' ? '完成' : 'DONE'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.slate[50] },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: fontSize.sm, fontWeight: '600', color: colors.slate[500] },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.p6,
    paddingBottom: spacing.py3,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.9 },
  headerTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.slate[900] },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.p6, paddingBottom: 24 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 40,
    padding: spacing.p6,
    marginBottom: spacing.p6,
    borderWidth: 1,
    borderColor: colors.slate[50],
  },
  cardBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandBar: { width: 10, height: 24, borderRadius: 5, backgroundColor: colors.sage },
  brandName: { marginLeft: 8, fontSize: 24, fontWeight: '800', color: colors.sage },
  detailBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: colors.slate[100],
    borderRadius: 999,
  },
  detailBadgeText: { fontSize: 10, fontWeight: '800', color: colors.slate[400], letterSpacing: 1 },
  originDestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.p4,
    marginBottom: 24,
  },
  originDestText: { fontSize: 22, fontWeight: '800', color: colors.slate[800], maxWidth: '40%' },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.p4, marginBottom: spacing.p4 },
  groupText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.slate[600], flex: 1 },
  locRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.p4 },
  locTextWrap: { flex: 1 },
  locFrom: { fontSize: fontSize.sm, fontWeight: '700', color: colors.slate[800] },
  locTo: { fontSize: 11, fontWeight: '500', color: colors.slate[300], marginTop: 2 },
  divider: { borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.slate[100], marginVertical: 24 },
  qrWrap: { alignItems: 'center', paddingVertical: spacing.p4 },
  qrPlaceholder: {
    width: 160,
    height: 160,
    borderRadius: 32,
    backgroundColor: colors.slate[50],
    borderWidth: 1,
    borderColor: colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.p4,
  },
  qrLabel: { fontSize: 11, fontWeight: '700', color: colors.slate[300], letterSpacing: 1 },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.p4,
    paddingHorizontal: spacing.p2,
  },
  actionBtn: {
    width: '23%',
    alignItems: 'center',
    gap: 8,
  },
  actionLabel: { fontSize: 10, fontWeight: '800', color: colors.slate[400] },
  footer: {
    paddingHorizontal: spacing.p6,
    paddingTop: spacing.p4,
    paddingBottom: 8,
    backgroundColor: colors.slate[50],
  },
  doneBtn: {
    backgroundColor: colors.sage,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: { fontSize: fontSize.base, fontWeight: '800', color: colors.white, letterSpacing: 1 },
});
