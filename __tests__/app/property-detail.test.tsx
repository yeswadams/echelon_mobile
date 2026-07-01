import { render, screen, waitFor } from '@testing-library/react-native';
import * as ExpoRouter from 'expo-router';

jest.mock('@/lib/sanity', () => ({
  getPropertyById: jest.fn(),
}));

jest.mock('@/lib/sanityImage', () => ({
  urlFor: jest.fn(),
}));

import { getPropertyById } from '@/lib/sanity';
import { urlFor } from '@/lib/sanityImage';
import PropertyDetails from '@/app/(root)/properties/[id]';
import type { SanityPropertyDetail } from '@/lib/types';

const mockGetPropertyById = getPropertyById as jest.Mock;
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

const baseProperty: SanityPropertyDetail = {
  _id: 'prop-1',
  _createdAt: '2026-01-01',
  _updatedAt: '2026-01-01',
  title: 'Lakeview Apartment',
  slug: { current: 'lakeview-apartment' },
  listingType: 'sale',
  propertyType: 'apartment',
  price: 5000000,
  currency: 'KES',
  location: { area: 'Kilimani', city: 'Nairobi' },
};

describe('Property detail screen (app/(root)/properties/[id].tsx)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ExpoRouter as any).__setMockSearchParams({ id: 'prop-1' });
    mockUrlFor.mockReturnValue(makeChain('https://img/hero.jpg'));
  });

  it('shows "Failed to load property details" when the property is not found', async () => {
    mockGetPropertyById.mockResolvedValueOnce(null);

    await render(<PropertyDetails />);

    expect(await screen.findByText('Failed to load property details')).toBeTruthy();
  });

  it('renders the property title once loaded', async () => {
    mockGetPropertyById.mockResolvedValueOnce(baseProperty);

    await render(<PropertyDetails />);

    expect(await screen.findByText('Lakeview Apartment')).toBeTruthy();
  });

  it('renders gallery images that have a valid image ref', async () => {
    mockGetPropertyById.mockResolvedValueOnce({
      ...baseProperty,
      gallery: [{ image: { asset: { _ref: 'image-abc' } } }],
    });

    await render(<PropertyDetails />);

    await screen.findByText('Lakeview Apartment');
    expect(screen.getByText('Gallery')).toBeTruthy();
  });

  it('does not crash when a gallery entry has a missing/broken image ref (regression)', async () => {
    mockGetPropertyById.mockResolvedValueOnce({
      ...baseProperty,
      gallery: [
        { image: undefined as any },
        { image: { asset: { _ref: 'ok-image' } } },
      ],
    });
    // Simulate urlFor throwing for the broken gallery entry.
    mockUrlFor.mockImplementation((source: unknown) => {
      if (!source) throw new Error('cannot build url for undefined image');
      return makeChain('https://img/ok.jpg');
    });

    await render(<PropertyDetails />);

    expect(await screen.findByText('Lakeview Apartment')).toBeTruthy();
    expect(screen.getByText('Gallery')).toBeTruthy();
  });
});
