import React from 'react';
import { NAV_ITEMS } from '../constants';
import { User } from '../types';
import { LayoutDashboard } from 'lucide-react'; // Fallback icon

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (id: string) => void;
  user: User | null;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user }) => {
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans text-textMain">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 border-r border-white/5 flex flex-col justify-between bg-surface/30 backdrop-blur-sm">
        <div>
          <div className="h-20 flex items-center justify-center lg:justify-start lg:px-8 border-b border-white/5">
             <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                <div className="w-3 h-3 bg-white rounded-full"></div>
             </div>
             <span className="hidden lg:block ml-3 font-bold text-lg tracking-tight text-white">TradeArchitect</span>
          </div>

          <nav className="p-4 space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-center lg:justify-start lg:px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-textMuted hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-textMuted group-hover:text-white'}`} />
                  <span className="hidden lg:block ml-3 text-sm font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4">
           <div className="hidden lg:flex items-center p-3 rounded-xl bg-surface border border-white/5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600 flex items-center justify-center text-xs font-bold text-white">
                {user ? getInitials(user.name) : 'JD'}
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-xs font-medium text-white truncate w-32">{user?.name || 'Trader'}</p>
                <p className="text-[10px] text-textMuted truncate w-32">{user?.email || 'Pro Member'}</p>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-7xl mx-auto p-6 lg:p-12">
           {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;