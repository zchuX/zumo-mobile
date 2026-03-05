import React, { useState, useEffect, useRef } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from '../src/components/Icon';
import { useApp } from '../context/AppState';
import { COUNTRY_CODES, type CountryCode } from '../src/constants';
import * as authService from '../src/api/authService';
import { colors, fontSize, spacing, borderRadius } from '../src/theme';

type ResetStep = 'details' | 'verify' | 'success';
type ResetMethod = 'email' | 'phone';

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t, lang, setLang } = useApp();
  const [step, setStep] = useState<ResetStep>('details');
  const [method, setMethod] = useState<ResetMethod>('email');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const codeRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [countdown]);

  const handleCodeChange = (index: number, value: string) => {
    const v = value.length > 1 ? value.slice(-1) : value;
    const newCode = [...code];
    newCode[index] = v.replace(/\D/g, '');
    setCode(newCode);
    if (v && index < 5) codeRefs.current[index + 1]?.focus();
  };

  const isDetailsValid =
    contact.length > 0 && password.length >= 6 && password === confirmPassword;
  const isCodeComplete = code.every((d) => d !== '');

  const handleSendCodeAndContinue = () => {
    if (!isDetailsValid) return;
    setError(null);
    setStep('verify');
    setIsLoading(true);
    const params =
      method === 'email' ? { email: contact } : { phone_number: selectedCountry.code + contact };
    authService
      .sendResetCode(params)
      .then(() => setCountdown(60))
      .catch((err: { message?: string }) => {
        setError(err.message ?? (lang === 'en' ? 'Failed to send reset code. Please try again.' : '发送验证码失败，请重试。'));
      })
      .finally(() => setIsLoading(false));
  };

  const handleResendCode = () => {
    if (countdown > 0 || isLoading) return;
    setIsLoading(true);
    setError(null);
    const params =
      method === 'email' ? { email: contact } : { phone_number: selectedCountry.code + contact };
    authService
      .sendResetCode(params)
      .then(() => setCountdown(60))
      .catch((err: { message?: string }) => {
        setError(err.message ?? (lang === 'en' ? 'Failed to resend code.' : '重新发送失败。'));
      })
      .finally(() => setIsLoading(false));
  };

  const handleConfirmReset = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const usernameParams =
        method === 'email' ? { email: contact } : { phone_number: selectedCountry.code + contact };
      const verificationCode = code.join('');
      await authService.confirmReset({
        ...usernameParams,
        code: verificationCode,
        newPassword: password,
      });
      setStep('success');
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? (lang === 'en' ? 'Failed to reset password. Please check the code and try again.' : '重置失败，请检查验证码后重试。'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'verify') setStep('details');
    else navigation.goBack();
  };

  const subtitle =
    step === 'details'
      ? t.resetPassword
      : step === 'verify'
        ? lang === 'en'
          ? 'Verify Identity'
          : '验证身份'
        : t.passwordChanged;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + spacing.p8 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.backWrap, { top: insets.top + 8 }]}>
          <Pressable onPress={handleBack} style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}>
            <Icon name="chevron_left" size={28} color={colors.slate[400]} />
          </Pressable>
        </View>
        <View style={[styles.langWrap, { top: insets.top + 8 }]}>
          <Pressable onPress={() => setLang(lang === 'en' ? 'zh' : 'en')} style={({ pressed }) => [styles.langBtn, pressed && styles.pressed]}>
            <Icon name="language" size={14} color={colors.slate[600]} />
            <Text style={styles.langText}>{lang === 'en' ? '中文' : 'English'}</Text>
          </Pressable>
        </View>

        <View style={styles.brandSection}>
          <View style={styles.logoBox}>
            <Icon name="directions_car" size={36} color={colors.sage} />
          </View>
          <Text style={styles.logoTitle}>CoRide</Text>
          <Text style={styles.logoSub}>{subtitle}</Text>
        </View>

        {step === 'details' && (
          <View style={styles.stepContent}>
            <View style={styles.tabRow}>
              <Pressable
                onPress={() => { setMethod('email'); setContact(''); setError(null); }}
                style={[styles.tab, method === 'email' && styles.tabActive]}
              >
                <Text style={[styles.tabText, method === 'email' && styles.tabTextActive]}>{t.email}</Text>
              </Pressable>
              <Pressable
                onPress={() => { setMethod('phone'); setContact(''); setError(null); }}
                style={[styles.tab, method === 'phone' && styles.tabActive]}
              >
                <Text style={[styles.tabText, method === 'phone' && styles.tabTextActive]}>{t.phone}</Text>
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{method === 'email' ? t.email : t.phone}</Text>
              <View style={styles.inputRow}>
                {method === 'phone' && (
                  <Pressable onPress={() => setDropdownVisible(true)} style={styles.countryBtn}>
                    <Text style={styles.flag}>{selectedCountry.flag}</Text>
                    <Text style={styles.countryCode}>{selectedCountry.code}</Text>
                    <Icon name="expand_more" size={18} color={colors.slate[300]} />
                  </Pressable>
                )}
                <TextInput
                  style={[styles.input, method === 'phone' && styles.inputWithPrefix]}
                  placeholder={method === 'email' ? t.emailPlaceholder : t.phonePlaceholder}
                  placeholderTextColor={colors.slate[300]}
                  value={contact}
                  onChangeText={(val) => {
                    if (method === 'phone' && !/^\d*$/.test(val)) return;
                    setContact(val);
                  }}
                  keyboardType={method === 'email' ? 'email-address' : 'phone-pad'}
                  autoCapitalize="none"
                />
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.newPassword}</Text>
              <TextInput
                style={styles.inputSingle}
                placeholder="••••••••"
                placeholderTextColor={colors.slate[300]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.confirmNewPassword}</Text>
              <TextInput
                style={[styles.inputSingle, confirmPassword && password !== confirmPassword && styles.inputError]}
                placeholder="••••••••"
                placeholderTextColor={colors.slate[300]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              {confirmPassword && password !== confirmPassword && (
                <Text style={styles.errorText}>
                  {lang === 'en' ? 'Passwords do not match' : '密码不匹配'}
                </Text>
              )}
            </View>

            <Pressable
              onPress={handleSendCodeAndContinue}
              disabled={!isDetailsValid || isLoading}
              style={[styles.primaryBtn, (!isDetailsValid || isLoading) && styles.primaryBtnDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={[styles.primaryBtnText, !isDetailsValid && styles.primaryBtnTextDisabled]}>
                  {t.continue}
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {step === 'verify' && (
          <View style={styles.stepContent}>
            <Text style={styles.codeSentText}>
              {lang === 'en' ? `Verification code sent to ${contact}` : `验证码已发送至 ${contact}`}
            </Text>
            <View style={styles.codeRow}>
              {code.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { codeRefs.current[i] = r; }}
                  style={styles.codeInput}
                  value={digit}
                  onChangeText={(v) => handleCodeChange(i, v)}
                  keyboardType="number-pad"
                  maxLength={1}
                />
              ))}
            </View>
            <Pressable
              onPress={handleResendCode}
              disabled={countdown > 0 || isLoading}
              style={styles.resendWrap}
            >
              <Text style={[styles.resendText, (countdown > 0 || isLoading) && styles.resendTextDisabled]}>
                {lang === 'en' ? 'Resend Code' : '重新发送验证码'}
                {countdown > 0 ? ` (${countdown}s)` : ''}
              </Text>
            </Pressable>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <Pressable
              onPress={handleConfirmReset}
              disabled={!isCodeComplete || isLoading}
              style={[styles.primaryBtn, (!isCodeComplete || isLoading) && styles.primaryBtnDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={[styles.primaryBtnText, !isCodeComplete && styles.primaryBtnTextDisabled]}>
                  {lang === 'en' ? 'Confirm' : '确认'}
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {step === 'success' && (
          <View style={styles.successContent}>
            <View style={styles.successIconWrap}>
              <Icon name="check_circle" size={48} color={colors.sage} />
            </View>
            <Text style={styles.successTitle}>{t.passwordChanged}</Text>
            <Text style={styles.successSub}>
              {lang === 'en' ? 'You can now log in with your new password.' : '您现在可以使用新密码登录。'}
            </Text>
            <Pressable onPress={() => navigation.goBack()} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>{t.backToLogin}</Text>
            </Pressable>
          </View>
        )}

        {step !== 'success' && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {lang === 'en'
                ? 'Security verification is required to protect your account.'
                : '为了保护您的账户，我们需要进行安全验证。'}
            </Text>
          </View>
        )}
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
                <Text style={[styles.modalRowText, selectedCountry.name === c.name && styles.modalRowTextSelected]}>
                  {c.name}
                </Text>
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
  scrollContent: { flexGrow: 1, paddingHorizontal: spacing.p8 },
  backWrap: { position: 'absolute', left: spacing.p8, zIndex: 10 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.slate[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  langWrap: { position: 'absolute', right: spacing.p8, zIndex: 10 },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.gap3,
    paddingVertical: 6,
    backgroundColor: colors.slate[100],
    borderRadius: 999,
  },
  langText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.slate[600] },
  pressed: { opacity: 0.9 },
  brandSection: { alignItems: 'center', marginTop: spacing.gap4, marginBottom: spacing.p6 },
  logoBox: {
    width: 64,
    height: 64,
    backgroundColor: colors.sageLight,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.gap3,
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
  logoSub: { fontSize: fontSize.xs, fontWeight: '500', color: colors.slate[400], textTransform: 'uppercase', textAlign: 'center' },
  stepContent: { flex: 1, paddingTop: spacing.p4 },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.slate[100] + '80',
    padding: 4,
    borderRadius: borderRadius.ios * 2,
    height: 40,
    marginBottom: spacing.gap3,
  },
  tab: { flex: 1, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  tabActive: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate[100] },
  tabText: { fontSize: fontSize['11'], fontWeight: '800', color: colors.slate[400], textTransform: 'uppercase', letterSpacing: 1 },
  tabTextActive: { color: colors.sage },
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
    height: 48,
    borderWidth: 2,
    borderColor: colors.slate[300],
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
    fontSize: 15,
    fontWeight: '600',
    color: colors.slate[800],
  },
  inputWithPrefix: { paddingLeft: 8 },
  inputSingle: {
    height: 48,
    borderWidth: 2,
    borderColor: colors.slate[300],
    borderRadius: borderRadius.ios * 2,
    backgroundColor: colors.slate[50] + '4D',
    paddingHorizontal: spacing.p4,
    fontSize: 15,
    fontWeight: '600',
    color: colors.slate[800],
  },
  inputError: { borderColor: colors.rose[300], backgroundColor: colors.rose[50] + '33' },
  errorText: { fontSize: fontSize['10'], color: colors.rose[500], fontWeight: '700', marginTop: 4, marginLeft: 4 },
  primaryBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: borderRadius.ios * 2,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.py2,
  },
  primaryBtnDisabled: { backgroundColor: colors.slate[100] },
  primaryBtnText: { fontSize: fontSize.lg, fontWeight: '800', color: colors.white, textTransform: 'uppercase', letterSpacing: 2 },
  primaryBtnTextDisabled: { color: colors.slate[300] },
  codeSentText: { fontSize: fontSize.sm, color: colors.slate[500], textAlign: 'center', marginBottom: spacing.p6 },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: spacing.p6, maxWidth: 280, alignSelf: 'center' },
  codeInput: {
    width: 40,
    height: 48,
    borderWidth: 2,
    borderColor: colors.slate[300],
    borderRadius: borderRadius.ios * 2,
    backgroundColor: colors.slate[50] + '4D',
    textAlign: 'center',
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.slate[800],
  },
  resendWrap: { alignItems: 'center', marginBottom: spacing.p4 },
  resendText: { fontSize: fontSize['11'], fontWeight: '800', color: colors.sage, textTransform: 'uppercase', letterSpacing: 2 },
  resendTextDisabled: { color: colors.slate[300] },
  successContent: { alignItems: 'center', paddingVertical: spacing.p6 },
  successIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: colors.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.p6,
  },
  successTitle: { fontSize: fontSize.xl, fontWeight: '800', color: colors.slate[900], marginBottom: 8 },
  successSub: { fontSize: fontSize.xs, color: colors.slate[400], marginBottom: spacing.p8, textAlign: 'center' },
  footer: { marginTop: spacing.p6, paddingHorizontal: spacing.gap4 },
  footerText: { fontSize: fontSize['10'], color: colors.slate[300], textAlign: 'center', lineHeight: 18 },
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
