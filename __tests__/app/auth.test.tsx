import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

jest.mock('@/lib/supabase', () => ({
  loginWithGoogle: jest.fn(),
  signInWithEmail: jest.fn(),
  signUpWithEmail: jest.fn(),
  verifyEmailOtp: jest.fn(),
}));

jest.mock('@/lib/global-provider', () => ({
  useGlobalContext: jest.fn(),
}));

import {
  loginWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  verifyEmailOtp,
} from '@/lib/supabase';
import { useGlobalContext } from '@/lib/global-provider';
import EmailAuth from '@/app/auth';

const mockUseGlobalContext = useGlobalContext as jest.Mock;
const mockRefetch = jest.fn();

describe('EmailAuth screen (app/auth.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseGlobalContext.mockReturnValue({ refetch: mockRefetch });
  });

  describe('sign-in', () => {
    it('shows validation errors and does not call the API for an invalid form', async () => {
      await render(<EmailAuth />);

      await fireEvent.press(screen.getByText('Sign In'));

      expect(await screen.findByText('Enter a valid email address.')).toBeTruthy();
      expect(screen.getByText('Password must be at least 6 characters.')).toBeTruthy();
      expect(signInWithEmail).not.toHaveBeenCalled();
    });

    it('signs in successfully and navigates home', async () => {
      (signInWithEmail as jest.Mock).mockResolvedValueOnce({ error: null });
      await render(<EmailAuth />);

      await fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'user@example.com');
      await fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'password1');
      await fireEvent.press(screen.getByText('Sign In'));

      await waitFor(() => expect(signInWithEmail).toHaveBeenCalledWith('user@example.com', 'password1'));
      expect(mockRefetch).toHaveBeenCalled();
      expect(router.replace).toHaveBeenCalledWith('/');
    });

    it('shows the general error message on failed sign-in', async () => {
      (signInWithEmail as jest.Mock).mockResolvedValueOnce({ error: 'Invalid login credentials' });
      await render(<EmailAuth />);

      await fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'user@example.com');
      await fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'password1');
      await fireEvent.press(screen.getByText('Sign In'));

      expect(await screen.findByText('Invalid login credentials')).toBeTruthy();
      expect(router.replace).not.toHaveBeenCalled();
    });
  });

  describe('sign-up', () => {
    it('switches to the OTP screen when signup needs email confirmation', async () => {
      (signUpWithEmail as jest.Mock).mockResolvedValueOnce({ error: null, needsOtp: true });
      await render(<EmailAuth />);

      await fireEvent.press(screen.getByText(/Don't have an account?/));
      await fireEvent.changeText(screen.getByPlaceholderText('Jane Doe'), 'Jane Doe');
      await fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'jane@example.com');
      await fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'password1');
      await fireEvent.press(screen.getByText('Create Account'));

      expect(await screen.findByText('Check your email')).toBeTruthy();
      expect(screen.getByText('jane@example.com')).toBeTruthy();
      expect(router.replace).not.toHaveBeenCalled();
    });

    it('navigates home directly when signup does not require OTP', async () => {
      (signUpWithEmail as jest.Mock).mockResolvedValueOnce({ error: null, needsOtp: false });
      await render(<EmailAuth />);

      await fireEvent.press(screen.getByText(/Don't have an account?/));
      await fireEvent.changeText(screen.getByPlaceholderText('Jane Doe'), 'Jane Doe');
      await fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'jane@example.com');
      await fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'password1');
      await fireEvent.press(screen.getByText('Create Account'));

      await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
      expect(router.replace).toHaveBeenCalledWith('/');
    });
  });

  describe('otp verification', () => {
    async function getToOtpScreen() {
      (signUpWithEmail as jest.Mock).mockResolvedValueOnce({ error: null, needsOtp: true });
      await render(<EmailAuth />);

      await fireEvent.press(screen.getByText(/Don't have an account?/));
      await fireEvent.changeText(screen.getByPlaceholderText('Jane Doe'), 'Jane Doe');
      await fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'jane@example.com');
      await fireEvent.changeText(screen.getByPlaceholderText('At least 6 characters'), 'password1');
      await fireEvent.press(screen.getByText('Create Account'));

      await screen.findByText('Check your email');
    }

    it('verifies successfully and navigates home', async () => {
      await getToOtpScreen();
      (verifyEmailOtp as jest.Mock).mockResolvedValueOnce({ error: null });

      await fireEvent.changeText(screen.getByPlaceholderText('Enter 8-digit code'), '12345678');
      await fireEvent.press(screen.getByText('Verify Email'));

      await waitFor(() =>
        expect(verifyEmailOtp).toHaveBeenCalledWith('jane@example.com', '12345678')
      );
      expect(router.replace).toHaveBeenCalledWith('/');
    });

    it('shows an error for an invalid code format without calling the API', async () => {
      await getToOtpScreen();

      await fireEvent.changeText(screen.getByPlaceholderText('Enter 8-digit code'), '123');
      await fireEvent.press(screen.getByText('Verify Email'));

      expect(await screen.findByText('Enter the 8-digit code from your email.')).toBeTruthy();
      expect(verifyEmailOtp).not.toHaveBeenCalled();
    });
  });

  describe('google login', () => {
    it('refetches and navigates home on success', async () => {
      (loginWithGoogle as jest.Mock).mockResolvedValueOnce(true);
      await render(<EmailAuth />);

      await fireEvent.press(screen.getByText('Continue with Google'));

      await waitFor(() => expect(mockRefetch).toHaveBeenCalled());
      expect(router.replace).toHaveBeenCalledWith('/');
    });
  });
});
