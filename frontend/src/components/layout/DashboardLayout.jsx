import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const DashboardLayout = ({ children, title = 'Dashboard', searchQuery, setSearchQuery }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  return (
    <div className="app-shell min-h-screen antialiased relative">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="min-h-screen flex flex-col min-w-0 lg:ml-64">
        <Header 
          title={title} 
          onMenuClick={() => setMobileOpen(true)} 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {children}
        </main>
      </div>
    </div>
  );
};
