import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import TradeDetail from './components/TradeDetail';
import TradeForm from './components/TradeForm';
import Settings from './components/Settings';
import { Trade, User } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [isAddingTrade, setIsAddingTrade] = useState(false);

  // --- Persistence Logic ---

  // 1. Initialize User
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // 2. Initialize Trades based on User
  const [trades, setTrades] = useState<Trade[]>(() => {
    if (user) {
      const savedTrades = localStorage.getItem(`trades_${user.email}`);
      return savedTrades ? JSON.parse(savedTrades) : [];
    }
    return [];
  });

  // 3. Initialize API Key based on User
  const [apiKey, setApiKey] = useState<string>(() => {
    if (user) {
      return localStorage.getItem(`apiKey_${user.email}`) || '';
    }
    return '';
  });

  // --- Effects for Auto-Saving ---

  // Save Trades whenever they change (only if logged in)
  useEffect(() => {
    if (user) {
      localStorage.setItem(`trades_${user.email}`, JSON.stringify(trades));
    }
  }, [trades, user]);

  // Save API Key whenever it changes (only if logged in)
  useEffect(() => {
    if (user) {
      localStorage.setItem(`apiKey_${user.email}`, apiKey);
    }
  }, [apiKey, user]);

  // --- Handlers ---

  const handleLogin = (newUser: User) => {
    // 1. Persist user session
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);

    // 2. Load data for this specific user
    const userTrades = localStorage.getItem(`trades_${newUser.email}`);
    setTrades(userTrades ? JSON.parse(userTrades) : []);

    const userKey = localStorage.getItem(`apiKey_${newUser.email}`);
    setApiKey(userKey || '');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setTrades([]);
    setApiKey('');
    setActiveTab('dashboard');
  };

  const handleUpdateTrade = (updatedTrade: Trade) => {
     setTrades(prev => prev.map(t => t.id === updatedTrade.id ? updatedTrade : t));
     setSelectedTrade(updatedTrade);
  };

  const handleSaveNewTrade = (tradeData: Omit<Trade, 'id'>) => {
    const newTrade: Trade = {
      ...tradeData,
      id: Date.now().toString(),
    };
    setTrades([newTrade, ...trades]);
    setIsAddingTrade(false);
  };

  const handleClearData = () => {
    if (user) {
      localStorage.removeItem(`trades_${user.email}`);
      setTrades([]);
    }
  };

  const renderContent = () => {
    // Priority 1: Adding a Trade
    if (isAddingTrade) {
      return (
        <TradeForm 
          onSave={handleSaveNewTrade} 
          onCancel={() => setIsAddingTrade(false)} 
        />
      );
    }

    // Priority 2: Viewing Trade Details
    if (selectedTrade) {
      return (
        <TradeDetail 
          trade={selectedTrade} 
          onBack={() => setSelectedTrade(null)} 
          onUpdateTrade={handleUpdateTrade}
          apiKey={apiKey}
          onNavigateSettings={() => {
            setSelectedTrade(null);
            setActiveTab('settings');
          }}
        />
      );
    }

    // Priority 3: Tabs
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard trades={trades} onSelectTrade={setSelectedTrade} onAddTrade={() => setIsAddingTrade(true)} />;
      case 'journal':
        return <Dashboard trades={trades} onSelectTrade={setSelectedTrade} onAddTrade={() => setIsAddingTrade(true)} />; 
      case 'coach':
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-textMuted">
                <p className="text-lg">Coach Summary View</p>
                <p className="text-sm mt-2">Analyze your aggregate performance here.</p>
                <p className="text-xs mt-4 text-zinc-600">(Feature coming soon)</p>
            </div>
        );
      case 'settings':
        return (
           <Settings 
             apiKey={apiKey} 
             onSaveKey={setApiKey} 
             onClearData={handleClearData} 
             onLogout={handleLogout}
             user={user}
           />
        );
      default:
        return <Dashboard trades={trades} onSelectTrade={setSelectedTrade} onAddTrade={() => setIsAddingTrade(true)} />;
    }
  };

  if (!user) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={(tab) => { setActiveTab(tab); setSelectedTrade(null); setIsAddingTrade(false); }}
      user={user}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;