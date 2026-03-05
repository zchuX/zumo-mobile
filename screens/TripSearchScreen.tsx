import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from '../src/components/Icon';
import { useApp } from '../context/AppState';
import { useTrip, useUncompletedTrips, useCompletedTrips } from '../src/hooks/useTrips';
import type { TripsStackParamList } from '../navigation/types';
import { colors, fontSize, spacing, borderRadius } from '../src/theme';

type TripSearchNav = NativeStackNavigationProp<TripsStackParamList, 'TripSearch'>;

export default function TripSearchScreen() {
  const navigation = useNavigation<TripSearchNav>();
  const insets = useSafeAreaInsets();
  const { lang } = useApp();
  const [tripIdInput, setTripIdInput] = useState('');
  const [searchId, setSearchId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const { data: trip, isLoading, isError, isFetched } = useTrip(searchId);
  const { data: uncompletedTrips = [] } = useUncompletedTrips();
  const { data: completedTrips = [] } = useCompletedTrips();

  const userTripIds = React.useMemo(() => {
    const ids = new Set<string>();
    uncompletedTrips.forEach((item) => ids.add(item.id));
    completedTrips.forEach((item) => ids.add(item.id));
    return ids;
  }, [uncompletedTrips, completedTrips]);

  useEffect(() => {
    if (isFetched && trip && searchId) {
      const isUserInTrip = userTripIds.has(trip.id);
      if (isUserInTrip) {
        navigation.replace('TripDetail', { tripId: trip.id, title: 'Trip Detail' });
      } else {
        navigation.replace('TripBrief', { trip });
      }
    } else if (isFetched && !trip && searchId) {
      setError(lang === 'zh' ? '未找到该行程 ID' : 'Trip ID not found');
      setSearchId(null);
    }
  }, [isFetched, trip, searchId, userTripIds, navigation, lang]);

  useEffect(() => {
    if (isError) {
      setError(lang === 'zh' ? '搜索出错，请稍后再试' : 'Search error, please try again');
      setSearchId(null);
    }
  }, [isError, lang]);

  const handleSearch = () => {
    if (!tripIdInput.trim()) return;
    setError('');
    setSearchId(tripIdInput.trim());
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
      <View style={[styles.backWrap, { top: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
          <Icon name="arrow_back_ios_new" size={28} color={colors.slate[800]} />
        </Pressable>
      </View>

      <View style={styles.main}>
        <View style={styles.iconWrap}>
          <Icon name="travel_explore" size={40} color={colors.sage} />
        </View>
        <Text style={styles.title}>{lang === 'zh' ? '查找行程' : 'Find Trip'}</Text>
        <Text style={styles.subtitle}>{lang === 'zh' ? '输入行程 ID 加入行程' : 'Enter Trip ID to join a ride'}</Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            value={tripIdInput}
            onChangeText={(v) => { setTripIdInput(v); setError(''); }}
            placeholder="e.g. ABC-123 or TBD-001"
            placeholderTextColor={colors.slate[300]}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <Pressable
            onPress={handleSearch}
            disabled={isLoading}
            style={[styles.searchBtn, isLoading && styles.searchBtnDisabled]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.searchBtnText}>{lang === 'zh' ? '搜索行程' : 'Search Trip'}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white, paddingHorizontal: spacing.p8 },
  backWrap: { position: 'absolute', left: spacing.p6, zIndex: 10 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.9 },
  main: { flex: 1, alignItems: 'center', marginTop: 80 },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.sage + '1A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.p6,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    color: colors.slate[900],
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.slate[400],
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: spacing.p6,
  },
  form: { width: '100%', gap: spacing.gap4 },
  input: {
    width: '100%',
    backgroundColor: colors.slate[50],
    borderRadius: 20,
    paddingVertical: spacing.p4,
    paddingHorizontal: spacing.p6,
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.slate[800],
    textTransform: 'uppercase',
  },
  errorText: {
    fontSize: fontSize['10'],
    fontWeight: '800',
    color: colors.rose[500],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 4,
  },
  searchBtn: {
    width: '100%',
    backgroundColor: colors.sage,
    paddingVertical: spacing.p4,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.sage,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  searchBtnDisabled: { opacity: 0.6 },
  searchBtnText: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.white,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
});
