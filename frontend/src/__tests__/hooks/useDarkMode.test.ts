import { renderHook, act } from '@testing-library/react';
import { useDarkMode } from '@/hooks/useDarkMode';

describe('useDarkMode', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    // Clear document classes
    document.documentElement.classList.remove('dark');
    // Reset matchMedia mock
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  it('should return isDarkMode and toggleDarkMode', () => {
    const { result } = renderHook(() => useDarkMode());
    
    expect(result.current).toHaveProperty('isDarkMode');
    expect(result.current).toHaveProperty('toggleDarkMode');
    expect(typeof result.current.isDarkMode).toBe('boolean');
    expect(typeof result.current.toggleDarkMode).toBe('function');
  });

  it('should default to false when no localStorage value', () => {
    const { result } = renderHook(() => useDarkMode());
    
    expect(result.current.isDarkMode).toBe(false);
  });

  it('should load dark mode from localStorage', () => {
    localStorage.setItem('darkMode', 'true');
    
    const { result } = renderHook(() => useDarkMode());
    
    expect(result.current.isDarkMode).toBe(true);
  });

  it('should load light mode from localStorage', () => {
    localStorage.setItem('darkMode', 'false');
    
    const { result } = renderHook(() => useDarkMode());
    
    expect(result.current.isDarkMode).toBe(false);
  });

  it('should toggle dark mode', () => {
    const { result } = renderHook(() => useDarkMode());
    
    expect(result.current.isDarkMode).toBe(false);
    
    act(() => {
      result.current.toggleDarkMode();
    });
    
    expect(result.current.isDarkMode).toBe(true);
    
    act(() => {
      result.current.toggleDarkMode();
    });
    
    expect(result.current.isDarkMode).toBe(false);
  });

  it('should add dark class to document when dark mode is enabled', () => {
    const { result } = renderHook(() => useDarkMode());
    
    act(() => {
      result.current.toggleDarkMode();
    });
    
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should remove dark class from document when dark mode is disabled', () => {
    localStorage.setItem('darkMode', 'true');
    
    const { result } = renderHook(() => useDarkMode());
    
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    
    act(() => {
      result.current.toggleDarkMode();
    });
    
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should save dark mode preference to localStorage', () => {
    const { result } = renderHook(() => useDarkMode());
    
    act(() => {
      result.current.toggleDarkMode();
    });
    
    expect(localStorage.getItem('darkMode')).toBe('true');
    
    act(() => {
      result.current.toggleDarkMode();
    });
    
    expect(localStorage.getItem('darkMode')).toBe('false');
  });

  it('should use system preference when no localStorage value', () => {
    // Mock system preference for dark mode
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    
    const { result } = renderHook(() => useDarkMode());
    
    expect(result.current.isDarkMode).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should prefer localStorage over system preference', () => {
    // Set localStorage to light mode
    localStorage.setItem('darkMode', 'false');
    
    // Mock system preference for dark mode
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
    
    const { result } = renderHook(() => useDarkMode());
    
    // Should use localStorage value (false) instead of system preference (true)
    expect(result.current.isDarkMode).toBe(false);
  });

  it('should apply dark class on mount if dark mode is enabled', () => {
    localStorage.setItem('darkMode', 'true');
    
    renderHook(() => useDarkMode());
    
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should not apply dark class on mount if dark mode is disabled', () => {
    localStorage.setItem('darkMode', 'false');
    
    renderHook(() => useDarkMode());
    
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should handle multiple toggles correctly', () => {
    const { result } = renderHook(() => useDarkMode());
    
    // Toggle 5 times
    for (let i = 0; i < 5; i++) {
      act(() => {
        result.current.toggleDarkMode();
      });
    }
    
    // Should be dark (odd number of toggles)
    expect(result.current.isDarkMode).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('darkMode')).toBe('true');
  });

  it('should handle invalid localStorage values gracefully', () => {
    localStorage.setItem('darkMode', 'invalid');
    
    const { result } = renderHook(() => useDarkMode());
    
    // Should default to false for invalid values
    expect(result.current.isDarkMode).toBe(false);
  });

  it('should sync state with localStorage and document class', () => {
    const { result } = renderHook(() => useDarkMode());
    
    act(() => {
      result.current.toggleDarkMode();
    });
    
    // All three should be in sync
    expect(result.current.isDarkMode).toBe(true);
    expect(localStorage.getItem('darkMode')).toBe('true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    
    act(() => {
      result.current.toggleDarkMode();
    });
    
    // All three should still be in sync
    expect(result.current.isDarkMode).toBe(false);
    expect(localStorage.getItem('darkMode')).toBe('false');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});

