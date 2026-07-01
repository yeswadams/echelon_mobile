import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

jest.mock('@/lib/supabase', () => ({
  loginWithGoogle: jest.fn(),
}));

jest.mock('@/lib/global-provider', () => ({
  useGlobalContext: jest.fn(),
}));

import { loginWithGoogle } from '@/lib/supabase';
import { useGlobalContext } from '@/lib/global-provider';
import Auth from '@/app/sign-in';

const mockUseGlobalContext = useGlobalContext as jest.Mock;
const mockRefetch = jest.fn();

describe('Auth screen (app/sign-in.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects (does not render the sign-in form) when already logged in', async () => {
    mockUseGlobalContext.mockReturnValue({ refetch: mockRefetch, loading: false, isLoggedIn: true });

    await render(<Auth />);

    expect(screen.queryByText('Continue with Google')).toBeNull();
  });

  it('renders the sign-in form when logged out', async () => {
    mockUseGlobalContext.mockReturnValue({ refetch: mockRefetch, loading: false, isLoggedIn: false });

    await render(<Auth />);

    expect(screen.getByText('Continue with Google')).toBeTruthy();
    expect(screen.getByText('Continue with Email')).toBeTruthy();
  });

  it('refetches on successful Google login', async () => {
    mockUseGlobalContext.mockReturnValue({ refetch: mockRefetch, loading: false, isLoggedIn: false });
    (loginWithGoogle as jest.Mock).mockResolvedValueOnce(true);

    await render(<Auth />);
    await fireEvent.press(screen.getByText('Continue with Google'));

    await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
  });

  it('shows an alert on failed Google login', async () => {
    mockUseGlobalContext.mockReturnValue({ refetch: mockRefetch, loading: false, isLoggedIn: false });
    (loginWithGoogle as jest.Mock).mockResolvedValueOnce(false);

    await render(<Auth />);
    await fireEvent.press(screen.getByText('Continue with Google'));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to login. Please try again.')
    );
    expect(mockRefetch).not.toHaveBeenCalled();
  });
});
