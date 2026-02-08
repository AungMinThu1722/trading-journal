import React from 'react';
import { Trade } from '../types';
import StatsCard from './StatsCard';
import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  trades: Trade[];
  onSelectTrade: (trade: Trade) => void;
  onAddTrade: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ trades, onSelectTrade, onAddTrade }) => {
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.outcome === 'Win').length;
  const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(0) : 0;
  
  // Simple Mock PnL Calc assuming 1% risk per trade.
  // Win = +2% (approx for 1:2 RR avg), Loss = -1%.
  const pnl = trades.reduce((acc, t) => {
    if (t.outcome === 'Win') return acc + t.rr;
    if (t.outcome === 'Loss') return acc - 1;
    return acc;
  }, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Dashboard</h2>
          <p className="text-textMuted text-sm mt-1">Performance Overview</p>
        </div>
        <button 
          onClick={onAddTrade}
          className="px-4 py-2 bg-primary text-black text-sm font-medium rounded-lg hover:bg-emerald-400 transition-colors"
        >
          + New Trade
        </button>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label="Win Rate" value={`${winRate}%`} subValue="+2.4%" trend="up" />
        <StatsCard label="Net R:R" value={`${pnl.toFixed(2)}R`} subValue="This Week" trend={pnl >= 0 ? 'up' : 'down'} />
        <StatsCard label="Total Trades" value={totalTrades} />
        <StatsCard label="Avg Risk" value="1.0%" subValue="Steady" trend="neutral" />
      </div>

      {/* Recent Trades Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <h3 className="text-lg font-medium text-white">Recent Journal Entries</h3>
           <button className="text-sm text-primary hover:text-emerald-400 flex items-center gap-1">
             View All <ArrowUpRight className="w-3 h-3" />
           </button>
        </div>
        
        <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-textMuted bg-white/[0.02]">
                <th className="p-4 font-medium pl-6">Pair</th>
                <th className="p-4 font-medium">Session</th>
                <th className="p-4 font-medium">Direction</th>
                <th className="p-4 font-medium">Outcome</th>
                <th className="p-4 font-medium text-right pr-6">R:R</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {trades.map((trade) => (
                <tr 
                  key={trade.id} 
                  onClick={() => onSelectTrade(trade)}
                  className="hover:bg-white/[0.03] cursor-pointer transition-colors group"
                >
                  <td className="p-4 pl-6 font-medium text-white flex flex-col justify-center">
                    <span>{trade.pair}</span>
                    <span className="text-[10px] text-textMuted font-normal">{trade.date}</span>
                  </td>
                  <td className="p-4 text-textMuted">{trade.session}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                      trade.direction === 'Buy' 
                        ? 'bg-blue-500/10 text-blue-400' 
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {trade.direction === 'Buy' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {trade.direction}
                    </span>
                  </td>
                  <td className="p-4">
                     <span className={`px-2 py-1 rounded text-xs font-medium border ${
                       trade.outcome === 'Win' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                       trade.outcome === 'Loss' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                       'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                     }`}>
                       {trade.outcome}
                     </span>
                  </td>
                  <td className="p-4 text-right pr-6 font-mono text-white">
                    {trade.rr > 0 ? '+' : ''}{trade.rr}R
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;