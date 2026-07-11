import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { openAuthSessionAsync } from 'expo-web-browser';
import { createClient } from '@supabase/supabase-js';

import type { AppUser } from './types';

// ─── Chunked SecureStore adapter ─────────────────────────────────────────────
// expo-secure-store has a 2 KB per-value limit.
// Supabase sessions can exceed that, so we split large values into chunks.

const CHUNK_SIZE = 1800;

function chunkKey(key: string, index: number) {
  return `${key}_${index}`;
}

const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const countStr = await SecureStore.getItemAsync(`${key}_count`).catch(() => null);
    if (countStr !== null) {
      const count = parseInt(countStr, 10);
      const parts: string[] = [];
      for (let i = 0; i < count; i++) {
        const part = await SecureStore.getItemAsync(chunkKey(key, i)).catch(() => null);
        if (part === null) return null;
        parts.push(part);
      }
      return parts.join('');
    }
    return SecureStore.getItemAsync(key).catch(() => null);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const count = Math.ceil(value.length / CHUNK_SIZE);
    await SecureStore.setItemAsync(`${key}_count`, String(count));
    for (let i = 0; i < count; i++) {
      await SecureStore.setItemAsync(
        chunkKey(key, i),
        value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE)
      );
    }
  },

  async removeItem(key: string): Promise<void> {
    const countStr = await SecureStore.getItemAsync(`${key}_count`).catch(() => null);
    if (countStr !== null) {
      const count = parseInt(countStr, 10);
      await SecureStore.deleteItemAsync(`${key}_count`).catch(() => null);
      for (let i = 0; i < count; i++) {
        await SecureStore.deleteItemAsync(chunkKey(key, i)).catch(() => null);
      }
    } else {
      await SecureStore.deleteItemAsync(key).catch(() => null);
    }
  },
};

// ─── Supabase client ─────────────────────────────────────────────────────────

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

// ─── Auth helpers ─────────────────────────────────────────────────────────────

// Deep-link URI Supabase redirects back to after OAuth.
// Must exactly match an entry in Supabase Dashboard → Authentication → URL Configuration → Additional Redirect URLs.
// In production builds this resolves to: echelon://auth-callback
export const OAUTH_REDIRECT_URI = Linking.createURL('auth-callback');

export async function loginWithGoogle(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: OAUTH_REDIRECT_URI,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) throw error ?? new Error('No OAuth URL returned');

    // openAuthSessionAsync opens a browser tab and watches for the echelon:// scheme.
    // When Supabase redirects to echelon://auth-callback?code=…, the OS hands
    // control back to the app and openAuthSessionAsync returns the full URL.
    const result = await openAuthSessionAsync(data.url, OAUTH_REDIRECT_URI);
    if (result.type !== 'success') return false;

    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url);
    if (sessionError) throw sessionError;

    return true;
  } catch (err) {
    console.error('Google login error:', err);
    return false;
  }
}

export async function loginWithFacebook(): Promise<boolean> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: OAUTH_REDIRECT_URI,
        skipBrowserRedirect: true,
      },
    });

    if (error || !data.url) throw error ?? new Error('No OAuth URL returned');

    const result = await openAuthSessionAsync(data.url, OAUTH_REDIRECT_URI);
    if (result.type !== 'success') return false;

    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(result.url);
    if (sessionError) throw sessionError;

    return true;
  } catch (err) {
    console.error('Facebook login error:', err);
    return false;
  }
}

export interface AuthResult {
  error: string | null;
  needsOtp?: boolean;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
): Promise<AuthResult> {
  const firstName = fullName.trim().split(' ')[0];
  const lastName = fullName.trim().split(' ').slice(1).join(' ');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName.trim(),
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (error) return { error: error.message };

  // If email confirmation is required, the user won't have a session yet
  const needsOtp = !data.session;
  return { error: null, needsOtp };
}

export async function verifyEmailOtp(email: string, otp: string): Promise<AuthResult> {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: 'signup',
  });
  return { error: error?.message ?? null };
}

export async function requestPasswordReset(email: string): Promise<AuthResult> {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  return { error: error?.message ?? null };
}

export async function verifyPasswordResetOtp(email: string, otp: string): Promise<AuthResult> {
  const { error } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: 'recovery',
  });
  return { error: error?.message ?? null };
}

export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error?.message ?? null };
}

export async function logout(): Promise<boolean> {
  const { error } = await supabase.auth.signOut();
  if (error) console.error('Logout error:', error);
  return !error;
}

export async function getCurrentUser(): Promise<AppUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, role')
      .eq('id', user.id)
      .single();

    return {
      id: user.id,
      email: user.email ?? '',
      name: profile?.full_name ?? user.user_metadata?.full_name ?? user.email ?? '',
      avatar: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? undefined,
      role: profile?.role ?? 'buyer',
    };
  } catch {
    return null;
  }
}
