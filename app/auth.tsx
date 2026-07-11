import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, router } from 'expo-router';

import {
  loginWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  verifyEmailOtp,
  requestPasswordReset,
  verifyPasswordResetOtp,
  updatePassword,
} from '@/lib/supabase';
import { useGlobalContext } from '@/lib/global-provider';
import icons from '@/constants/icons';

// ─── Types ──────────────────────────────────────────────────────────────────

type Screen = 'signin' | 'signup' | 'otp' | 'forgot' | 'reset';

interface FormState {
  name: string;
  email: string;
  password: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  otp?: string;
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  maxLength,
  error,
  autoCapitalize = 'none',
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric';
  maxLength?: number;
  error?: string;
  autoCapitalize?: 'none' | 'words' | 'sentences';
}) {
  return (
    <View className="gap-1">
      <Text className="text-sm font-rubik-medium text-black-300">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#a0a0b0"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        className={`border rounded-xl px-4 py-3.5 text-base font-rubik text-black-300 ${
          error ? 'border-red-400' : 'border-primary-200'
        } bg-white`}
      />
      {error ? (
        <Text className="text-xs text-red-500 font-rubik ml-1">{error}</Text>
      ) : null}
    </View>
  );
}

function Divider() {
  return (
    <View className="flex flex-row items-center gap-3 my-2">
      <View className="flex-1 h-px bg-primary-200" />
      <Text className="text-sm font-rubik text-black-100">or</Text>
      <View className="flex-1 h-px bg-primary-200" />
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

const EmailAuth = () => {
  const { refetch, loading: authLoading, isLoggedIn } = useGlobalContext();

  const [screen, setScreen] = useState<Screen>('signin');
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');

  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    password: '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  if (!authLoading && isLoggedIn) return <Redirect href="/" />;

  function setField(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined, general: undefined }));
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  function validateSignIn(): boolean {
    const next: FormErrors = {};
    if (!isValidEmail(form.email)) next.email = 'Enter a valid email address.';
    if (form.password.length < 6) next.password = 'Password must be at least 6 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateSignUp(): boolean {
    const next: FormErrors = {};
    if (!form.name.trim()) next.name = 'Full name is required.';
    if (!isValidEmail(form.email)) next.email = 'Enter a valid email address.';
    if (form.password.length < 6) next.password = 'Password must be at least 6 characters.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateOtp(): boolean {
    const next: FormErrors = {};
    if (!/^\d{8}$/.test(form.otp.trim())) next.otp = 'Enter the 8-digit code from your email.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateForgot(): boolean {
    const next: FormErrors = {};
    if (!isValidEmail(form.email)) next.email = 'Enter a valid email address.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function validateReset(): boolean {
    const next: FormErrors = {};
    if (!/^\d{8}$/.test(form.otp.trim())) next.otp = 'Enter the 8-digit code from your email.';
    if (form.newPassword.length < 6) next.newPassword = 'Password must be at least 6 characters.';
    if (form.confirmPassword !== form.newPassword) next.confirmPassword = 'Passwords do not match.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await loginWithGoogle();
    setLoading(false);
    if (result) {
      refetch({});
      router.replace('/');
    } else {
      Alert.alert('Error', 'Google login failed. Please try again.');
    }
  };

  const handleSignIn = async () => {
    if (!validateSignIn()) return;
    setLoading(true);
    const { error } = await signInWithEmail(form.email.trim(), form.password);
    setLoading(false);
    if (error) {
      setErrors({ general: error });
      return;
    }
    refetch({});
    router.replace('/');
  };

  const handleSignUp = async () => {
    if (!validateSignUp()) return;
    setLoading(true);
    const { error, needsOtp } = await signUpWithEmail(
      form.email.trim(),
      form.password,
      form.name.trim()
    );
    setLoading(false);
    if (error) {
      setErrors({ general: error });
      return;
    }
    if (needsOtp) {
      setPendingEmail(form.email.trim());
      setScreen('otp');
    } else {
      refetch({});
      router.replace('/');
    }
  };

  const handleVerifyOtp = async () => {
    if (!validateOtp()) return;
    setLoading(true);
    const { error } = await verifyEmailOtp(pendingEmail, form.otp.trim());
    setLoading(false);
    if (error) {
      setErrors({ otp: error });
      return;
    }
    refetch({});
    router.replace('/');
  };

  const handleForgotPassword = async () => {
    if (!validateForgot()) return;
    setLoading(true);
    const { error } = await requestPasswordReset(form.email.trim());
    setLoading(false);
    if (error) {
      setErrors({ general: error });
      return;
    }
    setPendingEmail(form.email.trim());
    setScreen('reset');
  };

  const handleResetPassword = async () => {
    if (!validateReset()) return;
    setLoading(true);
    const { error: otpError } = await verifyPasswordResetOtp(pendingEmail, form.otp.trim());
    if (otpError) {
      setLoading(false);
      setErrors({ otp: otpError });
      return;
    }
    const { error: updateError } = await updatePassword(form.newPassword);
    setLoading(false);
    if (updateError) {
      setErrors({ general: updateError });
      return;
    }
    // verifyOtp(type: 'recovery') establishes a session, so the user is
    // already signed in at this point once the new password is set.
    refetch({});
    router.replace('/');
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex flex-row items-center px-5 pt-4 pb-2">
            <Pressable
              onPress={() => {
                if (screen === 'otp') setScreen('signup');
                else if (screen === 'reset') setScreen('forgot');
                else if (screen === 'forgot') setScreen('signin');
                else router.back();
              }}
              className="flex flex-row bg-primary-200 rounded-full size-10 items-center justify-center mr-3"
            >
              <Image source={icons.backArrow} className="size-4" />
            </Pressable>
            <Text className="text-lg font-rubik-bold text-black-300">Echelon Realty</Text>
          </View>

          <View className="px-6 pt-4 pb-10 gap-5">
            {/* ── Forgot Password Screen ───────────────────────────────── */}
            {screen === 'forgot' ? (
              <>
                <View className="gap-1">
                  <Text className="text-2xl font-rubik-bold text-black-300">
                    Reset your password
                  </Text>
                  <Text className="text-base font-rubik text-black-100 mt-1">
                    Enter your email and we&apos;ll send you an 8-digit code to reset your
                    password.
                  </Text>
                </View>

                <Field
                  label="Email"
                  value={form.email}
                  onChangeText={(v) => setField('email', v)}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  error={errors.email}
                />

                {errors.general ? (
                  <Text className="text-sm text-red-500 font-rubik text-center">
                    {errors.general}
                  </Text>
                ) : null}

                <Pressable
                  onPress={handleForgotPassword}
                  disabled={loading}
                  className="bg-primary-300 rounded-full py-4 items-center"
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-lg font-rubik-bold">Send Reset Code</Text>
                  )}
                </Pressable>
              </>
            ) : screen === 'reset' ? (
              <>
                {/* ── Reset Password Screen ─────────────────────────────── */}
                <View className="gap-1">
                  <Text className="text-2xl font-rubik-bold text-black-300">
                    Check your email
                  </Text>
                  <Text className="text-base font-rubik text-black-100 mt-1">
                    We sent an 8-digit code to{'\n'}
                    <Text className="font-rubik-medium text-black-300">{pendingEmail}</Text>
                  </Text>
                </View>

                <Field
                  label="Verification code"
                  value={form.otp}
                  onChangeText={(v) => setField('otp', v)}
                  placeholder="Enter 8-digit code"
                  keyboardType="numeric"
                  maxLength={8}
                  error={errors.otp}
                />

                <Field
                  label="New password"
                  value={form.newPassword}
                  onChangeText={(v) => setField('newPassword', v)}
                  placeholder="At least 6 characters"
                  secureTextEntry
                  error={errors.newPassword}
                />

                <Field
                  label="Confirm new password"
                  value={form.confirmPassword}
                  onChangeText={(v) => setField('confirmPassword', v)}
                  placeholder="Re-enter your new password"
                  secureTextEntry
                  error={errors.confirmPassword}
                />

                {errors.general ? (
                  <Text className="text-sm text-red-500 font-rubik text-center">
                    {errors.general}
                  </Text>
                ) : null}

                <Pressable
                  onPress={handleResetPassword}
                  disabled={loading}
                  className="bg-primary-300 rounded-full py-4 items-center"
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-lg font-rubik-bold">Reset Password</Text>
                  )}
                </Pressable>

                <Pressable onPress={() => setScreen('forgot')} className="items-center">
                  <Text className="text-sm font-rubik text-black-100">
                    Didn&apos;t receive a code?{' '}
                    <Text className="text-primary-300 font-rubik-medium">Go back</Text>
                  </Text>
                </Pressable>
              </>
            ) : /* ── OTP Screen ────────────────────────────────────────────── */
            screen === 'otp' ? (
              <>
                <View className="gap-1">
                  <Text className="text-2xl font-rubik-bold text-black-300">
                    Check your email
                  </Text>
                  <Text className="text-base font-rubik text-black-100 mt-1">
                    We sent an 8-digit code to{'\n'}
                    <Text className="font-rubik-medium text-black-300">{pendingEmail}</Text>
                  </Text>
                </View>

                <Field
                  label="Verification code"
                  value={form.otp}
                  onChangeText={(v) => setField('otp', v)}
                  placeholder="Enter 8-digit code"
                  keyboardType="numeric"
                  maxLength={8}
                  error={errors.otp}
                />

                {errors.general ? (
                  <Text className="text-sm text-red-500 font-rubik text-center">
                    {errors.general}
                  </Text>
                ) : null}

                <Pressable
                  onPress={handleVerifyOtp}
                  disabled={loading}
                  className="bg-primary-300 rounded-full py-4 items-center"
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-lg font-rubik-bold">Verify Email</Text>
                  )}
                </Pressable>

                <Pressable onPress={() => setScreen('signup')} className="items-center">
                  <Text className="text-sm font-rubik text-black-100">
                    Didn&apos;t receive a code?{' '}
                    <Text className="text-primary-300 font-rubik-medium">Go back</Text>
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                {/* ── Sign In / Sign Up ──────────────────────────────────── */}
                <View className="gap-1">
                  <Text className="text-2xl font-rubik-bold text-black-300">
                    {screen === 'signin' ? 'Welcome back' : 'Create account'}
                  </Text>
                  <Text className="text-base font-rubik text-black-100">
                    {screen === 'signin'
                      ? 'Sign in to your Echelon account'
                      : 'Start your property journey today'}
                  </Text>
                </View>

                {/* Google */}
                <Pressable
                  onPress={handleGoogleLogin}
                  disabled={loading}
                  className="border border-primary-200 rounded-full py-3.5 bg-white shadow-sm shadow-zinc-200"
                >
                  <View className="flex flex-row items-center justify-center gap-2">
                    <Image source={icons.google} className="w-5 h-5" resizeMode="contain" />
                    <Text className="text-base font-rubik-medium text-black-300">
                      Continue with Google
                    </Text>
                  </View>
                </Pressable>

                <Divider />

                {/* Sign-up only: name field */}
                {screen === 'signup' && (
                  <Field
                    label="Full name"
                    value={form.name}
                    onChangeText={(v) => setField('name', v)}
                    placeholder="Jane Doe"
                    autoCapitalize="words"
                    error={errors.name}
                  />
                )}

                <Field
                  label="Email"
                  value={form.email}
                  onChangeText={(v) => setField('email', v)}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  error={errors.email}
                />

                <Field
                  label="Password"
                  value={form.password}
                  onChangeText={(v) => setField('password', v)}
                  placeholder="At least 6 characters"
                  secureTextEntry
                  error={errors.password}
                />

                {screen === 'signin' && (
                  <Pressable
                    onPress={() => {
                      setErrors({});
                      setScreen('forgot');
                    }}
                    className="items-end -mt-2"
                  >
                    <Text className="text-sm font-rubik-medium text-primary-300">
                      Forgot password?
                    </Text>
                  </Pressable>
                )}

                {errors.general ? (
                  <Text className="text-sm text-red-500 font-rubik text-center -mt-1">
                    {errors.general}
                  </Text>
                ) : null}

                {/* Submit */}
                <Pressable
                  onPress={screen === 'signin' ? handleSignIn : handleSignUp}
                  disabled={loading}
                  className="bg-primary-300 rounded-full py-4 items-center"
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text className="text-white text-lg font-rubik-bold">
                      {screen === 'signin' ? 'Sign In' : 'Create Account'}
                    </Text>
                  )}
                </Pressable>

                {/* Toggle sign-in / sign-up */}
                <Pressable
                  onPress={() => {
                    setScreen(screen === 'signin' ? 'signup' : 'signin');
                    setErrors({});
                  }}
                  className="items-center"
                >
                  <Text className="text-sm font-rubik text-black-100">
                    {screen === 'signin'
                      ? "Don't have an account? "
                      : 'Already have an account? '}
                    <Text className="text-primary-300 font-rubik-medium">
                      {screen === 'signin' ? 'Sign Up' : 'Sign In'}
                    </Text>
                  </Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default EmailAuth;
