import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

jest.mock('@/lib/sanityImage', () => ({
  urlFor: jest.fn(),
}));

import { PropertyResultsList } from '@/components/organisms/PropertyResultsList';
import type { SanityPropertyListing } from '@/lib/types';

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

describe('PropertyResultsList', () => {
  it('renders items in grid mode and fires onPressItem', async () => {
    const onPressItem = jest.fn();
    await render(
      <PropertyResultsList
        data={[makeListing('p1', 'Garden Studio')]}
        loading={false}
        viewMode="grid"
        onPressItem={onPressItem}
      />
    );

    const card = await screen.findByText('Garden Studio');
    await fireEvent.press(card);

    await waitFor(() => expect(onPressItem).toHaveBeenCalledWith('p1'));
  });

  it('renders items in list mode', async () => {
    await render(
      <PropertyResultsList
        data={[makeListing('p1', 'Garden Studio')]}
        loading={false}
        viewMode="list"
        onPressItem={jest.fn()}
      />
    );

    expect(await screen.findByText('Garden Studio')).toBeTruthy();
  });

  it('shows a loading indicator while data is null and loading', async () => {
    await render(<PropertyResultsList data={null} loading viewMode="grid" onPressItem={jest.fn()} />);

    expect(screen.queryByText('No Result')).toBeNull();
  });

  it('shows "No Result" when the list is empty and not loading', async () => {
    await render(<PropertyResultsList data={[]} loading={false} viewMode="grid" onPressItem={jest.fn()} />);

    expect(await screen.findByText('No Result')).toBeTruthy();
  });
});
