import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Icon from './Icon';
import { colors, fontSize, spacing } from '../theme';

interface LoadingProps {
  message?: string;
}

export default function Loading({ message }: LoadingProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: -4, duration: 300, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [translateY]);

  return (
    <View style={styles.container}>
      <View style={styles.roadLine}>
        <Animated.View style={[styles.roadLineInner, { opacity }]} />
      </View>
      <Animated.View style={[styles.carWrap, { transform: [{ translateY }] }]}>
        <Icon name="directions_car" size={48} color={colors.sage} />
      </Animated.View>
      {message ? (
        <Text style={styles.message}>{message}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    width: '100%',
    padding: spacing.p8,
  },
  roadLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.slate[100],
    borderRadius: 2,
    overflow: 'hidden',
  },
  roadLineInner: {
    height: '100%',
    width: '50%',
    backgroundColor: colors.sage + '4D',
  },
  carWrap: {
    marginBottom: spacing.py2,
  },
  message: {
    marginTop: 24,
    fontSize: fontSize['10'],
    fontWeight: '800',
    color: colors.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center',
  },
});
