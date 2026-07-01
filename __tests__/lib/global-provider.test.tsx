import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(),
    },
  },
  getCurrentUser: jest.fn(),
}));

import { getCurrentUser, supabase } from '@/lib/supabase';
import { GlobalProvider, useGlobalContext } from '@/lib/global-provider';

const mockGetCurrentUser = getCurrentUser as jest.Mock;
const mockOnAuthStateChange = supabase.auth.onAuthStateChange as jest.Mock;

function wrapper({ children }: { children: React.ReactNode }) {
  return <GlobalProvider>{children}</GlobalProvider>;
}

describe('GlobalProvider / useGlobalContext', () => {
  let authStateCallback: (event: string, session: unknown) => void;
  let unsubscribe: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    unsubscribe = jest.fn();
    mockOnAuthStateChange.mockImplementation((cb: any) => {
      authStateCallback = cb;
      return { data: { subscription: { unsubscribe } } };
    });
  });

  it('resolves to logged-out when getCurrentUser returns null', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);

    const { result } = await renderHook(() => useGlobalContext(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('resolves to logged-in when getCurrentUser returns a user', async () => {
    const user = { id: '1', email: 'a@b.com', name: 'Jane' };
    mockGetCurrentUser.mockResolvedValueOnce(user);

    const { result } = await renderHook(() => useGlobalContext(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.user).toEqual(user);
  });

  it('re-fetches the user when onAuthStateChange fires with a session', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);
    const { result } = await renderHook(() => useGlobalContext(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const user = { id: '2', email: 'c@d.com', name: 'Sam' };
    mockGetCurrentUser.mockResolvedValueOnce(user);

    await authStateCallback('SIGNED_IN', { user: { id: '2' } });

    await waitFor(() => expect(result.current.user).toEqual(user));
    expect(mockGetCurrentUser).toHaveBeenCalledTimes(2);
  });

  it('clears the user without calling getCurrentUser when onAuthStateChange fires with no session', async () => {
    mockGetCurrentUser.mockResolvedValueOnce({ id: '1', email: 'a@b.com', name: 'Jane' });
    const { result } = await renderHook(() => useGlobalContext(), { wrapper });
    await waitFor(() => expect(result.current.isLoggedIn).toBe(true));

    mockGetCurrentUser.mockClear();

    await authStateCallback('SIGNED_OUT', null);

    await waitFor(() => expect(result.current.user).toBeNull());
    expect(result.current.loading).toBe(false);
    expect(mockGetCurrentUser).not.toHaveBeenCalled();
  });

  it('refetch() re-invokes getCurrentUser', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);
    const { result } = await renderHook(() => useGlobalContext(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    mockGetCurrentUser.mockResolvedValueOnce({ id: '3', email: 'e@f.com', name: 'Alex' });
    await result.current.refetch({});

    await waitFor(() => expect(result.current.isLoggedIn).toBe(true));
  });

  it('unsubscribes from auth state changes on unmount', async () => {
    mockGetCurrentUser.mockResolvedValueOnce(null);
    const { result, unmount } = await renderHook(() => useGlobalContext(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    await unmount();

    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('throws when used outside a GlobalProvider', async () => {
    const { result } = await renderHook(() => {
      try {
        return useGlobalContext();
      } catch (err) {
        return err;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
    expect((result.current as Error).message).toMatch(/must be used within a GlobalProvider/);
  });
});
