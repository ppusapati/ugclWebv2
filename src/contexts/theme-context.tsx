// apps/shell/src/contexts/theme-context.tsx
import {
  $,
  component$,
  createContextId,
  Slot,
  useContext,
  useContextProvider,
  useStore,
  useVisibleTask$,
  type QRL,
} from '@builder.io/qwik';

interface ThemeState {
  isDark: boolean;
  toggleTheme: QRL<() => void>;
}

const ThemeContext = createContextId<ThemeState>('theme-context');

export const ThemeProvider = component$(() => {
  const themeState = useStore({
    isDark: false,
  });

  const toggleTheme = $(() => {
    themeState.isDark = !themeState.isDark;
  });

  // Create context value with reactive state
  const contextValue = {
    get isDark() {
      return themeState.isDark;
    },
    toggleTheme,
  };

  // Watch for theme changes and update localStorage + DOM
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({ track }) => {
    // Track theme changes
    const isDark = track(() => themeState.isDark);

    // Update localStorage and DOM when theme changes
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDark);
  });

  // Initialize theme from localStorage on mount
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    // Initialize theme from localStorage (client-side only) - runs once on mount
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      themeState.isDark = true;
    }
  });

  useContextProvider(ThemeContext, contextValue);

  return <Slot />;
});

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};