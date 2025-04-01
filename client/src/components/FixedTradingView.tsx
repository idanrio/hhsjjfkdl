import React, { useEffect, useRef } from 'react';

interface TradingViewProps {
  symbol?: string;
  interval?: string;
  theme?: 'light' | 'dark';
  containerId?: string;
  autosize?: boolean;
  height?: string | number;
  width?: string | number;
}

/**
 * A simplified TradingView widget that uses the free TradingView widget
 * This component removes all extra indicators and controls to prevent duplication
 */
const FixedTradingView: React.FC<TradingViewProps> = ({
  symbol = 'BINANCE:BTCUSDT',
  interval = '1D',
  theme = 'dark',
  containerId = 'tradingview_widget',
  autosize = true,
  height = '500px',
  width = '100%',
}) => {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip server-side rendering
    if (typeof window === 'undefined') return;

    // Define TradingView widget options
    const widgetOptions = {
      symbol,
      interval,
      width: autosize ? '100%' : width,
      height: autosize ? '100%' : height,
      theme: theme === 'light' ? 'light' : 'dark',
      style: '1', // Candles
      allow_symbol_change: true,
      locale: 'en',
      timezone: 'exchange',
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_side_toolbar: false,
      withdateranges: true,
      save_image: true,
      container_id: containerId,
      disabled_features: [
        'header_widget_dom_node',
        'timeframes_toolbar',
        'use_localstorage_for_settings',
        'header_symbol_search',
        'header_compare',
        'header_undo_redo',
        'border_around_the_chart',
        'main_series_scale_menu',
        'adaptive_logo',
        'volume_force_overlay',
        'go_to_date',
      ],
      enabled_features: [
        'side_toolbar_in_fullscreen_mode',
        'same_data_requery',
        'show_dialog_on_snapshot_ready',
        'study_templates',
        'display_market_status',
        'border_around_the_chart',
      ],
    };

    // Load TradingView script dynamically
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      // Initialize widget after script loads
      if (window.TradingView && container.current) {
        try {
          // Clear container first
          container.current.innerHTML = '';
          
          // Create unique div for widget
          const widgetContainer = document.createElement('div');
          widgetContainer.id = containerId;
          container.current.appendChild(widgetContainer);
          
          // Create new widget instance
          // @ts-ignore - TradingView is loaded dynamically
          new window.TradingView.widget(widgetOptions);
        } catch (error) {
          console.error('TradingView widget initialization error:', error);
        }
      }
    };

    // Add script to document
    document.head.appendChild(script);

    // Clean up
    return () => {
      if (script && document.head.contains(script)) {
        document.head.removeChild(script);
      }
      
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol, interval, theme, containerId, autosize, height, width]);

  return (
    <div
      ref={container}
      className="tradingview-widget-container"
      style={{
        height: autosize ? '100%' : height,
        width: autosize ? '100%' : width,
      }}
    />
  );
};

export default FixedTradingView;