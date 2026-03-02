import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Header from '../src/components/Header';
import Icon from '../src/components/Icon';
import { useApp } from '../context/AppState';
import { colors, fontSize, spacing, borderRadius } from '../src/theme';

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { t, lang, setLang } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 32 }]}>
      <Header title={t.settings} onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.language}</Text>
          <View style={styles.card}>
            <Pressable
              onPress={() => setLang('zh')}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View>
                <Text style={styles.rowTitle}>简体中文</Text>
                <Text style={styles.rowSub}>Simplified Chinese</Text>
              </View>
              {lang === 'zh' && (
                <View style={styles.checkCircle}>
                  <Icon name="check" size={14} color={colors.white} />
                </View>
              )}
            </Pressable>
            <View style={styles.divider} />
            <Pressable
              onPress={() => setLang('en')}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View>
                <Text style={styles.rowTitle}>English</Text>
                <Text style={styles.rowSub}>English</Text>
              </View>
              {lang === 'en' && (
                <View style={styles.checkCircle}>
                  <Icon name="check" size={14} color={colors.white} />
                </View>
              )}
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{lang === 'en' ? 'APP INFO' : '关于应用'}</Text>
          <View style={[styles.card, styles.infoRow]}>
            <Text style={styles.rowTitle}>{lang === 'en' ? 'Version' : '版本'}</Text>
            <Text style={styles.versionText}>v1.2.0</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.iosGray },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.p6, paddingTop: spacing.p8 },
  section: { marginBottom: spacing.p8 },
  sectionTitle: {
    fontSize: fontSize['11'],
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.slate[400],
    marginBottom: spacing.gap3,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.slate[50],
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.p5,
  },
  rowPressed: { backgroundColor: colors.slate[50] },
  rowTitle: { fontSize: 16, fontWeight: '700', color: colors.slate[900] },
  rowSub: { fontSize: fontSize['11'], color: colors.slate[400], marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.slate[50], marginHorizontal: spacing.p5 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoRow: { padding: spacing.p5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  versionText: { fontSize: fontSize.xs, color: colors.slate[400], fontWeight: '700' },
});
