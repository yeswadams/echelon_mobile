import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import * as ExpoRouter from 'expo-router';

jest.mock('@/lib/sanity', () => ({
  getFeaturedProperties: jest.fn(),
  getProperties: jest.fn(),
}));

jest.mock('@/lib/global-provider', () => ({
  useGlobalContext: jest.fn(),
}));

jest.mock('@/lib/sanityImage', () => ({
  urlFor: jest.fn(),
}));

import { getFeaturedProperties, getProperties } from '@/lib/sanity';
import { useGlobalContext } from '@/lib/global-provider';
import { urlFor } from '@/lib/sanityImage';
import Home from '@/app/(root)/(tabs)/index';
import type { SanityPropertyListing } from '@/lib/types';

const mockGetFeaturedProperties = getFeaturedProperties as jest.Mock;
const mockGetProperties = getProperties as jest.Mock;
const mockUseGlobalContext = useGlobalContext as jest.Mock;
const mockUrlFor = urlFor as jest.Mock;

function makeChain(url: string) {
  const chain: any = {};
  chain.width = jest.fn(() => chain);
  chain.height = jest.fn(() => chain);
  chain.fit = jest.fn(() => chain);
  chain.auto = jest.fn(() => chain);
  chain.url = jest.fn(() => url);
  return chain;
}

function makeListing(id: string, title: string): SanityPropertyListing {
  return {
    _id: id,
    title,
    slug: { current: title },
    listingType: 'sale',
    propertyType: 'apartment',
    price: 1000000,
    currency: 'KES',
    location: { area: 'Kilimani', city: 'Nairobi' },
  };
}

describe('Home screen (app/(root)/(tabs)/index.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ExpoRouter as any).__setMockSearchParams({});
    mockUseGlobalContext.mockReturnValue({ user: { id: '1', name: 'Jane', email: 'a@b.com' } });
    mockUrlFor.mockReturnValue(makeChain('https://img/1.jpg'));
  });

  it('renders featured and recommended properties once loaded', async () => {
    mockGetFeaturedProperties.mockResolvedValueOnce([makeListing('f1', 'Featured Villa')]);
    mockGetProperties.mockResolvedValueOnce([makeListing('p1', 'Recommended Flat')]);

    await render(<Home />);

    expect(await screen.findByText('Featured Villa')).toBeTruthy();
    expect(await screen.findByText('Recommended Flat')).toBeTruthy();
    expect(screen.getByText('Jane')).toBeTruthy();
  });

  it('shows "No Result" for both sections when nothing comes back from Sanity', async () => {
    mockGetFeaturedProperties.mockResolvedValueOnce([]);
    mockGetProperties.mockResolvedValueOnce([]);

    await render(<Home />);

    await waitFor(() => expect(screen.getAllByText('No Result').length).toBeGreaterThan(0));
  });

  it('navigates to the property detail screen when a card is pressed', async () => {
    mockGetFeaturedProperties.mockResolvedValueOnce([]);
    mockGetProperties.mockResolvedValueOnce([makeListing('p1', 'Recommended Flat')]);

    await render(<Home />);

    const card = await screen.findByText('Recommended Flat');
    await fireEvent.press(card);

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/properties/p1'));
  });
});
