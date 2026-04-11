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
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', themeState.isDark ? 'dark' : 'light');
    }
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', themeState.isDark);
    }
  });

  // Create context value with reactive state
  const contextValue = {
    get isDark() {
      return themeState.isDark;
    },
    toggleTheme,
  };

  // Initialize theme from localStorage on mount
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark';
    themeState.isDark = isDark;
    document.documentElement.classList.toggle('dark', isDark);
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