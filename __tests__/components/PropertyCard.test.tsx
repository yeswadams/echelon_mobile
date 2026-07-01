import { render, screen } from '@testing-library/react-native';

jest.mock('@/lib/sanityImage', () => ({
  urlFor: jest.fn(),
}));

import { PropertyCard } from '@/components/molecules';
import { urlFor } from '@/lib/sanityImage';
import type { SanityPropertyListing } from '@/lib/types';

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

const baseItem: SanityPropertyListing = {
  _id: '1',
  title: 'Nice Villa',
  slug: { current: 'nice-villa' },
  listingType: 'sale',
  propertyType: 'house',
  price: 1000000,
  currency: 'KES',
  location: { area: 'Kilimani', city: 'Nairobi' },
};

describe('PropertyCard', () => {
  beforeEach(() => {
    mockUrlFor.mockReset();
  });

  it('renders the grid variant without crashing', async () => {
    mockUrlFor.mockReturnValue(makeChain('https://img/1.jpg'));

    await render(<PropertyCard item={{ ...baseItem, heroImage: { asset: { _ref: 'x' } } }} variant="grid" />);

    expect(screen.getByText('Nice Villa')).toBeTruthy();
  });

  it('renders the list variant without crashing', async () => {
    mockUrlFor.mockReturnValue(makeChain('https://img/1.jpg'));

    await render(<PropertyCard item={{ ...baseItem, heroImage: { asset: { _ref: 'x' } } }} variant="list" />);

    expect(screen.getByText('Nice Villa')).toBeTruthy();
    expect(screen.getByText('Kilimani, Nairobi')).toBeTruthy();
  });

  it('renders a placeholder in either variant when heroImage is missing', async () => {
    await render(<PropertyCard item={baseItem} variant="grid" />);
    expect(screen.getByText('Nice Villa')).toBeTruthy();
    expect(mockUrlFor).not.toHaveBeenCalled();
  });
});
