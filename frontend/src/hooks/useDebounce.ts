/**
 * useDebounce Hook
 * 
 * Debounces a value by delaying updates until after a specified delay
 * 
 * @module hooks/useDebounce
 */

import { useState, useEffect } from 'react';

/**
 * Debounce a value
 * 
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced value
 * 
 * @example
 * const [searchInput, setSearchInput] = useState('');
 * const debouncedSearch = useDebounce(searchInput, 300);
 * 
 * // debouncedSearch will only update 300ms after user stops typing
 */
export const useDebounce = <T>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up timeout to update debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup function - cancel timeout if value changes before delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Debounce a callback function
 * 
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns Debounced function
 * 
 * @example
 * const handleSearch = useDebouncedCallback((query: string) => {
 *   console.log('Searching for:', query);
 * }, 300);
 * 
 * // handleSearch will only execute 300ms after last call
 */
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): ((...args: Parameters<T>) => void) => {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  return (...args: Parameters<T>) => {
    // Clear previous timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };
};

