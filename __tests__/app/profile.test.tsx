import { Alert } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

jest.mock('@/lib/supabase', () => ({
  logout: jest.fn(),
}));

jest.mock('@/lib/global-provider', () => ({
  useGlobalContext: jest.fn(),
}));

import { logout } from '@/lib/supabase';
import { useGlobalContext } from '@/lib/global-provider';
import Profile from '@/app/(root)/(tabs)/profile';

const mockUseGlobalContext = useGlobalContext as jest.Mock;
const mockRefetch = jest.fn();

describe('Profile screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the user name and falls back to "User" when missing', async () => {
    mockUseGlobalContext.mockReturnValue({ user: null, refetch: mockRefetch });

    await render(<Profile />);

    expect(screen.getByText('User')).toBeTruthy();
  });

  it('renders the logged-in user name', async () => {
    mockUseGlobalContext.mockReturnValue({
      user: { id: '1', email: 'a@b.com', name: 'Jane Doe' },
      refetch: mockRefetch,
    });

    await render(<Profile />);

    expect(screen.getByText('Jane Doe')).toBeTruthy();
  });

  it('shows a success alert and refetches on successful logout', async () => {
    mockUseGlobalContext.mockReturnValue({ user: null, refetch: mockRefetch });
    (logout as jest.Mock).mockResolvedValueOnce(true);

    await render(<Profile />);
    await fireEvent.press(screen.getByText('Logout'));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Success', 'You have been logged out successfully.')
    );
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('shows an error alert and does not refetch on failed logout', async () => {
    mockUseGlobalContext.mockReturnValue({ user: null, refetch: mockRefetch });
    (logout as jest.Mock).mockResolvedValueOnce(false);

    await render(<Profile />);
    await fireEvent.press(screen.getByText('Logout'));

    await waitFor(() =>
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'An error occurred while logging out.')
    );
    expect(mockRefetch).not.toHaveBeenCalled();
  });
});
