import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ThunderCanvas } from '../ui/ThunderCanvas';
export const DashboardLayout = ({ children, title = 'Dashboard', searchQuery, setSearchQuery, }) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    return (_jsxs("div", { className: "min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row antialiased relative", children: [_jsx(ThunderCanvas, {}), _jsx(Sidebar, { mobileOpen: mobileOpen, setMobileOpen: setMobileOpen }), _jsxs("div", { className: "flex-1 flex flex-col min-w-0 z-10", children: [_jsx(Header, { title: title, onMenuClick: () => setMobileOpen(true), searchQuery: searchQuery, setSearchQuery: setSearchQuery }), _jsx("main", { className: "flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8", children: children })] })] }));
};
