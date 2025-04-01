import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';

// Types
declare global {
  interface Window {
    TradingView: any;
  }
}

// Reference interface
export interface TradingViewRef {
  refreshChart: () => void;
  changeSymbol: (symbol: string) => void;
  changeInterval: (interval: string) => void;
  captureChart: () => Promise<string | null>;
  getCurrentPrice: () => number | null;
}

// Props interface
export interface ProfessionalTradingViewProps {
  symbol?: string;
  interval?: string;
  theme?: 'light' | 'dark';
  width?: string | number;
  height?: string | number;
  containerId?: string;
  backgroundColor?: string;
  showVolume?: boolean;
  showGrid?: boolean;
  showDateRanges?: boolean;
  includeTradingViewBranding?: boolean;
  timezone?: string;
  locale?: string;
  studies?: string[];
  onReady?: () => void;
  onSymbolChange?: (symbol: string) => void;
  onIntervalChange?: (interval: string) => void;
  onPriceUpdate?: (price: number) => void;
}

const ProfessionalTradingView = forwardRef<TradingViewRef, ProfessionalTradingViewProps>((props, ref) => {
  const {
    symbol = 'BINANCE:BTCUSDT',
    interval = '1D',
    theme = 'dark',
    width = '100%',
    height = '600px',
    containerId = '',
    backgroundColor = '#131722',
    showVolume = true,
    showGrid = true,
    showDateRanges = true,
    includeTradingViewBranding = false,
    timezone = 'Etc/UTC',
    locale = 'en',
    studies = [],
    onReady,
    onSymbolChange,
    onIntervalChange,
    onPriceUpdate
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const tvWidgetRef = useRef<any>(null);
  const uniqueId = useRef<string>(`tv_widget_${Math.floor(Math.random() * 100000)}`);
  const priceUpdateInterval = useRef<number | null>(null);
  const currentPriceRef = useRef<number | null>(null);

  // Clean up resources
  const cleanup = () => {
    if (priceUpdateInterval.current) {
      window.clearInterval(priceUpdateInterval.current);
      priceUpdateInterval.current = null;
    }
    
    if (scriptRef.current && document.body.contains(scriptRef.current)) {
      document.body.removeChild(scriptRef.current);
    }
    
    if (containerRef.current) {
      containerRef.current.innerHTML = '';
    }
    
    tvWidgetRef.current = null;
  };

  // Initialize the TradingView widget
  const initWidget = () => {
    if (!containerRef.current || !window.TradingView) return;
    
    // Clean up any previous widget
    if (tvWidgetRef.current) {
      cleanup();
    }
    
    // Clear container
    containerRef.current.innerHTML = '';
    
    // Create unique container for the widget
    const widgetContainer = document.createElement('div');
    widgetContainer.id = containerId || uniqueId.current;
    containerRef.current.appendChild(widgetContainer);
    
    // Disable features that cause issues with duplicate UI elements
    const disabledFeatures = [
      'header_symbol_search',
      'header_saveload',
      'header_screenshot',
      'header_chart_type',
      'header_compare',
      'header_undo_redo',
      'timeframes_toolbar',
      'volume_force_overlay',
      'header_indicators',
      'left_toolbar',
      'control_bar',
      'edit_buttons_in_legend',
    ];
    
    if (!includeTradingViewBranding) {
      disabledFeatures.push('header_widget');
      disabledFeatures.push('header_widget_dom_node');
    }
    
    // Enable essential features
    const enabledFeatures = [
      'side_toolbar_in_fullscreen_mode',
      'same_data_requery',
      'show_dialog_on_snapshot_ready',
      'save_chart_properties_to_local_storage',
      'study_templates',
      'property_pages',
    ];
    
    if (showGrid) {
      enabledFeatures.push('grid');
    }
    
    if (showVolume) {
      enabledFeatures.push('create_volume_indicator_by_default');
    }
    
    // Default chart styling
    const chartStyle = 1; // Candles
    
    // Create widget
    const widgetOptions = {
      symbol,
      interval,
      container_id: widgetContainer.id,
      datafeed: {
        onReady: (callback: any) => {
          setTimeout(() => callback({
            supported_resolutions: ['1', '5', '15', '30', '60', '1D', '1W', '1M'],
            supports_marks: false,
            supports_timescale_marks: false,
            supports_time: true,
          }), 0);
        },
        resolveSymbol: (symbolName: string, onSymbolResolvedCallback: any) => {
          const symbolInfo = {
            name: symbolName,
            full_name: symbolName,
            ticker: symbolName,
            description: symbolName,
            type: 'crypto',
            session: '24x7',
            exchange: 'Binance',
            listed_exchange: 'Binance',
            timezone,
            format: 'price',
            minmov: 1,
            pricescale: 100,
            has_intraday: true,
            has_daily: true,
            has_weekly_and_monthly: true,
            currency_code: 'USD',
          };
          
          setTimeout(() => onSymbolResolvedCallback(symbolInfo), 0);
        },
        getBars: () => {
          // Using direct feed through loadChartData method
          return [];
        },
        subscribeBars: () => {
          // Will be handled automatically by TradingView
        },
        unsubscribeBars: () => {
          // Will be handled automatically by TradingView
        },
      },
      library_path: 'https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js',
      locale,
      fullscreen: false,
      autosize: true,
      theme,
      timezone,
      toolbar_bg: backgroundColor,
      loading_screen: { backgroundColor },
      studies_overrides: {},
      overrides: {
        'mainSeriesProperties.style': chartStyle,
        'mainSeriesProperties.showCountdown': false,
        'scalesProperties.showSymbolLabels': true,
        'paneProperties.backgroundType': 'solid',
        'paneProperties.background': backgroundColor,
        'paneProperties.gridProperties.color': theme === 'dark' ? '#363c4e' : '#d6d6d6',
        'paneProperties.gridProperties.style': 0,
        'paneProperties.vertGridProperties.color': theme === 'dark' ? '#363c4e' : '#d6d6d6',
        'paneProperties.vertGridProperties.style': 0,
        'paneProperties.horzGridProperties.color': theme === 'dark' ? '#363c4e' : '#d6d6d6',
        'paneProperties.horzGridProperties.style': 0,
      },
      disabled_features: disabledFeatures,
      enabled_features: enabledFeatures,
      allow_symbol_change: true,
      withdateranges: showDateRanges,
      hide_side_toolbar: false,
      details: false,
      hotlist: false,
      calendar: false,
      custom_css_url: null,
      auto_save_delay: 5,
      study_count_limit: 50,
      debug: false,
    };
    
    // Create widget instance
    try {
      // @ts-ignore - TradingView is from global scope
      const tvWidget = new window.TradingView.widget(widgetOptions);
      tvWidgetRef.current = tvWidget;
      
      // Handle widget ready event
      tvWidget.onChartReady(() => {
        console.log('TradingView chart ready');
        const chart = tvWidget.chart();
        
        // Apply default studies
        if (studies && studies.length > 0) {
          studies.forEach(study => {
            try {
              chart.createStudy(study);
            } catch (err) {
              console.error(`Error adding study ${study}:`, err);
            }
          });
        }
        
        // Set up price update interval
        if (onPriceUpdate) {
          if (priceUpdateInterval.current) {
            window.clearInterval(priceUpdateInterval.current);
          }
          
          priceUpdateInterval.current = window.setInterval(() => {
            try {
              const price = chart.lastPrice();
              if (price && price !== currentPriceRef.current) {
                currentPriceRef.current = price;
                onPriceUpdate(price);
              }
            } catch (err) {
              console.warn('Error getting price update:', err);
            }
          }, 1000);
        }
        
        // Handle symbol change
        if (onSymbolChange) {
          chart.onSymbolChange().subscribe(null, (symbolData: any) => {
            onSymbolChange(symbolData);
          });
        }
        
        // Handle interval change
        if (onIntervalChange) {
          chart.onIntervalChange().subscribe(null, (interval: string) => {
            onIntervalChange(interval);
          });
        }
        
        // Call ready callback
        if (onReady) {
          onReady();
        }
      });
    } catch (err) {
      console.error('Failed to initialize TradingView widget:', err);
    }
  };

  // Load TradingView library
  useEffect(() => {
    if (!window.TradingView) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = initWidget;
      
      document.body.appendChild(script);
      scriptRef.current = script;
    } else {
      initWidget();
    }
    
    return cleanup;
  }, []);

  // Handle props changes
  useEffect(() => {
    if (tvWidgetRef.current && tvWidgetRef.current.chart) {
      try {
        const chart = tvWidgetRef.current.chart();
        chart.setSymbol(symbol);
      } catch (err) {
        console.warn('Error updating symbol:', err);
      }
    }
  }, [symbol]);

  useEffect(() => {
    if (tvWidgetRef.current && tvWidgetRef.current.chart) {
      try {
        const chart = tvWidgetRef.current.chart();
        chart.setResolution(interval);
      } catch (err) {
        console.warn('Error updating interval:', err);
      }
    }
  }, [interval]);

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    // Refresh the chart
    refreshChart: () => {
      if (tvWidgetRef.current && tvWidgetRef.current.chart) {
        try {
          const chart = tvWidgetRef.current.chart();
          chart.refreshData();
        } catch (err) {
          console.warn('Error refreshing chart:', err);
        }
      }
    },
    
    // Change the symbol
    changeSymbol: (newSymbol: string) => {
      if (tvWidgetRef.current && tvWidgetRef.current.chart) {
        try {
          const chart = tvWidgetRef.current.chart();
          chart.setSymbol(newSymbol);
        } catch (err) {
          console.warn('Error changing symbol:', err);
        }
      }
    },
    
    // Change the interval
    changeInterval: (newInterval: string) => {
      if (tvWidgetRef.current && tvWidgetRef.current.chart) {
        try {
          const chart = tvWidgetRef.current.chart();
          chart.setResolution(newInterval);
        } catch (err) {
          console.warn('Error changing interval:', err);
        }
      }
    },
    
    // Capture chart screenshot
    captureChart: async (): Promise<string | null> => {
      if (!containerRef.current) return null;
      
      try {
        // Try TradingView native screenshot
        if (tvWidgetRef.current && tvWidgetRef.current.chart) {
          const chart = tvWidgetRef.current.chart();
          if (typeof chart.takeScreenshot === 'function') {
            return await new Promise(resolve => {
              chart.takeScreenshot((base64Data: string) => {
                resolve(base64Data);
              });
            });
          }
        }
        
        // Fallback to html2canvas
        const canvas = await html2canvas(containerRef.current, {
          backgroundColor: theme === 'dark' ? '#131722' : '#ffffff',
          scale: 2,
          allowTaint: true,
          useCORS: true,
        });
        
        return canvas.toDataURL('image/png');
      } catch (err) {
        console.error('Error capturing chart:', err);
        return null;
      }
    },
    
    // Get current price
    getCurrentPrice: () => {
      return currentPriceRef.current;
    }
  }), [theme]);

  // Render container
  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width, 
        height: typeof height === 'number' ? `${height}px` : height,
        position: 'relative' 
      }}
    />
  );
});

export default ProfessionalTradingView;