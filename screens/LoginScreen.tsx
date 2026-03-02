import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from '../src/components/Icon';
import { useApp } from '../context/AppState';
import { COUNTRY_CODES, type CountryCode } from '../src/constants';
import * as authService from '../src/api/authService';
import type { User } from '../src/types';
import { colors, fontSize, spacing, borderRadius } from '../src/theme';

type LoginMethod = 'password' | 'phone';

export default function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const { t, lang, setLang, setCurrentScreen } = useApp();
  const [method, setMethod] = useState<LoginMethod>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [idOrEmail, setIdOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLoginDisabled = method === 'phone' ? !phoneNumber || !password : !idOrEmail || !password;

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params =
        method === 'password'
          ? { email: idOrEmail, password }
          : { phone_number: selectedCountry.code + phoneNumber, password };
      await authService.login(params);
      const rawResponse = await authService.getProfile();
      let profile: Record<string, unknown> =
        rawResponse && typeof rawResponse === 'object' ? (rawResponse as Record<string, unknown>) : {};
      if (profile.user) profile = profile.user as Record<string, unknown>;
      if (profile.data) profile = profile.data as Record<string, unknown>;
      const userArn =
        (profile.userArn as string) ||
        (profile.id as string) ||
        (profile.sub as string) ||
        (profile.userId as string) ||
        (profile.username as string) ||
        (profile.arn as string) ||
        '';
      const user: User = {
        userArn,
        id: userArn,
        name: (profile.name as string) || (profile.username as string) || (profile.displayName as string) || 'User',
        email: profile.email as string | undefined,
        phone_number: profile.phone_number as string | undefined,
        avatar:
          (profile.imageUrl as string) ||
          (profile.photoUrl as string) ||
          (profile.avatarUrl as string) ||
          (profile.picture as string) ||
          'https://picsum.photos/seed/default/200',
      };
      onLogin(user);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number }; message?: string };
      if (e.response?.status && e.response.status >= 500) {
        setError(lang === 'en' ? 'Server error. Please try again later.' : '服务器错误，请稍后重试。');
      } else {
        setError(lang === 'en' ? 'Login attempt failed' : '登录失败，请检查您的凭据');
        setPassword('');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.langWrap}>
          <Pressable onPress={() => setLang(lang === 'en' ? 'zh' : 'en')} style={({ pressed }) => [styles.langBtn, pressed && styles.pressed]}>
            <Icon name="language" size={14} color={colors.slate[600]} />
            <Text style={styles.langText}>{lang === 'en' ? '中文' : 'English'}</Text>
          </Pressable>
        </View>

        <View style={styles.logoSection}>
          <View style={styles.logoBox}>
            <Icon name="directions_car" size={36} color={colors.sage} />
          </View>
          <Text style={styles.logoTitle}>CoRide</Text>
          <Text style={styles.logoSub}>{lang === 'en' ? 'Seamless commutes, shared goals' : '高效出行，智享拼车'}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{method === 'password' ? t.email : t.phone}</Text>
            <View style={styles.inputRow}>
              {method === 'phone' && (
                <Pressable onPress={() => setDropdownVisible(true)} style={styles.countryBtn}>
                  <Text style={styles.flag}>{selectedCountry.flag}</Text>
                  <Text style={styles.countryCode}>{selectedCountry.code}</Text>
                  <Icon name="expand_more" size={18} color={colors.slate[300]} />
                </Pressable>
              )}
              <TextInput
                value={method === 'password' ? idOrEmail : phoneNumber}
                onChangeText={(val) => {
                  if (method === 'phone') {
                    if (/^\d*$/.test(val)) setPhoneNumber(val);
                  } else setIdOrEmail(val);
                }}
                placeholder={method === 'password' ? (lang === 'en' ? 'Enter Email' : '请输入邮箱') : (lang === 'en' ? 'Phone Number' : '请输入手机号')}
                placeholderTextColor={colors.slate[300]}
                style={[styles.input, method === 'phone' && styles.inputWithPrefix]}
                keyboardType={method === 'phone' ? 'phone-pad' : 'email-address'}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{lang === 'en' ? 'Password' : '登录密码'}</Text>
            <View style={styles.passwordRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.slate[300]}
                style={styles.input}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={20} color={colors.slate[300]} />
              </Pressable>
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <Pressable
            onPress={() => {
              setMethod(method === 'password' ? 'phone' : 'password');
              setIdOrEmail('');
              setPhoneNumber('');
              setPassword('');
            }}
            style={styles.switchMethod}
          >
            <Text style={styles.switchMethodText}>
              {method === 'password' ? (lang === 'en' ? 'Use Phone Login' : '手机号码登录') : (lang === 'en' ? 'Use Password Login' : '账号密码登录')}
            </Text>
            <Icon name="arrow_forward_ios" size={12} color={colors.sage} />
          </Pressable>

          <Pressable
            onPress={handleLogin}
            disabled={isLoginDisabled || isLoading}
            style={[
              styles.submitBtn,
              (isLoginDisabled || isLoading) && styles.submitBtnDisabled,
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={[styles.submitBtnText, (isLoginDisabled || isLoading) && styles.submitBtnTextDisabled]}>{t.login}</Text>
            )}
          </Pressable>

          <Pressable onPress={() => setCurrentScreen('reset_password')} style={styles.resetLink}>
            <Text style={styles.resetLinkText}>{lang === 'en' ? 'RESET PASSWORD' : '重置密码'}</Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{lang === 'en' ? 'New to CoRide?' : '还没有账号？'}</Text>
          <Pressable onPress={() => setCurrentScreen('register')}>
            <Text style={styles.footerLink}>{t.register}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Modal visible={dropdownVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setDropdownVisible(false)}>
          <View style={styles.modalContent}>
            {COUNTRY_CODES.map((c, i) => (
              <Pressable
                key={i}
                onPress={() => {
                  setSelectedCountry(c);
                  setDropdownVisible(false);
                }}
                style={[styles.modalRow, selectedCountry.name === c.name && styles.modalRowSelected]}
              >
                <Text style={styles.modalFlag}>{c.flag}</Text>
                <Text style={[styles.modalRowText, selectedCountry.name === c.name && styles.modalRowTextSelected]}>{c.name}</Text>
                <Text style={styles.modalCode}>{c.code}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.p8, paddingTop: 96, paddingBottom: spacing.p8 },
  langWrap: { position: 'absolute', top: 48, right: spacing.p8, zIndex: 10 },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.gap3,
    paddingVertical: 6,
    backgroundColor: colors.slate[100],
    borderRadius: borderRadius.full,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  langText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.slate[600] },
  pressed: { opacity: 0.9 },
  logoSection: { alignItems: 'center', marginTop: spacing.gap4, marginBottom: spacing.p8 },
  logoBox: {
    width: 64,
    height: 64,
    backgroundColor: colors.sageLight,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.gap3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  logoTitle: {
    fontSize: fontSize['3xl'],
    fontWeight: '800',
    color: colors.sage,
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginBottom: 4,
    paddingLeft: 6,
  },
  logoSub: { fontSize: fontSize.xs, fontWeight: '500', color: colors.slate[400], paddingHorizontal: spacing.gap4 },
  form: { flex: 1, justifyContent: 'center', marginTop: spacing.gap3 },
  inputGroup: { marginBottom: spacing.gap3 },
  label: {
    fontSize: fontSize['10'],
    fontWeight: '800',
    color: colors.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginLeft: 4,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    height: 54,
    borderWidth: 2,
    borderColor: colors.slate[200],
    borderRadius: borderRadius.ios * 2,
    backgroundColor: colors.slate[50] + '4D',
    alignItems: 'center',
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: spacing.p4,
    borderRightWidth: 1,
    borderRightColor: colors.slate[100],
    backgroundColor: colors.slate[100] + '33',
  },
  flag: { fontSize: 18, marginRight: 8 },
  countryCode: { fontSize: fontSize.sm, fontWeight: '800', color: colors.slate[700] },
  input: {
    flex: 1,
    paddingHorizontal: spacing.p4,
    fontSize: 16,
    fontWeight: '600',
    color: colors.slate[800],
  },
  inputWithPrefix: { paddingLeft: 8 },
  passwordRow: {
    flexDirection: 'row',
    height: 54,
    borderWidth: 2,
    borderColor: colors.slate[200],
    borderRadius: borderRadius.ios * 2,
    backgroundColor: colors.slate[50] + '4D',
    paddingHorizontal: spacing.p4,
    alignItems: 'center',
  },
  eyeBtn: { marginLeft: 8, padding: 4 },
  errorText: { fontSize: fontSize['10'], color: colors.rose[500], fontWeight: '700', marginTop: 4, marginLeft: 4 },
  switchMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingVertical: 4,
    marginBottom: spacing.py2,
  },
  switchMethodText: { fontSize: fontSize['11'], fontWeight: '800', color: colors.sage, textTransform: 'uppercase', letterSpacing: 2 },
  submitBtn: {
    width: '100%',
    paddingVertical: spacing.p4,
    paddingHorizontal: spacing.p4,
    borderRadius: borderRadius.ios * 2,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.sage,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
  submitBtnDisabled: { backgroundColor: colors.slate[100], shadowOpacity: 0 },
  submitBtnText: { fontSize: fontSize.lg, fontWeight: '800', color: colors.white },
  submitBtnTextDisabled: { color: colors.slate[300] },
  resetLink: { alignItems: 'center', marginTop: spacing.gap4 },
  resetLinkText: {
    fontSize: fontSize['11'],
    fontWeight: '700',
    color: colors.slate[400],
    textTransform: 'uppercase',
    letterSpacing: 2,
    paddingVertical: 4,
  },
  footer: { marginTop: spacing.p4, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  footerText: { fontSize: fontSize.xs, fontWeight: '500', color: colors.slate[400] },
  footerLink: { fontSize: fontSize.xs, fontWeight: '800', color: colors.sage, marginLeft: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.p6,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.ios * 2,
    paddingVertical: spacing.py2,
    maxHeight: 280,
    width: '100%',
    maxWidth: 320,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.p4,
    paddingVertical: spacing.gap3,
  },
  modalRowSelected: { backgroundColor: colors.sage + '0D' },
  modalFlag: { fontSize: 18, marginRight: 12, width: 24, textAlign: 'center' },
  modalRowText: { flex: 1, fontSize: fontSize.sm, fontWeight: '700', color: colors.slate[600] },
  modalRowTextSelected: { color: colors.sage },
  modalCode: { fontSize: fontSize.xs, fontWeight: '800', color: colors.slate[300] },
});
