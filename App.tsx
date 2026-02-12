import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Bell, BellOff, LayoutDashboard, TrendingUp, Search, AlertCircle, Filter, Settings as SettingsIcon, Sun, Moon, RefreshCw, Activity, BookOpen, BookText, LayoutGrid, CalendarDays, Menu, ChevronDown, ChevronUp, Radio, KeyRound } from 'lucide-react';
import axios from 'axios';
import Chart from './components/Chart';
import PatternCard from './components/PatternCard';
import PatternDetail from './components/PatternDetail';
import NotificationSettings from './components/NotificationSettings';
import PatternGlossary from './components/PatternGlossary';
import TradingJournal from './components/TradingJournal';
import WeeklyPlanning from './components/WeeklyPlanning';
import { FOREX_PAIRS, TIMEFRAMES } from './constants';
import { Candle, Detection, Timeframe, NotificationConfig, PatternType } from './types';
import { scanHistory, detectPatterns } from './engine/detector';
import { useRealtimeDetections } from './hooks/useRealtimeDetections';

// API Keys Management
const API_KEYS = [
  '556aa6d666ac4326b820ca5c57dcf145', // Key 1
  '4d89666d445d4968b0b852806d425547'  // Key 2
];

// Cache interface
interface CacheEntry {
  candles: Candle[];
  timestamp: number;
}

type View = 'dashboard' | 'journal' | 'planning';

