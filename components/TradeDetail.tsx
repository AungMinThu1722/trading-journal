import React, { useState } from 'react';
import { Trade } from '../types';
import { analyzeTrade } from '../services/geminiService';
import { ArrowLeft, Loader2, Bot, Target, AlertTriangle, CheckCircle2, XCircle, Minus, BrainCircuit, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface TradeDetailProps {
  trade: Trade;
  onBack: () => void;
  onUpdateTrade: (updatedTrade: Trade) => void;
  apiKey: string;
  onNavigateSettings: () => void;
}

const TradeDetail: React.FC<TradeDetailProps> = ({ trade, onBack, onUpdateTrade, apiKey, onNavigateSettings }) => {
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (trade.aiAnalysis) return; // Don't re-analyze if exists

    setLoading(true);
    try {
      const analysis = await analyzeTrade(trade, apiKey);
      onUpdateTrade({ ...trade, aiAnalysis: analysis });
    } catch (error) {
      console.error("Failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <button 
        onClick={onBack}
        className="flex items-center text-sm text-textMuted hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </button>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
           <div className="flex items-center gap-3 mb-2">
             <h1 className="text-3xl font-bold text-white tracking-tight">{trade.pair}</h1>
             <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                 trade.direction === 'Buy' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
             }`}>
                {trade.direction}
             </span>
           </div>
           <p className="text-textMuted flex items-center gap-2 text-sm">
             <span>{trade.date}</span> • <span>{trade.session} Session</span> • <span>{trade.timeframe} TF</span>
           </p>
        </div>

        <div className="flex items-center gap-4">
             <div className="text-right">
                <p className="text-xs text-textMuted uppercase tracking-wider">Outcome</p>
                <div className={`flex items-center justify-end gap-1.5 font-bold text-lg ${
                    trade.outcome === 'Win' ? 'text-primary' : trade.outcome === 'Loss' ? 'text-red-400' : 'text-zinc-400'
                }`}>
                   {trade.outcome === 'Win' && <CheckCircle2 className="w-5 h-5" />}
                   {trade.outcome === 'Loss' && <XCircle className="w-5 h-5" />}
                   {trade.outcome === 'Breakeven' && <Minus className="w-5 h-5" />}
                   {trade.outcome}
                </div>
             </div>
             <div className="h-10 w-px bg-white/10"></div>
             <div className="text-right">
                <p className="text-xs text-textMuted uppercase tracking-wider">R:R</p>
                <p className="font-mono text-lg font-medium text-white">{trade.rr}R</p>
             </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Trade Data */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-surface border border-white/5 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-medium text-white border-b border-white/5 pb-3">Entry Metrics</h3>
              <div className="space-y-3 text-sm">
                 <div className="flex justify-between">
                    <span className="text-textMuted">Entry Price</span>
                    <span className="text-white font-mono">{trade.entryPrice}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-textMuted">Stop Loss</span>
                    <span className="text-red-400 font-mono">{trade.stopLoss}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-textMuted">Take Profit</span>
                    <span className="text-primary font-mono">{trade.takeProfit}</span>
                 </div>
                 <div className="flex justify-between">
                    <span className="text-textMuted">Risk</span>
                    <span className="text-white font-mono">{trade.riskPercentage}%</span>
                 </div>
              </div>
           </div>

           <div className="bg-surface border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-medium text-white border-b border-white/5 pb-3 mb-3">Trader's Notes</h3>
              <p className="text-sm text-textMuted leading-relaxed italic">
                "{trade.reason}"
              </p>
           </div>
        </div>

        {/* Right: AI Analysis */}
        <div className="lg:col-span-2">
           <div className="bg-surface border border-white/5 rounded-2xl p-6 min-h-[400px] flex flex-col">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <Bot className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">AI Coach Analysis</h3>
                        <p className="text-xs text-textMuted">Powered by Gemini 3 Flash</p>
                    </div>
                 </div>
                 
                 {!trade.aiAnalysis && (
                     <button
                        onClick={handleAnalyze}
                        disabled={loading}
                        className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                     >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                        {loading ? 'Analyzing...' : 'Analyze Trade'}
                     </button>
                 )}
              </div>

              <div className="flex-1">
                 {!apiKey && !trade.aiAnalysis && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-xl">
                        <AlertTriangle className="w-10 h-10 text-yellow-500 mb-3" />
                        <h4 className="text-white font-medium">API Key Missing</h4>
                        <p className="text-sm text-textMuted mt-1 mb-4 max-w-xs">
                            To use the AI Coach, you need to add your free Google Gemini API key in settings.
                        </p>
                        <button 
                            onClick={onNavigateSettings}
                            className="text-sm text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            Go to Settings
                        </button>
                    </div>
                 )}

                 {apiKey && !trade.aiAnalysis && !loading && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                       <Target className="w-12 h-12 mb-4" />
                       <p className="text-sm">Ready to analyze your execution.</p>
                       <p className="text-xs">Click the button above to start coaching.</p>
                    </div>
                 )}
                 
                 {loading && (
                    <div className="space-y-4 animate-pulse">
                       <div className="h-4 bg-white/5 rounded w-3/4"></div>
                       <div className="h-4 bg-white/5 rounded w-full"></div>
                       <div className="h-4 bg-white/5 rounded w-5/6"></div>
                       <div className="h-20 bg-white/5 rounded w-full mt-6"></div>
                    </div>
                 )}

                 {trade.aiAnalysis && (
                    <div className="prose prose-invert prose-sm max-w-none text-textMuted">
                        <ReactMarkdown 
                            components={{
                                h1: ({node, ...props}) => <h3 className="text-lg font-bold text-white mt-4 mb-2" {...props} />,
                                h2: ({node, ...props}) => <h4 className="text-base font-semibold text-white mt-4 mb-2" {...props} />,
                                h3: ({node, ...props}) => <h5 className="text-sm font-semibold text-white mt-3 mb-1" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 mb-4" {...props} />,
                                li: ({node, ...props}) => <li className="text-zinc-300" {...props} />,
                                strong: ({node, ...props}) => <strong className="text-primary font-semibold" {...props} />,
                            }}
                        >
                            {trade.aiAnalysis}
                        </ReactMarkdown>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TradeDetail;