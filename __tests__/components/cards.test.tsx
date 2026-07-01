import { render, screen } from '@testing-library/react-native';

jest.mock('@/lib/sanityImage', () => ({
  urlFor: jest.fn(),
}));

import { Card, FeaturedCard } from '@/components/cards';
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

describe('Card', () => {
  it('renders the image when heroImage exists', async () => {
    mockUrlFor.mockReturnValue(makeChain('https://img/1.jpg'));

    await render(<Card item={{ ...baseItem, heroImage: { asset: { _ref: 'x' } } }} />);

    expect(screen.getByText('Nice Villa')).toBeTruthy();
    expect(mockUrlFor).toHaveBeenCalled();
  });

  it('renders a placeholder without crashing when heroImage is missing', async () => {
    await render(<Card item={baseItem} />);

    expect(screen.getByText('Nice Villa')).toBeTruthy();
    expect(mockUrlFor).not.toHaveBeenCalled();
  });

  it('renders a placeholder without crashing when urlFor throws', async () => {
    mockUrlFor.mockImplementation(() => {
      throw new Error('bad image ref');
    });

    await render(<Card item={{ ...baseItem, heroImage: { asset: { _ref: 'broken' } } }} />);

    expect(screen.getByText('Nice Villa')).toBeTruthy();
  });

  it('falls back address to Kenya when location is missing', async () => {
    await render(<Card item={{ ...baseItem, location: undefined }} />);

    expect(screen.getByText('Kenya')).toBeTruthy();
  });

});

describe('FeaturedCard', () => {
  it('renders without crashing given a full item, including the "New" badge', async () => {
    mockUrlFor.mockReturnValue(makeChain('https://img/2.jpg'));

    await render(<FeaturedCard item={{ ...baseItem, heroImage: { asset: { _ref: 'x' } }, isNew: true }} />);

    expect(screen.getByText('Nice Villa')).toBeTruthy();
    expect(screen.getByText('New')).toBeTruthy();
  });

  it('renders a placeholder without crashing when heroImage is missing', async () => {
    await render(<FeaturedCard item={baseItem} />);

    expect(screen.getByText('Nice Villa')).toBeTruthy();
  });
});
