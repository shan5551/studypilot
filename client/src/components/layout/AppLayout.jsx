import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}