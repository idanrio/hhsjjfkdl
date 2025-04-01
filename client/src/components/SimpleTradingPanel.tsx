import React, { useState } from 'react';
import FixedTradingView from './FixedTradingView';

interface SimpleTradingPanelProps {
  defaultSymbol?: string;
  defaultInterval?: string;
  height?: string | number;
  width?: string | number;
  theme?: 'light' | 'dark';
  showControls?: boolean;
}

const SimpleTradingPanel: React.FC<SimpleTradingPanelProps> = ({
  defaultSymbol = 'BINANCE:BTCUSDT',
  defaultInterval = '1D',
  height = '600px',
  width = '100%',
  theme = 'dark',
  showControls = true
}) => {
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [interval, setInterval] = useState(defaultInterval);
  
  // Common symbols
  const symbols = [
    { value: 'BINANCE:BTCUSDT', label: 'Bitcoin' },
    { value: 'BINANCE:ETHUSDT', label: 'Ethereum' },
    { value: 'BINANCE:SOLUSDT', label: 'Solana' },
    { value: 'BINANCE:BNBUSDT', label: 'Binance Coin' },
    { value: 'BINANCE:XRPUSDT', label: 'XRP' }
  ];
  
  // Time intervals
  const intervals = [
    { value: '1', label: '1m' },
    { value: '5', label: '5m' },
    { value: '15', label: '15m' },
    { value: '30', label: '30m' },
    { value: '60', label: '1h' },
    { value: '240', label: '4h' },
    { value: '1D', label: '1D' },
    { value: '1W', label: '1W' },
    { value: '1M', label: '1M' }
  ];
  
  return (
    <div className="simple-trading-panel" style={{ width }}>
      {showControls && (
        <div className="chart-controls p-2 flex gap-2 border-b bg-background">
          {/* Symbol selector */}
          <select
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="p-1 text-sm bg-background border rounded"
          >
            {symbols.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          
          {/* Interval selector */}
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="p-1 text-sm bg-background border rounded"
          >
            {intervals.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* TradingView Chart */}
      <div style={{ height }}>
        <FixedTradingView
          symbol={symbol}
          interval={interval}
          theme={theme}
          containerId={`tv_${symbol.replace(':', '_')}`}
          autosize={true}
        />
      </div>
    </div>
  );
};

export default SimpleTradingPanel;