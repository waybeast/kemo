import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a value
 * Delays updating the value until after the specified delay has passed since the last change
 * 
 * @param {any} value - The value to debounce
 * @param {number} delay - The delay in milliseconds (default: 500ms)
 * @returns {any} The debounced value
 * 
 * @example
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebounce(searchQuery, 500);
 * 
 * useEffect(() => {
 *   // This will only run 500ms after the user stops typing
 *   if (debouncedQuery) {
 *     fetchSearchResults(debouncedQuery);
 *   }
 * }, [debouncedQuery]);
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set up the timeout to update debounced value after delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay expires
    // This ensures we only update after the user stops typing
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
