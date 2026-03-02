import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Header from '../src/components/Header';
import Icon from '../src/components/Icon';
import { useApp } from '../context/AppState';
import * as authService from '../src/api/authService';
import { tokenStorage } from '../src/storage';
import { colors, fontSize, spacing, borderRadius } from '../src/theme';

export default function AccountScreen() {
  const navigation = useNavigation();
  const { t, user, setUser, lang } = useApp();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    try {
      const refreshToken = await tokenStorage.getTokenAsync('refreshToken');
      if (refreshToken) await authService.logout(refreshToken);
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      tokenStorage.clearTokensAsync().catch(() => {});
      setUser(null);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 40 }]}>
      <Header
        title={t.account}
        rightElement={
          <Pressable onPress={() => navigation.navigate('Settings')} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
            <Icon name="settings" size={20} color={colors.white} />
          </Pressable>
        }
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: user?.avatar }} style={styles.avatar} />
            <Pressable
              onPress={() => navigation.navigate('ManageAccount')}
              style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
            >
              <Icon name="edit" size={16} color={colors.white} />
            </Pressable>
          </View>
          <Text style={styles.userName}>{user?.name}</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <Text style={styles.statsNum}>128</Text>
            <Text style={styles.statsLabel}>{lang === 'zh' ? '名累计承载乘客' : 'passengers carried'}</Text>
          </View>
          <View style={styles.statsDivider} />
          <View style={styles.statsRow}>
            <Text style={styles.statsNum}>56</Text>
            <Text style={styles.statsLabel}>{lang === 'zh' ? '次累计参与拼车' : 'carpools in total'}</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuLabel}>{lang === 'zh' ? '常规设置' : 'GENERAL'}</Text>
          <View style={styles.menuCard}>
            <Pressable onPress={() => navigation.navigate('ManageAccount')} style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}>
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconBox}>
                  <Icon name="badge" size={18} color={colors.slate[400]} />
                </View>
                <Text style={styles.menuRowText}>{lang === 'zh' ? '个人信息' : 'Personal Information'}</Text>
              </View>
              <Icon name="chevron_right" size={20} color={colors.slate[200]} />
            </Pressable>
            <Pressable onPress={() => navigation.navigate('ModifyPassword')} style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}>
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconBox}>
                  <Icon name="lock" size={18} color={colors.slate[400]} />
                </View>
                <Text style={styles.menuRowText}>{lang === 'zh' ? '安全设置' : 'Security Settings'}</Text>
              </View>
              <Icon name="chevron_right" size={20} color={colors.slate[200]} />
            </Pressable>
            <Pressable onPress={() => navigation.navigate('Support')} style={({ pressed }) => [styles.menuRow, pressed && styles.menuRowPressed]}>
              <View style={styles.menuRowLeft}>
                <View style={styles.menuIconBox}>
                  <Icon name="contact_support" size={18} color={colors.slate[400]} />
                </View>
                <Text style={styles.menuRowText}>{t.contactUs}</Text>
              </View>
              <Icon name="chevron_right" size={20} color={colors.slate[200]} />
            </Pressable>
          </View>
        </View>

        <View style={styles.logoutSection}>
          <Pressable onPress={handleLogout} style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}>
            <Text style={styles.logoutBtnText}>{t.logout}</Text>
          </Pressable>
          <Text style={styles.version}>CoRide v1.2.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.9 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  profileSection: {
    paddingHorizontal: spacing.p6,
    paddingTop: 40,
    paddingBottom: spacing.p8,
    alignItems: 'center',
  },
  avatarWrap: { position: 'relative', marginBottom: spacing.gap4 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: colors.slate[50],
  },
  editBtn: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: colors.sage,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  userName: { fontSize: fontSize['2xl'], fontWeight: '800', color: colors.slate[900], letterSpacing: -0.5 },
  statsCard: {
    marginHorizontal: spacing.p6,
    marginBottom: 40,
    backgroundColor: colors.sage + '0D',
    borderRadius: 32,
    padding: spacing.p8,
    borderWidth: 1,
    borderColor: colors.sage + '1A',
    overflow: 'hidden',
  },
  statsRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.gap4 },
  statsNum: { fontSize: fontSize['3xl'], fontWeight: '800', color: colors.sage, marginRight: spacing.gap2 },
  statsLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.slate[500], textTransform: 'uppercase', letterSpacing: 2 },
  statsDivider: { width: 32, borderTopWidth: 2, borderTopColor: colors.sage + '33', marginVertical: spacing.gap2 },
  menuSection: { marginBottom: spacing.p8 },
  menuLabel: {
    fontSize: fontSize['10'],
    fontWeight: '800',
    color: colors.slate[300],
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: spacing.py2,
    paddingHorizontal: spacing.p8,
  },
  menuCard: { borderTopWidth: 1, borderTopColor: colors.slate[50] },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.p8,
    paddingVertical: spacing.p4,
  },
  menuRowPressed: { backgroundColor: colors.slate[50] },
  menuRowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.gap4 },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.slate[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRowText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.slate[600] },
  logoutSection: { paddingTop: 48, paddingBottom: 32, alignItems: 'center' },
  logoutBtn: { paddingVertical: spacing.py2, paddingHorizontal: spacing.p6 },
  logoutBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.sage,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  version: { fontSize: fontSize['10'], color: colors.slate[200], fontWeight: '700', marginTop: spacing.p8, letterSpacing: 2 },
});
