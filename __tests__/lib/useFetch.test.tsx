import { Alert } from 'react-native';
import { waitFor } from '@testing-library/react-native';
import { renderHook } from '@testing-library/react-native';

import { useFetch } from '@/lib/useFetch';

describe('useFetch', () => {
  it('fetches on mount and exposes the result', async () => {
    const fn = jest.fn().mockResolvedValue(['item-1']);

    const { result } = await renderHook(() => useFetch({ fn }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(['item-1']);
    expect(result.current.error).toBeNull();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('does not fetch on mount when skip is true', async () => {
    const fn = jest.fn().mockResolvedValue([]);

    const { result } = await renderHook(() => useFetch({ fn, skip: true }));

    expect(result.current.loading).toBe(false);
    expect(fn).not.toHaveBeenCalled();
  });

  it('sets error state and shows an Alert when the fetch rejects', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Sanity fetch failed'));

    const { result } = await renderHook(() => useFetch({ fn }));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Sanity fetch failed');
    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Sanity fetch failed');
  });

  it('refetch re-invokes fn with new params and updates data', async () => {
    const fn = jest.fn().mockResolvedValueOnce(['first']).mockResolvedValueOnce(['second']);

    const { result } = await renderHook(() => useFetch({ fn, params: { page: 1 } }));

    await waitFor(() => expect(result.current.data).toEqual(['first']));

    await result.current.refetch({ page: 2 });

    expect(fn).toHaveBeenLastCalledWith({ page: 2 });
    await waitFor(() => expect(result.current.data).toEqual(['second']));
  });
});
