import { renderHook, act, waitFor } from '@testing-library/react';
import { useDebounce, useDebouncedCallback } from '@/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    
    expect(result.current).toBe('initial');
  });

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'updated', delay: 300 });
    
    // Value should not change immediately
    expect(result.current).toBe('initial');

    // Fast-forward time by 300ms
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Value should now be updated
    expect(result.current).toBe('updated');
  });

  it('should cancel previous timeout on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    // Rapid changes
    rerender({ value: 'change1' });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    rerender({ value: 'change2' });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    rerender({ value: 'change3' });
    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Only 300ms total passed, value should still be initial
    expect(result.current).toBe('initial');

    // Advance another 200ms (total 500ms from last change)
    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Now value should be the last change
    expect(result.current).toBe('change3');
  });

  it('should use default delay of 300ms', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('should work with custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    act(() => {
      jest.advanceTimersByTime(499);
    });
    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(result.current).toBe('updated');
  });

  it('should work with different value types', () => {
    // Number
    const { result: numberResult, rerender: numberRerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 0 } }
    );

    numberRerender({ value: 42 });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(numberResult.current).toBe(42);

    // Boolean
    const { result: boolResult, rerender: boolRerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: false } }
    );

    boolRerender({ value: true });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(boolResult.current).toBe(true);

    // Object
    const { result: objResult, rerender: objRerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: { name: 'initial' } } }
    );

    objRerender({ value: { name: 'updated' } });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(objResult.current).toEqual({ name: 'updated' });
  });

  it('should handle empty string', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: '' });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe('');
  });

  it('should handle null and undefined', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 'initial' as string | null | undefined } }
    );

    rerender({ value: null });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe(null);

    rerender({ value: undefined });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current).toBe(undefined);
  });
});

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should debounce callback execution', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    // Call the debounced function
    act(() => {
      result.current('test');
    });

    // Callback should not be called immediately
    expect(callback).not.toHaveBeenCalled();

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Callback should now be called
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('test');
  });

  it('should cancel previous callback on rapid calls', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    // Rapid calls
    act(() => {
      result.current('call1');
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    act(() => {
      result.current('call2');
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    act(() => {
      result.current('call3');
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Only last call should execute
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('call3');
  });

  it('should use default delay of 300ms', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback));

    act(() => {
      result.current('test');
      jest.advanceTimersByTime(299);
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(callback).toHaveBeenCalled();
  });

  it('should work with custom delay', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 500));

    act(() => {
      result.current('test');
      jest.advanceTimersByTime(499);
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(callback).toHaveBeenCalled();
  });

  it('should pass all arguments to callback', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => 
      useDebouncedCallback((a: string, b: number, c: boolean) => callback(a, b, c), 300)
    );

    act(() => {
      result.current('test', 42, true);
      jest.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledWith('test', 42, true);
  });

  it('should handle multiple sequential calls after delay', () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    // First call
    act(() => {
      result.current('call1');
      jest.advanceTimersByTime(300);
    });
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('call1');

    // Second call
    act(() => {
      result.current('call2');
      jest.advanceTimersByTime(300);
    });
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith('call2');
  });
});

