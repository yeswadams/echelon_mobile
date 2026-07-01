import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import * as ExpoRouter from 'expo-router';

jest.mock('@/lib/sanity', () => ({
  getProperties: jest.fn(),
}));

jest.mock('@/lib/sanityImage', () => ({
  urlFor: jest.fn(),
}));

import { getProperties } from '@/lib/sanity';
import { urlFor } from '@/lib/sanityImage';
import Explore from '@/app/(root)/(tabs)/explore';
import type { SanityPropertyListing } from '@/lib/types';

const mockGetProperties = getProperties as jest.Mock;
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

describe('Explore screen (app/(root)/(tabs)/explore.tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ExpoRouter as any).__setMockSearchParams({});
    mockUrlFor.mockReturnValue(makeChain('https://img/1.jpg'));
  });

  it('renders the property count and results once loaded', async () => {
    mockGetProperties.mockResolvedValueOnce([makeListing('p1', 'Garden Studio')]);

    await render(<Explore />);

    expect(await screen.findByText('Garden Studio')).toBeTruthy();
    expect(screen.getByText(/Found 1 Properties/)).toBeTruthy();
  });

  it('shows "No Result" when nothing comes back from Sanity', async () => {
    mockGetProperties.mockResolvedValueOnce([]);

    await render(<Explore />);

    await waitFor(() => expect(screen.getByText('No Result')).toBeTruthy());
    expect(screen.getByText(/Found 0 Properties/)).toBeTruthy();
  });

  it('navigates to the property detail screen when a card is pressed', async () => {
    mockGetProperties.mockResolvedValueOnce([makeListing('p1', 'Garden Studio')]);

    await render(<Explore />);

    const card = await screen.findByText('Garden Studio');
    await fireEvent.press(card);

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/properties/p1'));
  });
});
