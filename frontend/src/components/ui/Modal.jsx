import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
export const Modal = ({ isOpen, onClose, title, subtitle, children, maxWidth = 'md', }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape')
                onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    const widthClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
    };
    return (_jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto", children: [_jsx("div", { className: "fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity", onClick: onClose, "aria-hidden": "true" }), _jsxs("div", { className: `relative w-full ${widthClasses[maxWidth]} bg-slate-950 border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/50 p-6 z-10 transform transition-all duration-200 scale-100 opacity-100`, role: "dialog", "aria-modal": "true", "aria-labelledby": "modal-title", children: [_jsxs("div", { className: "flex items-start justify-between pb-4 border-b border-slate-800/80", children: [_jsxs("div", { children: [_jsx("h3", { id: "modal-title", className: "text-xl font-bold text-slate-100 flex items-center gap-2", children: _jsx("span", { children: title }) }), subtitle && (_jsx("p", { className: "text-sm text-slate-400 mt-0.5", children: subtitle }))] }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-200 hover:bg-slate-900 p-1.5 rounded-lg transition-colors", "aria-label": "Close modal", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsx("div", { className: "mt-5", children: children })] })] }));
};
