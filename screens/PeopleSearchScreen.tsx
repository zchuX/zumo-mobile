import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { FriendsStackParamList } from '../navigation/types';
import Icon from '../src/components/Icon';
import { useApp } from '../context/AppState';
import { colors, fontSize, spacing } from '../src/theme';

type PeopleSearchRoute = RouteProp<FriendsStackParamList, 'PeopleSearch'>;

export default function PeopleSearchScreen() {
  const navigation = useNavigation();
  const route = useRoute<PeopleSearchRoute>();
  const insets = useSafeAreaInsets();
  const { lang } = useApp();
  const initialQuery = route.params?.initialQuery ?? '';
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const handleSearch = () => {
    navigation.navigate('PeopleSearchResults', { query: query.trim() });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.p6, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
          <Icon name="close" size={24} color={colors.slate[600]} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Icon name="person_search" size={40} color={colors.sage} />
          </View>
          <Text style={styles.heroTitle}>
            {lang === 'zh' ? '添加好友' : 'Add Friends'}
          </Text>
          <Text style={styles.heroSub}>
            {lang === 'zh' ? '输入姓名、邮箱或电话' : 'Enter name, email or phone'}
          </Text>
        </View>

        <View style={styles.inputWrap}>
          <Icon name="search" size={20} color={colors.slate[400]} style={styles.inputIcon} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={lang === 'zh' ? '姓名、邮箱或电话...' : 'Name, email or phone...'}
            placeholderTextColor={colors.slate[400]}
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Pressable
          onPress={handleSearch}
          disabled={!query.trim()}
          style={({ pressed }) => [styles.searchBtn, (!query.trim() || pressed) && styles.searchBtnDisabled]}
        >
          <Text style={styles.searchBtnText}>{lang === 'zh' ? '搜索' : 'Search'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  pressed: { opacity: 0.9 },
  header: { paddingHorizontal: spacing.p6, paddingBottom: spacing.p4 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, paddingHorizontal: spacing.p8, paddingTop: spacing.p6 },
  hero: { alignItems: 'center', marginBottom: spacing.p8 },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 28,
    backgroundColor: colors.sageLight ?? colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.p4,
  },
  heroTitle: { fontSize: 22, fontWeight: '800', color: colors.slate[900], marginBottom: 8 },
  heroSub: { fontSize: fontSize.sm, color: colors.slate[400], textAlign: 'center', paddingHorizontal: spacing.p4 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.slate[100],
    paddingHorizontal: spacing.p4,
    marginBottom: spacing.p6,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, paddingVertical: 16, fontSize: 16, fontWeight: '700', color: colors.slate[800] },
  searchBtn: {
    backgroundColor: colors.sage,
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
  },
  searchBtnDisabled: { opacity: 0.5 },
  searchBtnText: { fontSize: fontSize.base, fontWeight: '800', color: colors.white, letterSpacing: 1 },
});
