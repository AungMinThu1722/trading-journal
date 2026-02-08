import React, { useState, useEffect } from 'react';
import { Key, Save, AlertCircle, ExternalLink, CheckCircle, LogOut } from 'lucide-react';
import { User } from '../types';

interface SettingsProps {
  apiKey: string;
  onSaveKey: (key: string) => void;
  onClearData: () => void;
  onLogout: () => void;
  user: User | null;
}

const Settings: React.FC<SettingsProps> = ({ apiKey, onSaveKey, onClearData, onLogout, user }) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveKey(inputKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in-up">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white tracking-tight">Settings</h2>
        <p className="text-textMuted text-sm">Configure your personal AI Coach and data preferences.</p>
      </div>

      {/* Profile Section */}
      <div className="bg-surface border border-white/5 rounded-2xl p-6 flex items-center justify-between">
         <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-600 flex items-center justify-center text-base font-bold text-white">
                {user?.name.charAt(0)}
             </div>
             <div>
                 <h3 className="text-white font-medium">{user?.name}</h3>
                 <p className="text-xs text-textMuted">{user?.email}</p>
             </div>
         </div>
         <button 
           onClick={onLogout}
           className="flex items-center gap-2 px-4 py-2 bg-white/5 text-textMuted hover:text-white hover:bg-white/10 rounded-lg text-sm transition-colors"
         >
             <LogOut className="w-4 h-4" />
             Log out
         </button>
      </div>

      {/* API Key Section */}
      <div className="bg-surface border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
            <Key className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-medium text-white">Google Gemini API Key</h3>
            <p className="text-sm text-textMuted leading-relaxed">
              To use the AI Coach features, you need a free API key from Google AI Studio. 
              Your key is stored locally in your browser and is never sent to our servers.
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-textMuted uppercase tracking-wider block mb-2">
              Enter API Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-white focus:border-indigo-500 focus:outline-none transition-colors font-mono text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
             <a 
               href="https://aistudio.google.com/app/apikey" 
               target="_blank" 
               rel="noopener noreferrer"
               className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
             >
               Get a free key here <ExternalLink className="w-3 h-3" />
             </a>

             <button
                type="submit"
                className={`flex items-center gap-2 px-6 py-2.5 font-medium rounded-lg transition-all ${
                    saved 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
             >
                {saved ? (
                    <>
                        <CheckCircle className="w-4 h-4" />
                        Saved
                    </>
                ) : (
                    <>
                        <Save className="w-4 h-4" />
                        Save Key
                    </>
                )}
             </button>
          </div>
        </form>
      </div>

      {/* Data Management */}
      <div className="bg-surface border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-red-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-medium text-white">Danger Zone</h3>
            <p className="text-sm text-textMuted">
              Clear all locally stored trades and settings. This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="pt-2">
            <button 
                onClick={() => {
                    if(window.confirm('Are you sure you want to delete all your journal entries?')) {
                        onClearData();
                    }
                }}
                className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/20 transition-colors"
            >
                Clear All Data
            </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;