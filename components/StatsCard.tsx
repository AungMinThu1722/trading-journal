import React from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, subValue, trend }) => {
  return (
    <div className="bg-surface border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
      <p className="text-sm text-textMuted font-medium tracking-wide mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-3xl font-semibold text-white tracking-tight">{value}</h3>
        {subValue && (
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
            trend === 'up' ? 'bg-primary/10 text-primary' :
            trend === 'down' ? 'bg-red-500/10 text-red-400' :
            'bg-zinc-800 text-zinc-400'
          }`}>
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
