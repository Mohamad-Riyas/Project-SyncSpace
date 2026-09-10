import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext, useEffect, useState } from 'react';
export const THEME_OPTIONS = [
    { id: 'cyan', name: 'Electric Cyan', color: '#06b6d4', accentClass: 'bg-cyan-500' },
    { id: 'violet', name: 'Cyber Violet', color: '#a855f7', accentClass: 'bg-purple-500' },
    { id: 'emerald', name: 'Emerald Glow', color: '#10b981', accentClass: 'bg-emerald-500' },
    { id: 'amber', name: 'Sunset Amber', color: '#f59e0b', accentClass: 'bg-amber-500' },
    { id: 'light', name: 'Light Modern', color: '#6366f1', accentClass: 'bg-indigo-600' },
];
const ThemeContext = createContext(undefined);
export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(() => {
        const saved = localStorage.getItem('syncspace_theme');
        if (saved && ['cyan', 'violet', 'emerald', 'amber', 'light'].includes(saved)) {
            return saved;
        }
        return 'cyan';
    });
    const setTheme = (newTheme) => {
        setThemeState(newTheme);
        localStorage.setItem('syncspace_theme', newTheme);
    };
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        if (theme === 'light') {
            root.classList.add('light');
        }
        else {
            root.classList.remove('light');
        }
    }, [theme]);
    return (_jsx(ThemeContext.Provider, { value: { theme, setTheme }, children: children }));
};
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
