import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export const Button = ({ variant = 'primary', size = 'md', icon, children, className = '', disabled, ...props }) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';
    const variants = {
        thunder: 'bg-gradient-to-r from-cyan-500 via-indigo-600 to-violet-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/40 hover:shadow-cyan-500/40 focus:ring-cyan-400 active:scale-[0.98] animate-thunder-pulse',
        primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 border border-indigo-500/40 focus:ring-indigo-500 active:scale-[0.98]',
        secondary: 'bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-cyan-500/30 hover:border-cyan-400/50 shadow-md shadow-cyan-950/40 focus:ring-cyan-500 active:scale-[0.98]',
        outline: 'bg-slate-950/60 hover:bg-slate-900 text-slate-200 border border-slate-800 hover:border-cyan-500/40 focus:ring-cyan-500 active:scale-[0.98]',
        ghost: 'bg-transparent hover:bg-slate-900/80 text-slate-300 hover:text-cyan-300 focus:ring-slate-500',
        danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 border border-rose-500/40 focus:ring-rose-500 active:scale-[0.98]',
    };
    const sizes = {
        sm: 'text-xs px-3 py-1.5 gap-1.5',
        md: 'text-sm px-4 py-2.5 gap-2',
        lg: 'text-base px-5 py-3 gap-2.5',
    };
    return (_jsxs("button", { className: `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`, disabled: disabled, ...props, children: [icon && _jsx("span", { className: "shrink-0", children: icon }), _jsx("span", { children: children })] }));
};
