import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import Header from '../src/components/Header';
import { colors, fontSize } from '../src/theme';

type PlaceholderParams = { title?: string };

export default function PlaceholderScreen({
  title: titleProp,
  onBack: onBackProp,
}: {
  title?: string;
  onBack?: () => void;
} = {}) {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ params?: PlaceholderParams }, 'params'>>();
  const title = route.params?.title ?? titleProp ?? 'Screen';
  const onBack = onBackProp ?? (() => navigation.goBack());

  return (
    <View style={styles.container}>
      <Header title={title} onBack={onBack} />
      <View style={styles.content}>
        <Text style={styles.text}>Screen in progress</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  text: { fontSize: fontSize.sm, fontWeight: '600', color: colors.slate[500] },
});
