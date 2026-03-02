import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Linking, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Header from '../src/components/Header';
import Icon from '../src/components/Icon';
import { useApp } from '../context/AppState';
import { colors, fontSize, spacing, borderRadius } from '../src/theme';

export default function SupportScreen() {
  const navigation = useNavigation();
  const { t, lang } = useApp();
  const [feedback, setFeedback] = useState('');
  const insets = useSafeAreaInsets();

  const handleSubmitFeedback = () => {
    if (!feedback.trim()) return;
    Alert.alert(lang === 'zh' ? '感谢您的反馈！' : 'Thank you for your feedback!');
    setFeedback('');
  };

  const openEmail = () => Linking.openURL('mailto:support@coride.com');

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 40 }]}>
      <Header title={t.contactUs} onBack={() => navigation.goBack()} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.h2}>{lang === 'zh' ? '我们需要帮助吗？' : 'Need a hand?'}</Text>
          <Text style={styles.sub}>
            {lang === 'zh'
              ? '我们的客服团队随时为您解答任何关于拼车或行程的问题。'
              : 'Our support team is here to help with any carpool or trip-related questions.'}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <View style={styles.iconBox}>
              <Icon name="alternate_email" size={24} color={colors.sage} />
            </View>
            <View style={styles.cardText}>
              <Text style={styles.label}>{lang === 'zh' ? '电子邮箱' : 'EMAIL SUPPORT'}</Text>
              <Text style={styles.value}>support@coride.com</Text>
            </View>
          </View>
          <Pressable onPress={openEmail} style={({ pressed }) => [styles.emailLink, pressed && styles.pressed]}>
            <View style={styles.emailLinkRow}>
              <Text style={styles.emailLinkText}>{lang === 'zh' ? '点击发送' : 'Send Email'}</Text>
              <Icon name="arrow_forward_ios" size={12} color={colors.sage} />
            </View>
          </Pressable>
        </View>

        <View style={styles.feedbackSection}>
          <Text style={styles.labelSmall}>
            {lang === 'zh' ? '提供反馈' : 'LEAVE FEEDBACK'}
          </Text>
          <View style={styles.card}>
            <TextInput
              value={feedback}
              onChangeText={setFeedback}
              placeholder={lang === 'zh' ? '您的意见对我们非常重要...' : 'Your thoughts are very important to us...'}
              placeholderTextColor={colors.slate[300]}
              style={styles.textarea}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
            <Pressable
              onPress={handleSubmitFeedback}
              disabled={!feedback.trim()}
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && styles.pressed,
                !feedback.trim() && styles.submitBtnDisabled,
              ]}
            >
              <Text style={styles.submitBtnText}>
                {lang === 'zh' ? '提交反馈' : 'Submit Feedback'}
              </Text>
            </Pressable>
          </View>
        </View>

        <Pressable style={({ pressed }) => [styles.faqRow, pressed && styles.pressed]}>
          <View style={styles.faqLeft}>
            <View style={styles.faqIconBox}>
              <Icon name="help_center" size={20} color={colors.slate[400]} />
            </View>
            <Text style={styles.faqText}>{lang === 'zh' ? '常见问题 (FAQ)' : 'Common Questions'}</Text>
          </View>
          <Icon name="chevron_right" size={24} color={colors.slate[200]} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.iosGray,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.p6, paddingTop: spacing.p8, paddingBottom: 20 },
  section: { marginBottom: spacing.p8 },
  h2: {
    fontSize: fontSize['2xl'],
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.slate[900],
    marginBottom: spacing.gap2,
  },
  sub: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.slate[500],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 32,
    padding: spacing.p6,
    borderWidth: 1,
    borderColor: colors.slate[100],
    marginBottom: spacing.p8,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.p4 },
  iconBox: {
    width: 48,
    height: 48,
    backgroundColor: colors.sage + '0D',
    borderRadius: borderRadius.ios * 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.gap4,
  },
  cardText: { flex: 1 },
  label: {
    fontSize: fontSize['10'],
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.slate[400],
    marginBottom: 2,
  },
  value: { fontSize: fontSize.base, fontWeight: '700', color: colors.slate[800] },
  emailLink: {
    borderTopWidth: 1,
    borderTopColor: colors.slate[50],
    paddingTop: spacing.p4,
    alignItems: 'flex-end',
  },
  emailLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  emailLinkText: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.sage,
  },
  feedbackSection: { marginBottom: spacing.p8 },
  labelSmall: {
    fontSize: fontSize['11'],
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.slate[400],
    marginBottom: spacing.gap4,
    paddingHorizontal: 4,
  },
  textarea: {
    backgroundColor: colors.slate[50],
    borderRadius: borderRadius.ios * 2,
    padding: spacing.p4,
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.slate[700],
    minHeight: 120,
    marginBottom: spacing.gap4,
  },
  submitBtn: {
    backgroundColor: colors.sage,
    paddingVertical: spacing.p4,
    borderRadius: borderRadius.ios * 2,
    alignItems: 'center',
    shadowColor: colors.sage,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: { opacity: 0.3, shadowOpacity: 0 },
  submitBtnText: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.white,
  },
  pressed: { opacity: 0.9 },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.ios * 2,
    padding: spacing.p5,
    borderWidth: 1,
    borderColor: colors.slate[100],
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  faqLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.gap3 },
  faqIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.slate[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  faqText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.slate[700] },
});
