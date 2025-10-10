/* eslint-env jest */
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));
    expect(result.current).toBe('initial');
  });

  test('returns updated value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } },
    );

    // Change the value
    rerender({ value: 'updated', delay: 500 });

    // Value should still be initial immediately
    expect(result.current).toBe('initial');

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(500);
    });

    // Now value should be updated
    expect(result.current).toBe('updated');
  });

  test('cancels previous timeout when value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 500 } },
    );

    // Change value before timeout
    rerender({ value: 'second', delay: 500 });

    // Advance time partially
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Value should still be first
    expect(result.current).toBe('first');

    // Advance remaining time
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Now value should be second
    expect(result.current).toBe('second');
  });

  test('handles different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 1000 } },
    );

    rerender({ value: 'updated', delay: 1000 });

    // Advance time by 500ms - should still be initial
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe('initial');

    // Advance remaining time
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(result.current).toBe('updated');
  });
});
