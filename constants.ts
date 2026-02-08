import { Trade } from './types';
import { LayoutDashboard, BookOpen, User, Settings, LogOut } from 'lucide-react';

export const MOCK_TRADES: Trade[] = [
  {
    id: '1',
    pair: 'EUR/USD',
    direction: 'Sell',
    timeframe: '15m',
    session: 'London',
    entryPrice: 1.0850,
    stopLoss: 1.0870,
    takeProfit: 1.0810,
    riskPercentage: 1,
    outcome: 'Win',
    rr: 2.0,
    date: '2023-10-24',
    reason: 'Liquidity sweep of Asian high, break of structure to downside. Entered on retest of order block.',
  },
  {
    id: '2',
    pair: 'GBP/JPY',
    direction: 'Buy',
    timeframe: '5m',
    session: 'New York',
    entryPrice: 182.40,
    stopLoss: 182.20,
    takeProfit: 183.00,
    riskPercentage: 1,
    outcome: 'Loss',
    rr: -1.0,
    date: '2023-10-25',
    reason: 'Saw momentum candle, jumped in without waiting for pullback. FOMO entry.',
  },
  {
    id: '3',
    pair: 'XAU/USD',
    direction: 'Sell',
    timeframe: '1h',
    session: 'New York',
    entryPrice: 1980.50,
    stopLoss: 1985.00,
    takeProfit: 1970.00,
    riskPercentage: 0.5,
    outcome: 'Breakeven',
    rr: 0,
    date: '2023-10-26',
    reason: 'Followed HTF trend, price moved 1:1 then reversed. Closed manually.',
  }
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'coach', label: 'AI Coach', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
];
