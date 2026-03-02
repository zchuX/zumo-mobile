import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../src/components/Header';
import { colors, fontSize } from '../src/theme';

export default function PlaceholderScreen({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
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
