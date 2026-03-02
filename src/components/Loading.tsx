import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import Icon from './Icon';
import { colors, fontSize, spacing } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LoadingProps {
  message?: string;
}

export default function Loading({ message }: LoadingProps) {
  const carTranslateY = useRef(new Animated.Value(0)).current;
  const carRotate = useRef(new Animated.Value(0)).current;
  const catTranslateY = useRef(new Animated.Value(0)).current;
  const roadStripX = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const speedLine1 = useRef(new Animated.Value(0)).current;
  const speedLine1Opacity = useRef(new Animated.Value(0)).current;
  const speedLine2 = useRef(new Animated.Value(0)).current;
  const speedLine2Opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const carBounce = Animated.loop(
      Animated.sequence([
        Animated.timing(carTranslateY, { toValue: -4, duration: 300, useNativeDriver: true }),
        Animated.timing(carTranslateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ])
    );
    const carWobble = Animated.loop(
      Animated.sequence([
        Animated.timing(carRotate, { toValue: -1, duration: 150, useNativeDriver: true }),
        Animated.timing(carRotate, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(carRotate, { toValue: 0, duration: 150, useNativeDriver: true }),
      ])
    );
    const catBounce = Animated.loop(
      Animated.sequence([
        Animated.timing(catTranslateY, { toValue: -2, duration: 300, useNativeDriver: true }),
        Animated.timing(catTranslateY, { toValue: 0, duration: 300, useNativeDriver: true }),
      ])
    );
    const roadAnim = Animated.loop(
      Animated.timing(roadStripX, {
        toValue: SCREEN_WIDTH,
        duration: 1500,
        useNativeDriver: true,
      })
    );
    roadStripX.setValue(-SCREEN_WIDTH);
    const speed1 = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.sequence([
            Animated.timing(speedLine1Opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
            Animated.timing(speedLine1Opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
          ]),
          Animated.timing(speedLine1, { toValue: -14, duration: 500, useNativeDriver: true }),
        ]),
        Animated.timing(speedLine1, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(300),
      ])
    );
    const speed2 = Animated.loop(
      Animated.sequence([
        Animated.delay(150),
        Animated.parallel([
          Animated.sequence([
            Animated.timing(speedLine2Opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
            Animated.timing(speedLine2Opacity, { toValue: 0, duration: 350, useNativeDriver: true }),
          ]),
          Animated.timing(speedLine2, { toValue: -18, duration: 500, useNativeDriver: true }),
        ]),
        Animated.timing(speedLine2, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(300),
      ])
    );

    carBounce.start();
    carWobble.start();
    catBounce.start();
    roadAnim.start();
    speed1.start();
    speed2.start();
    return () => {
      carBounce.stop();
      carWobble.stop();
      catBounce.stop();
      roadAnim.stop();
      speed1.stop();
      speed2.stop();
    };
  }, [carTranslateY, carRotate, catTranslateY, roadStripX, speedLine1, speedLine1Opacity, speedLine2, speedLine2Opacity]);

  return (
    <View style={styles.container}>
      <View style={styles.roadWrap}>
        {/* Speed lines (left of car) */}
        <View style={styles.speedLines} pointerEvents="none">
          <Animated.View
            style={[
              styles.speedLine,
              styles.speedLineShort,
              {
                opacity: speedLine1Opacity,
                transform: [{ translateX: speedLine1 }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.speedLine,
              styles.speedLineLong,
              {
                opacity: speedLine2Opacity,
                transform: [{ translateX: speedLine2 }],
              },
            ]}
          />
        </View>
        {/* Car + cat driver */}
        <Animated.View
          style={[
            styles.carWrap,
            {
              transform: [
                { translateY: carTranslateY },
                { rotate: carRotate.interpolate({ inputRange: [-1, 1], outputRange: ['-1deg', '1deg'] }) },
              ],
            },
          ]}
        >
          <View style={styles.carInner}>
            <Icon name="directions_car" size={48} color={colors.sage} />
            <Animated.View style={[styles.catDriver, { transform: [{ translateY: catTranslateY }] }]}>
              <Icon name="pets" size={20} color={colors.sage} />
            </Animated.View>
          </View>
        </Animated.View>
        {/* Road line with moving strip */}
        <View style={styles.roadLine}>
          <Animated.View
            style={[
              styles.roadLineInner,
              { transform: [{ translateX: roadStripX }] },
            ]}
          />
        </View>
      </View>
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
  roadWrap: {
    width: 128,
    height: 80,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
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
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    backgroundColor: colors.sage + '4D',
  },
  carWrap: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    marginLeft: -24,
  },
  carInner: {
    position: 'relative',
  },
  catDriver: {
    position: 'absolute',
    top: 2,
    left: 14,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.sage + '33',
  },
  speedLines: {
    position: 'absolute',
    left: 0,
    top: '50%',
    marginTop: -8,
    width: 24,
  },
  speedLine: {
    height: 2,
    backgroundColor: colors.sage + '33',
    borderRadius: 1,
    marginBottom: 4,
  },
  speedLineShort: { width: 16 },
  speedLineLong: { width: 24 },
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
