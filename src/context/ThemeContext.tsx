import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'cyan' | 'violet' | 'emerald' | 'amber' | 'light';

export interface ThemeOption {
  id: ThemeMode;
  name: string;
  color: string; // Color preview hex/tailwind string
  accentClass: string;
}

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'cyan', name: 'Electric Cyan', color: '#06b6d4', accentClass: 'bg-cyan-500' },
  { id: 'violet', name: 'Cyber Violet', color: '#a855f7', accentClass: 'bg-purple-500' },
  { id: 'emerald', name: 'Emerald Glow', color: '#10b981', accentClass: 'bg-emerald-500' },
  { id: 'amber', name: 'Sunset Amber', color: '#f59e0b', accentClass: 'bg-amber-500' },
  { id: 'light', name: 'Light Modern', color: '#6366f1', accentClass: 'bg-indigo-600' },
];

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('syncspace_theme');
    if (saved && ['cyan', 'violet', 'emerald', 'amber', 'light'].includes(saved)) {
      return saved as ThemeMode;
    }
    return 'cyan';
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('syncspace_theme', newTheme);
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
