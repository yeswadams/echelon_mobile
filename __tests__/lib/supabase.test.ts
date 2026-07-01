jest.mock('@supabase/supabase-js', () => {
  const mockAuth = {
    signInWithOAuth: jest.fn(),
    exchangeCodeForSession: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    verifyOtp: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
  };
  const mockProfileSingle = jest.fn();
  const mockFrom = jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: mockProfileSingle,
  }));
  return {
    createClient: jest.fn(() => ({ auth: mockAuth, from: mockFrom })),
    __mockAuth: mockAuth,
    __mockProfileSingle: mockProfileSingle,
  };
});

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
}));

jest.mock('expo-linking', () => ({
  createURL: jest.fn(() => 'echelon://auth-callback'),
}));

import * as SupabaseJs from '@supabase/supabase-js';
import { openAuthSessionAsync } from 'expo-web-browser';
import {
  getCurrentUser,
  loginWithFacebook,
  loginWithGoogle,
  logout,
  signInWithEmail,
  signUpWithEmail,
  verifyEmailOtp,
} from '@/lib/supabase';

const mockAuth = (SupabaseJs as any).__mockAuth;
const mockProfileSingle = (SupabaseJs as any).__mockProfileSingle;

describe('lib/supabase auth helpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithEmail', () => {
    it('returns no error on success', async () => {
      mockAuth.signInWithPassword.mockResolvedValueOnce({ error: null });

      const result = await signInWithEmail('user@example.com', 'password1');

      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password1',
      });
      expect(result).toEqual({ error: null });
    });

    it('passes through the Supabase error message on failure', async () => {
      mockAuth.signInWithPassword.mockResolvedValueOnce({
        error: { message: 'Invalid login credentials' },
      });

      const result = await signInWithEmail('user@example.com', 'wrong');

      expect(result).toEqual({ error: 'Invalid login credentials' });
    });
  });

  describe('signUpWithEmail', () => {
    it('splits a multi-word name into first/last name metadata', async () => {
      mockAuth.signUp.mockResolvedValueOnce({ data: { session: {} }, error: null });

      await signUpWithEmail('user@example.com', 'password1', 'Jane Ann Doe');

      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'password1',
        options: {
          data: { full_name: 'Jane Ann Doe', first_name: 'Jane', last_name: 'Ann Doe' },
        },
      });
    });

    it('handles a single-word name with an empty last name', async () => {
      mockAuth.signUp.mockResolvedValueOnce({ data: { session: {} }, error: null });

      await signUpWithEmail('user@example.com', 'password1', 'Cher');

      expect(mockAuth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          options: { data: { full_name: 'Cher', first_name: 'Cher', last_name: '' } },
        })
      );
    });

    it('reports needsOtp: true when Supabase returns no session (email confirmation required)', async () => {
      mockAuth.signUp.mockResolvedValueOnce({ data: { session: null }, error: null });

      const result = await signUpWithEmail('user@example.com', 'password1', 'Jane Doe');

      expect(result).toEqual({ error: null, needsOtp: true });
    });

    it('reports needsOtp: false when Supabase returns an immediate session', async () => {
      mockAuth.signUp.mockResolvedValueOnce({ data: { session: { access_token: 'x' } }, error: null });

      const result = await signUpWithEmail('user@example.com', 'password1', 'Jane Doe');

      expect(result).toEqual({ error: null, needsOtp: false });
    });

    it('returns the error message and skips the OTP branch on failure', async () => {
      mockAuth.signUp.mockResolvedValueOnce({
        data: { session: null },
        error: { message: 'Email already registered' },
      });

      const result = await signUpWithEmail('user@example.com', 'password1', 'Jane Doe');

      expect(result).toEqual({ error: 'Email already registered' });
    });
  });

  describe('verifyEmailOtp', () => {
    it('returns no error on success', async () => {
      mockAuth.verifyOtp.mockResolvedValueOnce({ error: null });

      const result = await verifyEmailOtp('user@example.com', '12345678');

      expect(mockAuth.verifyOtp).toHaveBeenCalledWith({
        email: 'user@example.com',
        token: '12345678',
        type: 'signup',
      });
      expect(result).toEqual({ error: null });
    });

    it('passes through the error message on failure', async () => {
      mockAuth.verifyOtp.mockResolvedValueOnce({ error: { message: 'Invalid or expired code' } });

      const result = await verifyEmailOtp('user@example.com', '00000000');

      expect(result).toEqual({ error: 'Invalid or expired code' });
    });
  });

  describe('logout', () => {
    it('returns true on success', async () => {
      mockAuth.signOut.mockResolvedValueOnce({ error: null });

      await expect(logout()).resolves.toBe(true);
    });

    it('returns false and logs (without throwing) on failure', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockAuth.signOut.mockResolvedValueOnce({ error: { message: 'network error' } });

      await expect(logout()).resolves.toBe(false);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('getCurrentUser', () => {
    it('returns null when there is no authenticated user', async () => {
      mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });

      await expect(getCurrentUser()).resolves.toBeNull();
    });

    it('returns null when auth.getUser errors', async () => {
      mockAuth.getUser.mockResolvedValueOnce({ data: { user: null }, error: { message: 'expired' } });

      await expect(getCurrentUser()).resolves.toBeNull();
    });

    it('merges the profiles row over auth metadata when a profile exists', async () => {
      mockAuth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-1',
            email: 'user@example.com',
            user_metadata: { full_name: 'Metadata Name', avatar_url: 'metadata-avatar.png' },
          },
        },
        error: null,
      });
      mockProfileSingle.mockResolvedValueOnce({
        data: { full_name: 'Profile Name', avatar_url: 'profile-avatar.png', role: 'agent' },
        error: null,
      });

      const result = await getCurrentUser();

      expect(result).toEqual({
        id: 'user-1',
        email: 'user@example.com',
        name: 'Profile Name',
        avatar: 'profile-avatar.png',
        role: 'agent',
      });
    });

    it('falls back to auth metadata and defaults role to buyer when no profile row exists', async () => {
      mockAuth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-2',
            email: 'user2@example.com',
            user_metadata: { full_name: 'Metadata Name' },
          },
        },
        error: null,
      });
      mockProfileSingle.mockResolvedValueOnce({ data: null, error: { message: 'not found' } });

      const result = await getCurrentUser();

      expect(result).toEqual({
        id: 'user-2',
        email: 'user2@example.com',
        name: 'Metadata Name',
        avatar: undefined,
        role: 'buyer',
      });
    });

    it('returns null if an unexpected exception is thrown', async () => {
      mockAuth.getUser.mockRejectedValueOnce(new Error('boom'));

      await expect(getCurrentUser()).resolves.toBeNull();
    });
  });

  describe('loginWithGoogle', () => {
    it('returns false when signInWithOAuth errors', async () => {
      mockAuth.signInWithOAuth.mockResolvedValueOnce({ data: { url: null }, error: { message: 'oauth error' } });

      await expect(loginWithGoogle()).resolves.toBe(false);
    });

    it('returns false when the browser session is dismissed', async () => {
      mockAuth.signInWithOAuth.mockResolvedValueOnce({ data: { url: 'https://oauth-url' }, error: null });
      (openAuthSessionAsync as jest.Mock).mockResolvedValueOnce({ type: 'dismiss' });

      await expect(loginWithGoogle()).resolves.toBe(false);
      expect(mockAuth.exchangeCodeForSession).not.toHaveBeenCalled();
    });

    it('returns false when exchangeCodeForSession fails', async () => {
      mockAuth.signInWithOAuth.mockResolvedValueOnce({ data: { url: 'https://oauth-url' }, error: null });
      (openAuthSessionAsync as jest.Mock).mockResolvedValueOnce({
        type: 'success',
        url: 'echelon://auth-callback?code=abc',
      });
      mockAuth.exchangeCodeForSession.mockResolvedValueOnce({ error: { message: 'exchange failed' } });

      await expect(loginWithGoogle()).resolves.toBe(false);
    });

    it('returns true on a full successful round trip', async () => {
      mockAuth.signInWithOAuth.mockResolvedValueOnce({ data: { url: 'https://oauth-url' }, error: null });
      (openAuthSessionAsync as jest.Mock).mockResolvedValueOnce({
        type: 'success',
        url: 'echelon://auth-callback?code=abc',
      });
      mockAuth.exchangeCodeForSession.mockResolvedValueOnce({ error: null });

      await expect(loginWithGoogle()).resolves.toBe(true);
    });
  });

  describe('loginWithFacebook', () => {
    it('returns true on a full successful round trip', async () => {
      mockAuth.signInWithOAuth.mockResolvedValueOnce({ data: { url: 'https://oauth-url' }, error: null });
      (openAuthSessionAsync as jest.Mock).mockResolvedValueOnce({
        type: 'success',
        url: 'echelon://auth-callback?code=abc',
      });
      mockAuth.exchangeCodeForSession.mockResolvedValueOnce({ error: null });

      await expect(loginWithFacebook()).resolves.toBe(true);
    });
  });
});
