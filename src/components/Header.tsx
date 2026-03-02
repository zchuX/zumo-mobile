import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from './Icon';
import { colors, fontSize, spacing } from '../theme';

interface HeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export default function Header({ title, onBack, rightElement }: HeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.p4 }]}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable onPress={onBack} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
            <Icon name="arrow_back_ios_new" size={20} color={colors.white} />
          </Pressable>
        ) : (
          <View style={styles.placeholder} />
        )}
      </View>
      <Text style={styles.title} numberOfLines={1}>{title}</Text>
      <View style={styles.side}>
        {rightElement ?? <View style={styles.placeholder} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  side: { width: 32, alignItems: 'center', justifyContent: 'center' },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.9 },
  placeholder: { width: 32, height: 32 },
  title: {
    fontSize: fontSize.base,
    fontWeight: '800',
    letterSpacing: -0.5,
    textTransform: 'uppercase',
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
});
