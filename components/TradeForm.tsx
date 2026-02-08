import React, { useState } from 'react';
import { Trade, Direction, Session, Outcome } from '../types';
import { ArrowLeft, Save } from 'lucide-react';

interface TradeFormProps {
  onSave: (trade: Omit<Trade, 'id'>) => void;
  onCancel: () => void;
}

const TradeForm: React.FC<TradeFormProps> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    pair: '',
    direction: 'Buy' as Direction,
    session: 'New York' as Session,
    timeframe: '15m',
    entryPrice: '',
    stopLoss: '',
    takeProfit: '',
    riskPercentage: '1',
    outcome: 'Win' as Outcome,
    reason: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateRR = () => {
    const entry = parseFloat(formData.entryPrice);
    const sl = parseFloat(formData.stopLoss);
    const tp = parseFloat(formData.takeProfit);
    if (isNaN(entry) || isNaN(sl) || isNaN(tp)) return 0;
    
    const risk = Math.abs(entry - sl);
    const reward = Math.abs(tp - entry);
    if (risk === 0) return 0;
    return parseFloat((reward / risk).toFixed(2));
  };

  const rr = calculateRR();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      pair: formData.pair.toUpperCase(),
      entryPrice: parseFloat(formData.entryPrice) || 0,
      stopLoss: parseFloat(formData.stopLoss) || 0,
      takeProfit: parseFloat(formData.takeProfit) || 0,
      riskPercentage: parseFloat(formData.riskPercentage) || 0,
      rr
    });
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onCancel}
          type="button"
          className="flex items-center text-sm text-textMuted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cancel
        </button>
        <h2 className="text-xl font-bold text-white">Log New Trade</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
            {/* Top Row: Pair, Date, Timeframe */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-medium text-textMuted uppercase tracking-wider">Pair</label>
                    <input 
                        type="text" 
                        required
                        placeholder="EUR/USD"
                        value={formData.pair}
                        onChange={(e) => handleChange('pair', e.target.value)}
                        className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors"
                    />
                </div>
                 <div className="space-y-2">
                    <label className="text-xs font-medium text-textMuted uppercase tracking-wider">Date</label>
                    <input 
                        type="date" 
                        required
                        value={formData.date}
                        onChange={(e) => handleChange('date', e.target.value)}
                        className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors [color-scheme:dark]"
                    />
                </div>
                 <div className="space-y-2">
                    <label className="text-xs font-medium text-textMuted uppercase tracking-wider">Timeframe</label>
                    <input 
                        type="text" 
                        placeholder="15m"
                        value={formData.timeframe}
                        onChange={(e) => handleChange('timeframe', e.target.value)}
                        className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors"
                    />
                </div>
            </div>

            {/* Direction & Session */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-medium text-textMuted uppercase tracking-wider">Direction</label>
                    <div className="grid grid-cols-2 gap-2 bg-background p-1 rounded-lg border border-white/10">
                        <button
                            type="button"
                            onClick={() => handleChange('direction', 'Buy')}
                            className={`py-2 rounded-md text-sm font-medium transition-all ${formData.direction === 'Buy' ? 'bg-blue-500/20 text-blue-400' : 'text-textMuted hover:text-white'}`}
                        >
                            Buy
                        </button>
                        <button
                            type="button"
                            onClick={() => handleChange('direction', 'Sell')}
                            className={`py-2 rounded-md text-sm font-medium transition-all ${formData.direction === 'Sell' ? 'bg-red-500/20 text-red-400' : 'text-textMuted hover:text-white'}`}
                        >
                            Sell
                        </button>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-medium text-textMuted uppercase tracking-wider">Session</label>
                     <select 
                        value={formData.session}
                        onChange={(e) => handleChange('session', e.target.value)}
                        className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors appearance-none"
                    >
                        <option value="Asia">Asia</option>
                        <option value="London">London</option>
                        <option value="New York">New York</option>
                    </select>
                </div>
            </div>

            {/* Price Data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-white/5">
                 <div className="space-y-2">
                    <label className="text-xs font-medium text-textMuted uppercase tracking-wider">Entry Price</label>
                    <input 
                        type="number" 
                        step="any"
                        required
                        value={formData.entryPrice}
                        onChange={(e) => handleChange('entryPrice', e.target.value)}
                        className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors font-mono"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-medium text-textMuted uppercase tracking-wider">Stop Loss</label>
                    <input 
                        type="number" 
                        step="any"
                        required
                        value={formData.stopLoss}
                        onChange={(e) => handleChange('stopLoss', e.target.value)}
                        className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-red-400 focus:border-red-500 focus:outline-none transition-colors font-mono"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-medium text-textMuted uppercase tracking-wider">Take Profit</label>
                    <input 
                        type="number" 
                        step="any"
                        required
                        value={formData.takeProfit}
                        onChange={(e) => handleChange('takeProfit', e.target.value)}
                        className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-primary focus:border-emerald-500 focus:outline-none transition-colors font-mono"
                    />
                </div>
            </div>
            
            {/* Outcome & Risk */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-medium text-textMuted uppercase tracking-wider">Risk %</label>
                    <input 
                        type="number" 
                        step="0.1"
                        value={formData.riskPercentage}
                        onChange={(e) => handleChange('riskPercentage', e.target.value)}
                        className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-medium text-textMuted uppercase tracking-wider">Outcome</label>
                     <select 
                        value={formData.outcome}
                        onChange={(e) => handleChange('outcome', e.target.value)}
                        className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors appearance-none"
                    >
                        <option value="Win">Win</option>
                        <option value="Loss">Loss</option>
                        <option value="Breakeven">Breakeven</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-medium text-textMuted uppercase tracking-wider">Calculated R:R</label>
                    <div className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-3 text-white font-mono flex items-center">
                        {rr > 0 ? `${rr}R` : '-'}
                    </div>
                </div>
            </div>

            {/* Notes */}
            <div className="space-y-2 pt-4 border-t border-white/5">
                <label className="text-xs font-medium text-textMuted uppercase tracking-wider">Trade Logic & Notes</label>
                <textarea 
                    rows={4}
                    value={formData.reason}
                    onChange={(e) => handleChange('reason', e.target.value)}
                    placeholder="Describe your entry reason, confluences, and emotions..."
                    className="w-full bg-background border border-white/10 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors resize-none"
                />
            </div>
        </div>

        <div className="flex justify-end pt-4">
             <button
                type="submit"
                className="flex items-center gap-2 px-8 py-3 bg-primary text-black font-semibold rounded-xl hover:bg-emerald-400 transition-all hover:scale-[1.02]"
             >
                <Save className="w-4 h-4" />
                Save to Journal
             </button>
        </div>
      </form>
    </div>
  );
};

export default TradeForm;