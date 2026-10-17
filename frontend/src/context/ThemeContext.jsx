import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext, useEffect, useState } from 'react';
export const THEME_OPTIONS = [
    { id: 'light', name: 'Light', color: '#148b82', accentClass: 'bg-teal-700' },
    { id: 'dark', name: 'Dark', color: '#55b8ad', accentClass: 'bg-teal-500' },
];
const ThemeContext = createContext(undefined);
export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(() => {
        const saved = localStorage.getItem('syncspace_theme');
        if (saved === 'light' || saved === 'dark') return saved;
        if (['cyan', 'violet', 'emerald', 'amber'].includes(saved)) return 'dark';
        return 'light';
    });
    const setTheme = (newTheme) => {
        if (!['light', 'dark'].includes(newTheme)) {
            throw new Error(`Unsupported theme: ${newTheme}`);
        }
        setThemeState(newTheme);
        localStorage.setItem('syncspace_theme', newTheme);
    };
    useEffect(() => {
        const root = document.documentElement;
        root.setAttribute('data-theme', theme);
        root.classList.toggle('light', theme === 'light');
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
