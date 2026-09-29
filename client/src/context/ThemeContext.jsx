import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return 'dark'; // Defaulting to Dark Mode
  });

  const setTheme = (newTheme) => {
    const validTheme = newTheme === 'light' ? 'light' : 'dark';
    setThemeState(validTheme);
    localStorage.setItem('theme', validTheme);
    document.documentElement.setAttribute('data-theme', validTheme);
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.setAttribute('data-theme', validTheme);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  useEffect(() => {
    // Apply theme attribute to documentElement
    document.documentElement.setAttribute('data-theme', theme);
    const rootEl = document.getElementById('root');
    if (rootEl) {
      rootEl.setAttribute('data-theme', theme);
    }

    const handleStorage = (e) => {
      if (e.key === 'theme' && (e.newValue === 'light' || e.newValue === 'dark')) {
        setThemeState(e.newValue);
        document.documentElement.setAttribute('data-theme', e.newValue);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
