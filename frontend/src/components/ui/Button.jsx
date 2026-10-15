import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export const Button = ({ variant = 'primary', size = 'md', icon, children, className = '', disabled, ...props }) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed select-none cursor-pointer';
    const variants = {
        thunder: 'bg-teal-700 hover:bg-teal-600 text-white shadow-md shadow-teal-900/15 border border-teal-700/30 hover:shadow-teal-900/20 focus:ring-teal-600 active:scale-[0.98]',
        primary: 'bg-teal-700 hover:bg-teal-600 text-white shadow-md shadow-teal-900/15 border border-teal-700/30 focus:ring-teal-600 active:scale-[0.98]',
        secondary: 'bg-slate-900/90 hover:bg-slate-800 text-slate-100 border border-teal-500/30 hover:border-teal-400/50 shadow-md shadow-slate-900/10 focus:ring-teal-500 active:scale-[0.98]',
        outline: 'bg-slate-950/60 hover:bg-slate-900 text-slate-200 border border-slate-800 hover:border-teal-500/40 focus:ring-teal-500 active:scale-[0.98]',
        ghost: 'bg-transparent hover:bg-slate-900/80 text-slate-300 hover:text-teal-300 focus:ring-slate-500',
        danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/30 border border-rose-500/40 focus:ring-rose-500 active:scale-[0.98]',
    };
    const sizes = {
        sm: 'text-xs px-3 py-1.5 gap-1.5',
        md: 'text-sm px-4 py-2.5 gap-2',
        lg: 'text-base px-5 py-3 gap-2.5',
    };
    return (_jsxs("button", { className: `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`, disabled: disabled, ...props, children: [icon && _jsx("span", { className: "shrink-0", children: icon }), _jsx("span", { children: children })] }));
};
