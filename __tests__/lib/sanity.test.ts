jest.mock('@sanity/client', () => {
  const fetchMock = jest.fn();
  return {
    createClient: jest.fn(() => ({ fetch: fetchMock })),
    __fetchMock: fetchMock,
  };
});

import * as SanityJs from '@sanity/client';
import { getFeaturedProperties, getProperties, getPropertyById } from '@/lib/sanity';

const mockFetch = (SanityJs as any).__fetchMock;

describe('lib/sanity', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('getFeaturedProperties', () => {
    it('returns listings from the CMS', async () => {
      const listings = [{ _id: '1', title: 'Featured Villa' }];
      mockFetch.mockResolvedValueOnce(listings);

      const result = await getFeaturedProperties();

      expect(result).toBe(listings);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('propagates a rejected fetch (no try/catch at this layer)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('network down'));

      await expect(getFeaturedProperties()).rejects.toThrow('network down');
    });
  });

  describe('getProperties', () => {
    it('lowercases a real filter and passes search/limit params through', async () => {
      mockFetch.mockResolvedValueOnce([]);

      await getProperties({ filter: 'Apartment', query: 'nairobi', limit: 10 });

      const [, params] = mockFetch.mock.calls[0];
      expect(params).toEqual({ propertyType: 'apartment', search: 'nairobi', limit: 10 });
    });

    it('treats "All" filter as no filter', async () => {
      mockFetch.mockResolvedValueOnce([]);

      await getProperties({ filter: 'All', query: '' });

      const [, params] = mockFetch.mock.calls[0];
      expect(params.propertyType).toBe('');
    });

    it('defaults limit to 20 when not provided', async () => {
      mockFetch.mockResolvedValueOnce([]);

      await getProperties({ filter: '', query: '' });

      const [, params] = mockFetch.mock.calls[0];
      expect(params.limit).toBe(20);
    });

    it('propagates a rejected fetch (no try/catch at this layer)', async () => {
      mockFetch.mockRejectedValueOnce(new Error('CDN outage'));

      await expect(getProperties({ filter: '', query: '' })).rejects.toThrow('CDN outage');
    });
  });

  describe('getPropertyById', () => {
    it('returns the property document on success', async () => {
      const property = { _id: 'abc', title: 'Test Property' };
      mockFetch.mockResolvedValueOnce(property);

      const result = await getPropertyById({ id: 'abc' });

      expect(result).toBe(property);
    });

    it('returns null (not a thrown error) when the query fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('malformed GROQ'));

      const result = await getPropertyById({ id: 'abc' });

      expect(result).toBeNull();
    });

    it('returns null when no document matches the id', async () => {
      mockFetch.mockResolvedValueOnce(null);

      const result = await getPropertyById({ id: 'missing-id' });

      expect(result).toBeNull();
    });
  });
});
