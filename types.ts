export type Session = 'Asia' | 'London' | 'New York';
export type Direction = 'Buy' | 'Sell';
export type Outcome = 'Win' | 'Loss' | 'Breakeven';

export interface User {
  name: string;
  email: string;
  joinedAt: string;
}

export interface Trade {
  id: string;
  pair: string;
  direction: Direction;
  timeframe: string;
  session: Session;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskPercentage: number;
  outcome: Outcome;
  rr: number; // Risk to Reward achieved
  date: string;
  reason: string; // Trader's notes
  aiAnalysis?: string; // Cache AI response
}

export interface TradeStats {
  totalTrades: number;
  winRate: number;
  avgRR: number;
  pnlPercentage: number;
}