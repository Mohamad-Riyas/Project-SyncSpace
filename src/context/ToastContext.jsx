import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext, useState, useCallback } from 'react';
const ToastContext = createContext(undefined);
export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);
    const showToast = useCallback((message, type = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            removeToast(id);
        }, 4000);
    }, [removeToast]);
    return (_jsx(ToastContext.Provider, { value: { showToast, removeToast, toasts }, children: children }));
};
export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
