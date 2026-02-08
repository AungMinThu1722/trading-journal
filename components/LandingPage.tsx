import React, { useState } from 'react';
import { ArrowRight, TrendingUp, ShieldCheck, BrainCircuit, Mail, User, Github } from 'lucide-react';
import { User as UserType } from '../types';

interface LandingPageProps {
  onLogin: (user: UserType) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'welcome' | 'login'>('welcome');
  const [formData, setFormData] = useState({ name: '', email: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email) {
      onLogin({
        name: formData.name,
        email: formData.email,
        joinedAt: new Date().toISOString(),
      });
    }
  };

  const handleGithubLogin = () => {
    // Since this is a client-side only app, we can't do real OAuth without a backend.
    // This is a mock simulation or where you would redirect to your OAuth provider.
    alert("GitHub Login requires a backend server. For this personal version, please use the Email login.");
  };

  return (
    <div className="min-h-screen bg-background text-textMain flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl text-center space-y-12">
        
        {step === 'welcome' && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-surface border border-white/5 text-xs tracking-wider text-textMuted uppercase mb-4">
              Institutional Grade Journaling
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white">
              Trade with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-500">Discipline.</span>
            </h1>
            <p className="text-lg md:text-xl text-textMuted font-light max-w-lg mx-auto leading-relaxed">
              Journal smarter, not harder. Let AI analyze your execution,
              identify leaks, and build your consistency.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-3xl mx-auto py-8">
              <div className="space-y-3">
                <TrendingUp className="w-6 h-6 text-primary/80" />
                <h3 className="font-medium text-white">Data Driven</h3>
                <p className="text-sm text-textMuted">Move beyond hope. Make decisions based on your historical edge.</p>
              </div>
              <div className="space-y-3">
                <BrainCircuit className="w-6 h-6 text-primary/80" />
                <h3 className="font-medium text-white">AI Coach</h3>
                <p className="text-sm text-textMuted">Instant, unbiased feedback on every trade setup and execution.</p>
              </div>
              <div className="space-y-3">
                <ShieldCheck className="w-6 h-6 text-primary/80" />
                <h3 className="font-medium text-white">Risk First</h3>
                <p className="text-sm text-textMuted">Master your psychology and protect your capital at all costs.</p>
              </div>
            </div>

            <button
              onClick={() => setStep('login')}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-medium transition-all hover:bg-zinc-200 hover:scale-105"
            >
              Get Started
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        )}

        {step === 'login' && (
          <div className="w-full max-w-md mx-auto bg-surface border border-white/5 rounded-2xl p-8 shadow-2xl animate-fade-in-up">
            <h2 className="text-2xl font-bold text-white mb-2">Trader Profile</h2>
            <p className="text-textMuted text-sm mb-6">Create your local profile to start journaling.</p>
            
            <div className="space-y-4">
               {/* GitHub Button */}
              <button
                onClick={handleGithubLogin}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#24292e] text-white font-medium rounded-lg hover:bg-[#2f363d] transition-colors border border-white/10"
              >
                <Github className="w-5 h-5" />
                <span>Continue with GitHub</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-surface px-2 text-textMuted">Or continue with email</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div>
                  <label className="text-xs font-medium text-textMuted uppercase tracking-wider mb-2 block">Display Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Alex"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-textMuted uppercase tracking-wider mb-2 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-500" />
                    <input 
                      type="email" 
                      required
                      placeholder="alex@trading.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-background border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 flex items-center justify-center gap-2 px-8 py-3 bg-primary text-black font-semibold rounded-xl hover:bg-emerald-400 transition-all"
                >
                  Enter Journal
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
            
            <button 
              onClick={() => setStep('welcome')}
              className="w-full text-xs text-textMuted hover:text-white mt-6"
            >
              Back to Welcome
            </button>
          </div>
        )}

      </div>
      
      <div className="absolute bottom-8 text-xs text-textMuted tracking-widest uppercase opacity-50">
        TradeArchitect &copy; 2024
      </div>
    </div>
  );
};

export default LandingPage;