const App: React.FC = () => {
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to Dark Mode
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSignalsOpen, setIsMobileSignalsOpen] = useState(false);

  const [selectedPair, setSelectedPair] = useState(FOREX_PAIRS[0].symbol);
  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('D1');
  const [searchQuery, setSearchQuery] = useState('');
  
  // API Key State
  const [currentApiKeyIndex, setCurrentApiKeyIndex] = useState(0);

  // Notification State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>(() => {
    try {
      const saved = localStorage.getItem('patternPro_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load settings", e);
    }
    return {
      masterEnabled: false,
      pairs: FOREX_PAIRS.map(p => p.symbol),
      patterns: Object.values(PatternType).filter(p => p !== PatternType.NONE)
    };
  });
  
  // Data State
  const [detections, setDetections] = useState<Detection[]>(() => {
    try {
      const saved = localStorage.getItem('patternPro_detections');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to load detections from local storage", e);
      return [];
    }
  });

  // Persist detections to localStorage
  useEffect(() => {
    localStorage.setItem('patternPro_detections', JSON.stringify(detections));
  }, [detections]);

  const [candles, setCandles] = useState<Candle[]>([]);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDetection, setSelectedDetection] = useState<Detection | null>(null);
  const [wsStatus, setWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [backgroundScanningPair, setBackgroundScanningPair] = useState<string | null>(null);

  const { saveDetection } = useRealtimeDetections();
  
  // Refs for persistence and caching
  const wsRef = useRef<WebSocket | null>(null);
  const currentPairRef = useRef(selectedPair); // Track current pair for WS callback
  const currentTimeframeRef = useRef(selectedTimeframe); // Track timeframe for WS callback logic
  const dataCache = useRef<Record<string, CacheEntry>>({});
  const lastApiCallTime = useRef<number>(0);
  
  // Background Scanning Ref
  const backgroundScanIndex = useRef(0);
  
  // Detection State Ref
  const lastCandleCountRef = useRef(0);

  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Helper to get timeframe duration in seconds
  const getTimeframeSeconds = (tf: Timeframe) => {
    switch(tf) {
      case 'H4': return 4 * 60 * 60;
      case 'D1': return 24 * 60 * 60;
      case 'W1': return 7 * 24 * 60 * 60;
      default: return 24 * 60 * 60;
    }
  };

  const handleSaveSettings = useCallback(async (newConfig: NotificationConfig) => {
    setNotificationConfig(newConfig);
    localStorage.setItem('patternPro_config', JSON.stringify(newConfig));
    if (newConfig.masterEnabled && Notification.permission !== 'granted') {
       await Notification.requestPermission();
    }
  }, []);

  const toggleNotifications = async () => {
    const newState = !notificationConfig.masterEnabled;
    const newConfig = { ...notificationConfig, masterEnabled: newState };
    handleSaveSettings(newConfig);
  };

  // Manual API Key Toggle
  const toggleApiKey = () => {
    const nextIndex = (currentApiKeyIndex + 1) % API_KEYS.length;
    setCurrentApiKeyIndex(nextIndex);
    // Clear cache to force refresh with new key
    dataCache.current = {};
    fetchHistoricalData(selectedPair, selectedTimeframe);
  };

  /**
   * Helper to generate mock data when API is exhausted
   */
  const generateMockData = (pair: string, tf: Timeframe) => {
    const count = 50;
    const tfSeconds = getTimeframeSeconds(tf);
    const now = Math.floor(Date.now() / 1000);
    let time = now - (count * tfSeconds);
    
    let basePrice = 1.0800;
    if (pair.includes('JPY')) basePrice = 150.00;
    else if (pair.includes('XAU')) basePrice = 2000.00;
    else if (pair.includes('GBP')) basePrice = 1.2600;
    else if (pair.includes('AUD')) basePrice = 0.6500;
    
    const volatility = basePrice * 0.003;
    let currentPrice = basePrice;
    
    const mockCandles: Candle[] = [];
    for (let i = 0; i < count; i++) {
        const change = (Math.random() - 0.5) * volatility;
        const open = currentPrice;
        const close = open + change;
        const high = Math.max(open, close) + (Math.random() * volatility * 0.5);
        const low = Math.min(open, close) - (Math.random() * volatility * 0.5);
        
        mockCandles.push({
            time, open, high, low, close
        });
        time += tfSeconds;
        currentPrice = close;
    }
    return mockCandles;
  };

  /**
   * General fetch function that can be used for main view OR background scan
   * Now accepts a specific apiKeyIndex
   */
  const fetchCandleData = async (pairSymbol: string, timeframe: Timeframe, apiKeyIndex: number) => {
    const API_KEY = API_KEYS[apiKeyIndex]; 
    const intervalMap: Record<string, string> = { 'H4': '4h', 'D1': '1day', 'W1': '1week' };
    const pairConfig = FOREX_PAIRS.find(p => p.symbol === pairSymbol);
    const querySymbol = pairConfig?.apiSymbol || pairSymbol;

    const response = await axios.get(`https://api.twelvedata.com/time_series`, {
      params: {
        symbol: querySymbol,
        interval: intervalMap[timeframe],
        apikey: API_KEY,
        outputsize: 50
      }
    });

    if (response.data.status === 'error') {
       // Propagate API credit errors specifically
       if (response.data.message?.includes('credits') || response.data.code === 429) {
          throw new Error('API_LIMIT_REACHED');
       }
       throw new Error(response.data.message);
    }

    const values = response.data.values;
    if (!values || !Array.isArray(values)) throw new Error('No data available');

    return values.map((v: any) => ({
      time: Math.floor(new Date(v.datetime).getTime() / 1000),
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close)
    })).sort((a: Candle, b: Candle) => a.time - b.time);
  };

  /**
   * Background Scanner Logic
   */
  useEffect(() => {
    const runBackgroundScan = async () => {
      const nextIndex = (backgroundScanIndex.current + 1) % FOREX_PAIRS.length;
      backgroundScanIndex.current = nextIndex;
      const pairToScan = FOREX_PAIRS[nextIndex].symbol;
      const timeframeToScan: Timeframe = 'D1';

      if (pairToScan === selectedPair) return;

      setBackgroundScanningPair(pairToScan);

      try {
        // Use currently active key for background scans
        const fetchedCandles = await fetchCandleData(pairToScan, timeframeToScan, currentApiKeyIndex);
        const historicalDetections = scanHistory(fetchedCandles, pairToScan, timeframeToScan);

        if (historicalDetections.length > 0) {
          setDetections(prev => {
            const ids = new Set(prev.map(d => d.id));
            const newUnique = historicalDetections.filter(d => !ids.has(d.id));
            if (newUnique.length === 0) return prev;
            return [...newUnique, ...prev].sort((a, b) => b.timestamp - a.timestamp).slice(0, 1000);
          });
        }
      } catch (e: any) {
        if (e.message === 'API_LIMIT_REACHED' || e.message?.includes('credits')) {
             // If Limit reached in background, just stop silently or demo mode logic
             // We won't auto-rotate keys in background to save them for user interaction
        } else {
             console.warn(`Background scan failed for ${pairToScan}`, e);
        }
      } finally {
        setTimeout(() => setBackgroundScanningPair(null), 2000);
      }
    };

    // Reduced to every 5 minutes (300,000ms) to save API calls
    const intervalId = setInterval(runBackgroundScan, 300000);
    return () => clearInterval(intervalId);
  }, [selectedPair, currentApiKeyIndex]); // Added currentApiKeyIndex dep


  /**
   * Fetches historical data for the ACTIVE view
   * Implements API Key Rotation Logic
   */
  const fetchHistoricalData = useCallback(async (pairSymbol: string, timeframe: Timeframe) => {
    const cacheKey = `${pairSymbol}-${timeframe}`;
    const now = Date.now();
    
    // 1. Check Cache
    if (dataCache.current[cacheKey] && (now - dataCache.current[cacheKey].timestamp < 15 * 60 * 1000)) {
      console.log('Using cached data for', pairSymbol);
      const cached = dataCache.current[cacheKey];
      setCandles(cached.candles);
      const historicalDetections = scanHistory(cached.candles, pairSymbol, timeframe);
      
      setDetections(prev => {
        const ids = new Set(prev.map(d => d.id));
        const newUnique = historicalDetections.filter(d => !ids.has(d.id));
        if (newUnique.length === 0) return prev;
        return [...newUnique, ...prev].sort((a, b) => b.timestamp - a.timestamp).slice(0, 1000);
      });
      setError(null);
      return;
    }

    // 2. Rate Limit Check (Local App Throttling)
    const timeSinceLastCall = now - lastApiCallTime.current;
    if (timeSinceLastCall < 2000) {
      await new Promise(r => setTimeout(r, 2000 - timeSinceLastCall));
    }

    setIsLoading(true);
    setError(null);
    
    let attempts = 0;
    let success = false;
    let activeKeyIndex = currentApiKeyIndex;

    // Retry Loop for Multiple Keys
    while (attempts < API_KEYS.length && !success) {
      try {
        lastApiCallTime.current = Date.now();
        const fetchedCandles = await fetchCandleData(pairSymbol, timeframe, activeKeyIndex);

        setCandles(fetchedCandles);
        
        dataCache.current[cacheKey] = {
          candles: fetchedCandles,
          timestamp: Date.now()
        };

        const historicalDetections = scanHistory(fetchedCandles, pairSymbol, timeframe);
        
        setDetections(prev => {
          const ids = new Set(prev.map(d => d.id));
          const newUnique = historicalDetections.filter(d => !ids.has(d.id));
          if (newUnique.length === 0) return prev;
          
          const combined = [...newUnique, ...prev].sort((a, b) => b.timestamp - a.timestamp);
          return combined.slice(0, 1000);
        });

        // If we succeeded with a different key than state, update state
        if (activeKeyIndex !== currentApiKeyIndex) {
          console.log(`Switched to API Key #${activeKeyIndex + 1} automatically.`);
          setCurrentApiKeyIndex(activeKeyIndex);
        }

        success = true;

      } catch (err: any) {
        const isLimitError = err.message === 'API_LIMIT_REACHED' || err.message?.includes('credits') || err.message?.includes('Limit') || (err.response && err.response.status === 429);
        
        if (isLimitError) {
          console.warn(`API Key #${activeKeyIndex + 1} Limit Reached. Trying next key...`);
          activeKeyIndex = (activeKeyIndex + 1) % API_KEYS.length;
          attempts++;
        } else {
          // If it's a non-limit error (e.g., Network), don't rotate keys, just throw
          console.error('API Fetch Error:', err.message);
          setError(err.message);
          setIsLoading(false);
          return; 
        }
      }
    }

    // If loop finished and still no success (All keys failed)
    if (!success) {
      console.warn("All API Keys Exhausted. Switching to Demo Mode.");
      let displayCandles: Candle[] = [];

      // Try to fallback to any cache even if expired
      if (dataCache.current[cacheKey]) {
        displayCandles = dataCache.current[cacheKey].candles;
        setError('Daily Limits Reached (All Keys). Showing cached data.');
      } else {
          // Generate mock data for demo mode
          displayCandles = generateMockData(pairSymbol, timeframe);
          
          dataCache.current[cacheKey] = {
            candles: displayCandles,
            timestamp: Date.now()
          };
          setError('Daily Limits Reached (All Keys). Switching to Demo Mode.');
      }
      
      setCandles(displayCandles);
      const historicalDetections = scanHistory(displayCandles, pairSymbol, timeframe);
      setDetections(prev => {
        const ids = new Set(prev.map(d => d.id));
        const newUnique = historicalDetections.filter(d => !ids.has(d.id));
        if (newUnique.length === 0) return prev;
        return [...newUnique, ...prev].sort((a, b) => b.timestamp - a.timestamp).slice(0, 1000);
      });
    }

    setIsLoading(false);

  }, [currentApiKeyIndex]); // Re-create if current key changes manually

  const handleManualRefresh = useCallback(() => {
    const cacheKey = `${selectedPair}-${selectedTimeframe}`;
    if (dataCache.current[cacheKey]) {
      delete dataCache.current[cacheKey];
    }
    fetchHistoricalData(selectedPair, selectedTimeframe);
  }, [selectedPair, selectedTimeframe, fetchHistoricalData]);

  // Update refs and handle polling
  useEffect(() => {
    currentPairRef.current = selectedPair;
    currentTimeframeRef.current = selectedTimeframe;
    
    // Reset candle count ref on view change to prevent detection spam
    lastCandleCountRef.current = 0;

    // Initial fetch
    fetchHistoricalData(selectedPair, selectedTimeframe);

    // Automatic sync polling every 15 minutes (900,000ms)
    const pollInterval = setInterval(() => {
       const cacheKey = `${selectedPair}-${selectedTimeframe}`;
       if (dataCache.current[cacheKey]) {
           const age = Date.now() - dataCache.current[cacheKey].timestamp;
           // If older than 14.5 minutes, force refresh
           if (age > 870000) {
               delete dataCache.current[cacheKey];
               fetchHistoricalData(selectedPair, selectedTimeframe);
           }
       } else {
           fetchHistoricalData(selectedPair, selectedTimeframe);
       }
    }, 900000);

    return () => clearInterval(pollInterval);
  }, [selectedPair, selectedTimeframe, fetchHistoricalData]);


  // Effect to handle side effects of candle updates (Cache sync & Pattern Detection)
  useEffect(() => {
    if (candles.length === 0) return;

    const currentPair = selectedPair; 
    const currentTimeframe = selectedTimeframe;

    // 1. Sync Cache with latest candles (including live updates)
    const cacheKey = `${currentPair}-${currentTimeframe}`;
    if (dataCache.current[cacheKey]) {
        dataCache.current[cacheKey].candles = candles;
    }

    // 2. Pattern Detection on New Candle Closure
    // We only detect when a NEW candle has been finalized (array length increases by exactly 1)
    if (lastCandleCountRef.current > 0 && candles.length === lastCandleCountRef.current + 1) {
        // The candle that just finished is the second to last one
        const closedCandles = candles.slice(0, -1);
        
        // Run detection on the closed candle
        const newDetection = detectPatterns(closedCandles, currentPair, currentTimeframe);

        if (newDetection) {
            setDetections(prev => {
                if (prev.find(d => d.id === newDetection.id)) return prev;
                const updated = [newDetection, ...prev];
                return updated.slice(0, 1000);
            });
            
            saveDetection(newDetection);

            if (notificationConfig.masterEnabled) {
                const isPairAllowed = notificationConfig.pairs.includes(newDetection.pair);
                const isPatternAllowed = notificationConfig.patterns.includes(newDetection.pattern);

                if (isPairAllowed && isPatternAllowed && Notification.permission === 'granted') {
                    new Notification(`New ${newDetection.pattern} Signal!`, {
                        body: `${newDetection.pair} closed at ${newDetection.price.toFixed(5)}`,
                        icon: '/icon.png',
                    });
                }
            }
        }
    }

    // Update ref to current length
    lastCandleCountRef.current = candles.length;

  }, [candles, selectedPair, selectedTimeframe, notificationConfig, saveDetection]);


  /**
   * Persistent WebSocket Connection
   */
  useEffect(() => {
    // Use the CURRENT API key for WebSocket connection
    const API_KEY = API_KEYS[currentApiKeyIndex];
    let heartbeatInterval: any;

    const initWebSocket = () => {
      // Close existing if open to switch keys
      if (wsRef.current) {
         wsRef.current.close();
      }

      setWsStatus('connecting');
      const ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes?apikey=${API_KEY}`);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('connected');
        const pairConfig = FOREX_PAIRS.find(p => p.symbol === currentPairRef.current);
        const querySymbol = pairConfig?.apiSymbol || currentPairRef.current;
        
        ws.send(JSON.stringify({
          action: "subscribe",
          params: { symbols: querySymbol }
        }));

        heartbeatInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: "heartbeat" }));
          }
        }, 10000);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.event === 'price') {
          const pairConfig = FOREX_PAIRS.find(p => p.symbol === currentPairRef.current);
          const currentQuerySymbol = pairConfig?.apiSymbol || currentPairRef.current;

          if (data.symbol === currentQuerySymbol) {
             handleRealtimeTick(data.price, currentPairRef.current);
          }
        }
      };

      ws.onerror = (e) => {
        console.error("WS Error", e);
        setWsStatus('disconnected');
      };

      ws.onclose = () => {
        setWsStatus('disconnected');
        clearInterval(heartbeatInterval);
      };
    };

    initWebSocket();

    return () => {
      clearInterval(heartbeatInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [currentApiKeyIndex]); // Re-connect if API Key changes

  // Manage Subscriptions when selectedPair changes
  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
       const pairConfig = FOREX_PAIRS.find(p => p.symbol === selectedPair);
       const querySymbol = pairConfig?.apiSymbol || selectedPair;
       
       wsRef.current.send(JSON.stringify({
         action: "subscribe",
         params: { symbols: querySymbol }
       }));
    }
  }, [selectedPair]);


  const handleRealtimeTick = (price: number, activePair: string) => {
    setLivePrice(price);
    setCandles(prevCandles => {
      if (prevCandles.length === 0) return prevCandles;

      const lastCandle = prevCandles[prevCandles.length - 1];
      // Use Ref to avoid stale closure for timeframe
      const tfSeconds = getTimeframeSeconds(currentTimeframeRef.current);
      const now = Math.floor(Date.now() / 1000);
      const isCandleOpen = now < (lastCandle.time + tfSeconds);

      if (isCandleOpen) {
        const updatedCandle = {
          ...lastCandle,
          high: Math.max(lastCandle.high, price),
          low: Math.min(lastCandle.low, price),
          close: price
        };
        return [...prevCandles.slice(0, -1), updatedCandle];
      } else {
        // Start new candle
        // The previous candle is finalized as it was in the previous state
        const newCandle: Candle = {
          time: lastCandle.time + tfSeconds,
          open: price,
          high: price,
          low: price,
          close: price
        };
        return [...prevCandles, newCandle];
      }
    });
  };

  const filteredDetections = useMemo(() => {
    if (!searchQuery.trim()) return detections;
    const query = searchQuery.toLowerCase();
    return detections.filter(d => 
      d.pair.toLowerCase().includes(query) ||
      d.pattern.toLowerCase().includes(query) ||
      d.timeframe.toLowerCase().includes(query)
    );
  }, [detections, searchQuery]);

  // Color & Theme Helpers
  const primaryColor = isDarkMode ? 'text-amber-400' : 'text-blue-600';
  const activeBg = isDarkMode ? 'bg-amber-400/10' : 'bg-blue-50';

  return (
    <div className={`h-[100dvh] flex w-full max-w-[1920px] mx-auto font-sans transition-colors duration-300 overflow-hidden relative
      ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* DESKTOP SIDEBAR MENU - Changed lg:flex to md:flex */}
      <nav className={`hidden md:flex w-20 shrink-0 flex-col items-center py-6 gap-6 border-r z-50 transition-colors duration-300
        ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
        
        {/* Logo */}
        <div className={`p-2.5 rounded-xl mb-4 shadow-lg ${isDarkMode ? 'bg-amber-500/10 text-amber-500 shadow-amber-500/10' : 'bg-blue-600 text-white shadow-blue-500/30'}`}>
           <TrendingUp className="w-6 h-6" />
        </div>

        {/* Menu Items */}
        <div className="flex flex-col gap-4 w-full px-2">
           <button 
             onClick={() => setCurrentView('dashboard')}
             className={`p-3 rounded-xl transition-all relative group flex justify-center
               ${currentView === 'dashboard' 
                 ? (isDarkMode ? 'bg-zinc-800 text-amber-500' : 'bg-blue-50 text-blue-600') 
                 : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'}`}
             title="Dashboard"
           >
             <LayoutGrid className="w-6 h-6" />
             {currentView === 'dashboard' && <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${isDarkMode ? 'bg-amber-500' : 'bg-blue-600'}`} />}
           </button>

           <button 
             onClick={() => setCurrentView('journal')}
             className={`p-3 rounded-xl transition-all relative group flex justify-center
               ${currentView === 'journal' 
                 ? (isDarkMode ? 'bg-zinc-800 text-amber-500' : 'bg-blue-50 text-blue-600') 
                 : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'}`}
             title="Trading Journal"
           >
             <BookText className="w-6 h-6" />
             {currentView === 'journal' && <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${isDarkMode ? 'bg-amber-500' : 'bg-blue-600'}`} />}
           </button>

           <button 
             onClick={() => setCurrentView('planning')}
             className={`p-3 rounded-xl transition-all relative group flex justify-center
               ${currentView === 'planning' 
                 ? (isDarkMode ? 'bg-zinc-800 text-amber-500' : 'bg-blue-50 text-blue-600') 
                 : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'}`}
             title="Weekly Planning"
           >
             <CalendarDays className="w-6 h-6" />
             {currentView === 'planning' && <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${isDarkMode ? 'bg-amber-500' : 'bg-blue-600'}`} />}
           </button>
        </div>

        <div className="mt-auto flex flex-col gap-4">
           {/* API Key Toggle */}
           <button 
                onClick={toggleApiKey}
                className={`p-3 rounded-xl transition-all group relative ${isDarkMode ? 'bg-zinc-800 text-emerald-400 hover:bg-zinc-700' : 'bg-slate-100 text-emerald-600 hover:bg-slate-200'}`}
                title={`Switch API Key (Current: #${currentApiKeyIndex + 1})`}
              >
                <KeyRound className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] text-white font-bold border-2 border-zinc-900">
                  {currentApiKeyIndex + 1}
                </span>
           </button>

           <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`p-3 rounded-xl transition-all ${isDarkMode ? 'bg-zinc-800 text-amber-400 hover:bg-zinc-700' : 'bg-slate-100 text-blue-600 hover:bg-slate-200'}`}
              >
                {isDarkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
           </button>
        </div>
      </nav>

      {/* MOBILE BOTTOM NAVIGATION - Changed lg:hidden to md:hidden */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 h-16 border-t z-50 flex items-center justify-around px-2 pb-safe transition-colors duration-300
         ${isDarkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-200'}`}>
         <button 
             onClick={() => { setCurrentView('dashboard'); setIsMobileSignalsOpen(false); setIsMobileMenuOpen(false); }}
             className={`p-2 rounded-xl flex flex-col items-center gap-1
               ${currentView === 'dashboard' ? (isDarkMode ? 'text-amber-500' : 'text-blue-600') : 'text-zinc-500'}`}
           >
             <LayoutGrid className="w-5 h-5" />
             <span className="text-[9px] font-bold uppercase">Chart</span>
         </button>
         <button 
             onClick={() => { setCurrentView('journal'); setIsMobileMenuOpen(false); }}
             className={`p-2 rounded-xl flex flex-col items-center gap-1
               ${currentView === 'journal' ? (isDarkMode ? 'text-amber-500' : 'text-blue-600') : 'text-zinc-500'}`}
           >
             <BookText className="w-5 h-5" />
             <span className="text-[9px] font-bold uppercase">Journal</span>
         </button>
         <button 
             onClick={() => { setCurrentView('planning'); setIsMobileMenuOpen(false); }}
             className={`p-2 rounded-xl flex flex-col items-center gap-1
               ${currentView === 'planning' ? (isDarkMode ? 'text-amber-500' : 'text-blue-600') : 'text-zinc-500'}`}
           >
             <CalendarDays className="w-5 h-5" />
             <span className="text-[9px] font-bold uppercase">Plans</span>
         </button>
         <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 text-zinc-500"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
         </button>
      </nav>

      {/* MAIN CONTENT AREA - Changed lg breakpoints to md */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto md:overflow-hidden p-2 md:p-6 gap-6 relative pb-24 md:pb-6 custom-scrollbar">
          
          <NotificationSettings 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)}
            config={notificationConfig}
            onSave={handleSaveSettings}
            isDarkMode={isDarkMode}
          />

          <PatternGlossary
            isOpen={isGlossaryOpen}
            onClose={() => setIsGlossaryOpen(false)}
            isDarkMode={isDarkMode}
          />
          
          {selectedDetection && (
            <PatternDetail 
              detection={selectedDetection}
              relatedPatterns={detections}
              candles={candles}
              onClose={() => setSelectedDetection(null)}
              isDarkMode={isDarkMode}
            />
          )}

          {currentView === 'planning' ? (
             <div key="planning" className="h-full animate-fade-in flex flex-col">
               <div className="mb-4 md:mb-6 shrink-0">
                 <h1 className={`text-xl md:text-2xl font-bold tracking-tight flex items-center gap-3 ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
                    Weekly Strategy
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-slate-200 text-slate-500'}`}>PIPEYE</span>
                 </h1>
               </div>
               <div className="flex-1 min-h-0">
                 <WeeklyPlanning isDarkMode={isDarkMode} />
               </div>
             </div>
          ) : currentView === 'journal' ? (
             <div key="journal" className="h-full animate-fade-in flex flex-col">
               <div className="mb-4 md:mb-6 shrink-0">
                 <h1 className={`text-xl md:text-2xl font-bold tracking-tight flex items-center gap-3 ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
                    Trading Journal
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-slate-200 text-slate-500'}`}>BETA</span>
                 </h1>
               </div>
               <div className="flex-1 min-h-0">
                 <TradingJournal isDarkMode={isDarkMode} />
               </div>
             </div>
          ) : (
            /* DASHBOARD VIEW - Changed lg breakpoints to md */
            <div key="dashboard" className="flex flex-col md:flex-row gap-4 md:gap-6 h-full min-h-0 animate-fade-in relative">
              
              {/* MOBILE TOP CONTROLS - Changed lg:hidden to md:hidden */}
              <div className="md:hidden flex gap-2 shrink-0">
                 {/* Left: Market Select */}
                 <button 
                   onClick={() => {
                      setIsMobileMenuOpen(!isMobileMenuOpen);
                      setIsMobileSignalsOpen(false);
                   }}
                   className={`flex-1 p-3 rounded-xl flex items-center justify-between border transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'}`}
                 >
                    <span className="font-bold flex items-center gap-2 text-sm truncate">
                       <span className={isDarkMode ? 'text-amber-500' : 'text-blue-600'}>{selectedPair}</span> 
                       <span className="text-xs opacity-50">/ {selectedTimeframe}</span>
                    </span>
                    {isMobileMenuOpen ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                 </button>

                 {/* Right: Signal Toggle */}
                 <button 
                    onClick={() => {
                      setIsMobileSignalsOpen(!isMobileSignalsOpen);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-4 rounded-xl flex items-center justify-center border transition-all ${
                      isMobileSignalsOpen 
                        ? (isDarkMode ? 'bg-zinc-800 text-amber-500 border-amber-500/30' : 'bg-blue-50 text-blue-600 border-blue-200')
                        : (isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-slate-200 text-slate-400')
                    }`}
                 >
                    <Radio className={`w-5 h-5 ${isMobileSignalsOpen ? 'animate-pulse' : ''}`} />
                    {detections.length > 0 && !isMobileSignalsOpen && (
                      <span className="flex h-2 w-2 relative -ml-1.5 -mt-2">
                         <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDarkMode ? 'bg-amber-400' : 'bg-blue-400'}`}></span>
                         <span className={`relative inline-flex rounded-full h-2 w-2 ${isDarkMode ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                      </span>
                    )}
                 </button>
              </div>

              {/* LEFT Sidebar: Controls & Pairs - Changed lg breakpoints to md */}
              <aside className={`
                  flex flex-col gap-4 md:gap-6 shrink-0 transition-all duration-300 z-40
                  md:w-64 md:static md:h-full md:opacity-100 md:bg-transparent md:p-0 md:overflow-visible
                  absolute top-[4.5rem] left-0 right-0 bottom-0 p-4 
                  ${isMobileMenuOpen 
                    ? 'opacity-100 pointer-events-auto bg-zinc-950/95 backdrop-blur-xl' 
                    : 'opacity-0 pointer-events-none'
                  }
              `}>
                
                {/* Header Info */}
                <div className={`backdrop-blur-xl border rounded-2xl p-4 md:p-6 shadow-md transition-colors duration-300 shrink-0
                  ${isDarkMode ? 'bg-zinc-900/60 border-zinc-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm'}`}>
                  
                  <div className="mb-4">
                    <h1 className={`text-lg font-bold tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
                      PIPEYE <span className={isDarkMode ? 'text-amber-400' : 'text-blue-600'}>FX</span>
                    </h1>
                  </div>

                  {/* Background Scan Status */}
                  <div className={`text-[10px] font-mono flex items-center justify-between px-3 py-2 rounded-lg border
                    ${isDarkMode ? 'bg-zinc-950/50 border-zinc-800 text-zinc-500' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    <span className="flex items-center gap-2">
                      <Activity className={`w-3 h-3 ${backgroundScanningPair ? 'animate-pulse text-emerald-500' : ''}`} />
                      Scanner
                    </span>
                    <span className={backgroundScanningPair ? 'text-emerald-500' : ''}>
                      {backgroundScanningPair ? backgroundScanningPair : 'Idle'}
                    </span>
                  </div>
                </div>

                {/* Pairs List */}
                <div className={`flex-1 flex flex-col backdrop-blur-xl border rounded-2xl p-4 shadow-md overflow-hidden transition-colors duration-300
                  ${isDarkMode ? 'bg-zinc-900/60 border-zinc-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm'}`}>
                  
                  <div className="shrink-0 mb-4">
                    <label className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-3 block ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Select Market</label>
                  </div>
                  
                  <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar flex-1 min-h-[150px]">
                      {FOREX_PAIRS.map(pair => (
                        <button
                          key={pair.symbol}
                          onClick={() => {
                            setSelectedPair(pair.symbol);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`
                            w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-300 border relative overflow-hidden
                            ${selectedPair === pair.symbol 
                              ? `${activeBg} ${isDarkMode ? 'border-amber-400/30' : 'border-blue-600/30'} ${isDarkMode ? 'text-amber-400' : 'text-blue-700'} font-semibold shadow-sm` 
                              : `${isDarkMode ? 'bg-zinc-800/40 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800/80' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'}`}
                          `}
                        >
                          <div className="flex justify-between items-center relative z-10">
                            <span>{pair.symbol}</span>
                            <div className="flex items-center gap-2">
                              {selectedPair === pair.symbol && wsStatus === 'connected' && (
                                <span className="flex h-2 w-2 relative">
                                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDarkMode ? 'bg-amber-400' : 'bg-blue-400'}`}></span>
                                  <span className={`relative inline-flex rounded-full h-2 w-2 ${isDarkMode ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
                
                {/* Controls */}
                <div className={`backdrop-blur-xl border rounded-2xl p-4 shadow-md transition-colors duration-300 shrink-0
                  ${isDarkMode ? 'bg-zinc-900/60 border-zinc-800 shadow-xl' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <label className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-3 block ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>Timeframe</label>
                  <div className="flex gap-2 mb-4">
                      {TIMEFRAMES.map(tf => (
                        <button
                          key={tf}
                          onClick={() => setSelectedTimeframe(tf as Timeframe)}
                          className={`
                            flex-1 py-2 rounded-lg text-xs font-bold border transition-all duration-300
                            ${selectedTimeframe === tf 
                              ? `${isDarkMode ? 'bg-zinc-100 border-zinc-100 text-zinc-950' : 'bg-blue-600 border-blue-600 text-white'} shadow-md` 
                              : `${isDarkMode ? 'bg-zinc-800/40 border-zinc-700/30 text-zinc-500 hover:text-zinc-300' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                          `}
                        >
                          {tf}
                        </button>
                      ))}
                  </div>
                  
                  <div className={`pt-4 border-t flex gap-2 ${isDarkMode ? 'border-zinc-800' : 'border-slate-100'}`}>
                    <button 
                      onClick={toggleNotifications}
                      className={`
                        flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all
                        ${notificationConfig.masterEnabled 
                          ? (isDarkMode ? 'bg-amber-500 text-amber-950 shadow-amber-500/20' : 'bg-blue-600 text-white shadow-blue-500/20') + ' hover:opacity-90 shadow-lg'
                          : (isDarkMode ? 'bg-zinc-800 text-zinc-500' : 'bg-slate-100 text-slate-500') + ' hover:opacity-80'}
                      `}
                    >
                      {notificationConfig.masterEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      {notificationConfig.masterEnabled ? 'ON' : 'OFF'}
                    </button>
                    
                    <button 
                      onClick={() => setIsGlossaryOpen(true)}
                      className={`w-12 flex items-center justify-center rounded-xl border transition-colors
                        ${isDarkMode 
                          ? 'bg-zinc-800/60 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200' 
                          : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 hover:border-slate-300'}`}
                      title="Pattern Glossary"
                    >
                      <BookOpen className="w-5 h-5" />
                    </button>

                    <button 
                      onClick={() => setIsSettingsOpen(true)}
                      className={`w-12 flex items-center justify-center rounded-xl border transition-colors
                        ${isDarkMode 
                          ? 'bg-zinc-800/60 border-zinc-700/30 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200' 
                          : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 hover:border-slate-300'}`}
                      title="Configure Alerts"
                    >
                      <SettingsIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </aside>

              {/* CENTER: Chart - Changed lg breakpoints to md */}
              <main className={`flex-1 flex flex-col gap-4 md:gap-6 min-w-0 h-full min-h-0 ${isMobileSignalsOpen ? 'hidden md:flex' : 'flex'}`}>
                <div className="flex-1 h-full min-h-[300px] relative">
                  <Chart pair={selectedPair} timeframe={selectedTimeframe} data={candles} detections={detections} isDarkMode={isDarkMode} />
                  
                  {/* Demo Mode Overlay Badge for Desktop/All views if in demo mode */}
                  {error && error.includes('Demo Mode') && (
                     <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-lg bg-amber-500/90 text-amber-950 text-xs font-bold shadow-lg backdrop-blur-md border border-amber-400/50 flex items-center gap-2 animate-pulse pointer-events-none">
                        <Activity className="w-3.5 h-3.5" />
                        DEMO MODE
                     </div>
                  )}
                </div>
                
                {/* Mobile view alert below chart (hidden on md) - Keep this for generic errors, hide for demo mode if overlay is sufficient or redundant */}
                {error && !error.includes('Demo Mode') && (
                    <div className="md:hidden flex items-center gap-2 text-[10px] text-amber-600 font-bold bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-200">
                      <AlertCircle className="w-3 h-3" />
                      {error}
                    </div>
                )}
              </main>

              {/* RIGHT Sidebar: Global Notifications - Changed lg breakpoints to md */}
              <aside className={`
                w-full md:w-80 flex-col shrink-0 h-full min-h-0 backdrop-blur-xl border rounded-2xl overflow-hidden transition-all duration-300
                ${isDarkMode ? 'bg-zinc-900/60 border-zinc-800 shadow-2xl' : 'bg-white border-slate-200 shadow-md'}
                ${isMobileSignalsOpen ? 'flex' : 'hidden md:flex'}
              `}>
                
                <div className={`px-5 py-4 border-b flex flex-col gap-3 shrink-0 ${isDarkMode ? 'border-zinc-800 bg-zinc-900/30' : 'border-slate-100 bg-slate-50/50'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className={`w-4 h-4 ${isDarkMode ? 'text-amber-500' : 'text-blue-600'}`} />
                      <h2 className={`text-xs font-bold uppercase tracking-[0.2em] ${isDarkMode ? 'text-zinc-300' : 'text-slate-600'}`}>Signal Feed</h2>
                    </div>
                    <button
                        onClick={handleManualRefresh}
                        disabled={isLoading}
                        className={`p-2 rounded-lg border transition-all ${
                          isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
                        } ${
                          isDarkMode 
                            ? 'bg-zinc-950/50 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200' 
                            : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 shadow-sm'
                        }`}
                        title="Force Refresh"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className={`h-3.5 w-3.5 transition-colors ${isDarkMode ? 'text-zinc-500 group-focus-within:text-amber-500' : 'text-slate-400 group-focus-within:text-blue-500'}`} />
                    </div>
                    <input
                      type="text"
                      placeholder="Filter feed..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`block w-full pl-9 pr-3 py-2 border rounded-lg leading-5 placeholder-opacity-75 focus:outline-none focus:ring-1 sm:text-xs transition-all
                        ${isDarkMode 
                          ? 'bg-zinc-950/50 border-zinc-800 text-zinc-300 placeholder-zinc-600 focus:bg-zinc-950 focus:border-amber-500/50 focus:ring-amber-500/20' 
                          : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500/50 focus:ring-blue-500/20 shadow-sm'}
                      `}
                    />
                  </div>

                  {/* Connection Status Indicator for Right Bar */}
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${wsStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className={`text-[10px] uppercase font-bold ${isDarkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                      {wsStatus === 'connected' ? 'Live Stream' : 'Offline'}
                    </span>
                  </div>
                </div>

                <div className={`flex-1 overflow-y-auto p-4 custom-scrollbar ${isDarkMode ? 'bg-zinc-950/20' : 'bg-slate-50/50'}`}>
                  {filteredDetections.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                      <Filter className="w-8 h-8 mb-2" />
                      <span className="text-xs">No signals found</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {filteredDetections.map((detection, index) => (
                        <PatternCard 
                          key={detection.id} 
                          detection={detection} 
                          isLatest={!searchQuery && index === 0} 
                          onClick={() => {
                              setSelectedDetection(detection);
                              // If user clicks a notification for a different pair, switch the main view
                              if (detection.pair !== selectedPair) {
                                setSelectedPair(detection.pair);
                                setSelectedTimeframe(detection.timeframe as Timeframe);
                              }
                              // Auto-close signal feed on mobile
                              setIsMobileSignalsOpen(false);
                          }}
                          isDarkMode={isDarkMode}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </aside>
            </div>
          )}
      </div>
    </div>
  );
};

export default App;
