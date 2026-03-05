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
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from '../src/components/Icon';
import { useApp } from '../context/AppState';
import { COUNTRY_CODES, type CountryCode } from '../src/constants';
import * as authService from '../src/api/authService';
import { colors, fontSize, spacing, borderRadius } from '../src/theme';

type RegisterStep = 'contact' | 'account' | 'verify';
type ContactMethod = 'email' | 'phone';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { lang, setLang } = useApp();
  const [step, setStep] = useState<RegisterStep>('contact');
  const [method, setMethod] = useState<ContactMethod>('email');
  const [contact, setContact] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
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

  const toggleMethod = () => {
    setMethod(method === 'email' ? 'phone' : 'email');
    setContact('');
    setError(null);
  };

  const handleCodeChange = (index: number, value: string) => {
    const v = value.length > 1 ? value.slice(-1) : value;
    const newCode = [...code];
    newCode[index] = v.replace(/\D/g, '');
    setCode(newCode);
    if (v && index < 5) codeRefs.current[index + 1]?.focus();
  };

  const isContactValid =
    method === 'email'
      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)
      : /^\d{7,15}$/.test(contact);

  const isAccountValid =
    name.trim().length > 0 &&
    password.length >= 6 &&
    password === confirmPassword;

  const handleRegister = () => {
    setError(null);
    setStep('verify');
    setIsLoading(true);
    const params = {
      password,
      name,
      email: method === 'email' ? contact : undefined,
      phone_number: method === 'phone' ? selectedCountry.code + contact : undefined,
    };
    authService
      .register(params)
      .then(() => setCountdown(60))
      .catch((err: { message?: string }) => {
        setError(err.message ?? (lang === 'en' ? 'Registration failed. Please try again.' : '注册失败，请重试。'));
      })
      .finally(() => setIsLoading(false));
  };

  const handleVerify = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const verificationCode = code.join('');
      const usernameParams =
        method === 'email'
          ? { email: contact }
          : { phone_number: selectedCountry.code + contact };
      await authService.verifyCode({ ...usernameParams, code: verificationCode });
      Alert.alert(
        lang === 'en' ? 'Success' : '成功',
        lang === 'en' ? 'Verification successful! Please login.' : '验证成功！请登录。',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? (lang === 'en' ? 'Verification failed. Please try again.' : '验证失败，请重试。'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = () => {
    if (countdown > 0 || isLoading) return;
    setIsLoading(true);
    setError(null);
    const params = {
      password,
      name,
      email: method === 'email' ? contact : undefined,
      phone_number: method === 'phone' ? selectedCountry.code + contact : undefined,
    };
    authService
      .register(params)
      .then(() => setCountdown(60))
      .catch((err: { message?: string }) => {
        setError(err.message ?? (lang === 'en' ? 'Failed to resend code.' : '重新发送失败。'));
      })
      .finally(() => setIsLoading(false));
  };

  const handleBack = () => {
    if (step === 'account') setStep('contact');
    else if (step === 'verify') setStep('account');
    else navigation.goBack();
  };

  const subtitle =
    step === 'contact'
      ? lang === 'en'
        ? 'Join the journey'
        : '加入旅程'
      : step === 'account'
        ? lang === 'en'
          ? 'Create Account'
          : '创建账户'
        : lang === 'en'
          ? 'Verify Identity'
          : '验证身份';

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

        {step === 'contact' && (
          <View style={styles.stepContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {method === 'email'
                  ? lang === 'en'
                    ? 'Email Address'
                    : '邮箱地址'
                  : lang === 'en'
                    ? 'Phone Number'
                    : '手机号码'}
              </Text>
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
                  placeholder={method === 'email' ? 'example@email.com' : lang === 'en' ? 'Enter number' : '请输入手机号'}
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
            <Pressable onPress={toggleMethod} style={styles.switchWrap}>
              <Text style={styles.switchText}>
                {method === 'email'
                  ? lang === 'en'
                    ? 'Switch to Phone'
                    : '切换至手机注册'
                  : lang === 'en'
                    ? 'Switch to Email'
                    : '切换至邮箱注册'}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setStep('account')}
              disabled={!isContactValid}
              style={[styles.primaryBtn, !isContactValid && styles.primaryBtnDisabled]}
            >
              <Text style={[styles.primaryBtnText, !isContactValid && styles.primaryBtnTextDisabled]}>
                {lang === 'en' ? 'Continue' : '继续'}
              </Text>
            </Pressable>
          </View>
        )}

        {step === 'account' && (
          <View style={styles.stepContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{lang === 'en' ? 'Full Name' : '姓名'}</Text>
              <TextInput
                style={styles.inputSingle}
                placeholder={lang === 'en' ? 'e.g. John Doe' : '例如：张伟'}
                placeholderTextColor={colors.slate[300]}
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{lang === 'en' ? 'Password' : '密码'}</Text>
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
              <Text style={styles.label}>{lang === 'en' ? 'Confirm Password' : '确认密码'}</Text>
              <TextInput
                style={[styles.inputSingle, confirmPassword && password !== confirmPassword && styles.inputError]}
                placeholder="••••••••"
                placeholderTextColor={colors.slate[300]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>
            <Pressable
              onPress={handleRegister}
              disabled={!isAccountValid || isLoading}
              style={[styles.primaryBtn, (!isAccountValid || isLoading) && styles.primaryBtnDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={[styles.primaryBtnText, !isAccountValid && styles.primaryBtnTextDisabled]}>
                  {lang === 'en' ? 'Get Verification Code' : '获取验证码'}
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
              onPress={handleVerify}
              disabled={code.some((c) => !c) || isLoading}
              style={[styles.primaryBtn, (code.some((c) => !c) || isLoading) && styles.primaryBtnDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={[styles.primaryBtnText, code.some((c) => !c) && styles.primaryBtnTextDisabled]}>
                  {lang === 'en' ? 'Verify and Complete' : '验证并完成注册'}
                </Text>
              )}
            </Pressable>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {lang === 'en'
              ? `By continuing, you agree to receive a one-time verification code via ${method === 'phone' ? 'SMS' : 'email'} for account authentication.`
              : `点击继续即表示您同意接收用于账户验证的一次性${method === 'phone' ? '短信' : '邮件'}验证码。`}
          </Text>
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
  logoSub: { fontSize: fontSize.xs, fontWeight: '500', color: colors.slate[400], textTransform: 'uppercase' },
  stepContent: { flex: 1, paddingTop: spacing.p4 },
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
    fontSize: 16,
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
  switchWrap: { alignItems: 'center', marginBottom: spacing.py2 },
  switchText: { fontSize: fontSize['11'], fontWeight: '800', color: colors.sage, textTransform: 'uppercase', letterSpacing: 2 },
  primaryBtn: {
    width: '100%',
    paddingVertical: spacing.p4,
    borderRadius: borderRadius.ios * 2,
    backgroundColor: colors.sage,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.py2,
  },
  primaryBtnDisabled: { backgroundColor: colors.slate[100] },
  primaryBtnText: { fontSize: fontSize.lg, fontWeight: '800', color: colors.white },
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
