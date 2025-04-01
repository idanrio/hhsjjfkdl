import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, Ref, ForwardRefRenderFunction } from 'react';
import { useTranslation } from 'react-i18next';

// Define the type for the ref
export interface TradingViewRef {
  refreshWidget: () => void;
  widget: any;
  getCurrentPrice: () => number;
}

// Advanced TradingView Widget options interface
export interface AdvancedTradingViewWidgetProps {
  symbol?: string;
  interval?: string;
  timezone?: string;
  theme?: 'light' | 'dark';
  width?: string | number;
  height?: string | number;
  locale?: string;
  toolbar_bg?: string;
  enable_publishing?: boolean;
  withdateranges?: boolean;
  hide_side_toolbar?: boolean;
  allow_symbol_change?: boolean;
  save_image?: boolean;
  show_popup_button?: boolean;
  popup_width?: string | number;
  popup_height?: string | number;
  container_id?: string;
  studies?: string[];
  autosize?: boolean;
  hide_top_toolbar?: boolean;
  details?: boolean;
  hotlist?: boolean;
  calendar?: boolean;
  news?: string[];
  alerts?: boolean;
  hide_legend?: boolean;
  drawing_access?: {
    access?: 'all' | 'group',
    tools?: {
      items?: string[]
    }
  };
  studies_access?: {
    type?: 'all' | 'default',
    tools?: {
      items?: string[]
    }
  };
  disabled_features?: string[];
  enabled_features?: string[];
  savedDrawings?: boolean;
  savedCharts?: boolean;
  fullscreen?: boolean;
  charts_storage_url?: string;
  charts_storage_api_version?: string;
  client_id?: string;
  user_id?: string;
  indicators_file_name?: string;
  loading_screen?: { backgroundColor?: string, foregroundColor?: string };
  custom_css_url?: string;
  favorites?: { intervals?: string[], chartTypes?: string[], studies?: string[] };
  study_count_limit?: number;
  symbol_search_request_delay?: number;
  compare_symbols?: { symbol: string, title: string }[];
  show_interval_dialog_on_key_press?: boolean;
  supported_resolutions?: string[];
  preset?: string;
  session?: string;
  style?: string;
  debug?: boolean;
  chartType?: string;
  onPriceUpdate?: (price: number) => void;
  customIndicators?: {
    id: string,
    src: string,
    description: string,
    metainfo: {
      _metainfoVersion: number,
      id: string,
      description: string,
      shortDescription: string,
      format: {
        type: string,
        precision: number,
      },
      defaults: any,
      inputs: any[],
    }
  }[];
}

const EnhancedTradingViewWidgetComponent: ForwardRefRenderFunction<
  TradingViewRef,
  AdvancedTradingViewWidgetProps
> = (
  {
    symbol = 'BINANCE:BTCUSDT',
    interval = '1D',
    timezone = 'Etc/UTC',
    theme = 'dark',
    width = '100%',
    height = '500',
    locale = 'en',
    toolbar_bg = '#f1f3f6',
    enable_publishing = false,
    withdateranges = true, 
    hide_side_toolbar = true,
    allow_symbol_change = true,
    save_image = true,
    show_popup_button = false,
    popup_width = '1000',
    popup_height = '650',
    container_id = 'tradingview_widget',
    studies = [],
    autosize = false,
    hide_top_toolbar = false,
    details = false,
    hotlist = false,
    calendar = false,
    news = [],
    alerts = true,
    hide_legend = false,
    drawing_access,
    studies_access,
    disabled_features = [],
    enabled_features = [],
    savedDrawings = true,
    savedCharts = true,
    fullscreen = false,
    charts_storage_url,
    charts_storage_api_version = '1.1',
    client_id,
    user_id,
    indicators_file_name,
    loading_screen,
    custom_css_url,
    favorites,
    study_count_limit = 30,
    symbol_search_request_delay = 500,
    compare_symbols = [],
    show_interval_dialog_on_key_press = true,
    supported_resolutions = ['1', '5', '15', '30', '60', '240', 'D', 'W', 'M'],
    preset,
    session,
    style,
    debug = false,
    chartType,
    onPriceUpdate,
    customIndicators = [],
  },
  ref
) => {
  const { i18n } = useTranslation();
  const container = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const widgetRef = useRef<any>(null);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  
  // Reference for the price update interval
  const priceUpdateIntervalRef = useRef<number | null>(null);
  
  // Create unique container ID for each instance
  const uniqueId = useRef(`tradingview_widget_${Math.random().toString(36).substring(2, 9)}`);
  
  // Helper function to clean up intervals
  const cleanupIntervals = () => {
    if (priceUpdateIntervalRef.current !== null) {
      clearInterval(priceUpdateIntervalRef.current);
      priceUpdateIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (container.current) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => initWidget();
      
      document.body.appendChild(script);
      scriptRef.current = script;

      return () => {
        // Clean up intervals when component unmounts
        cleanupIntervals();
        
        if (scriptRef.current) {
          document.body.removeChild(scriptRef.current);
        }
      };
    }
  }, []);
  
  useEffect(() => {
    // Update the widget if key properties change
    if (widgetRef.current) {
      try {
        // Clean up existing intervals before changing symbol
        cleanupIntervals();
        
        // Update the symbol
        widgetRef.current.setSymbol(symbol, interval);
      } catch (error) {
        console.error("Error updating symbol:", error);
      }
    }
  }, [symbol, interval]);
  
  useEffect(() => {
    // Sync locale with i18n
    if (widgetRef.current && i18n.language) {
      const tvLocale = i18n.language === 'he' ? 'he_IL' : 'en';
      if (tvLocale !== locale) {
        // Clean up before reinitializing
        cleanupIntervals();
        
        // Reinitialize widget with new locale
        if (container.current) {
          container.current.innerHTML = '';
          initWidget(tvLocale);
        }
      }
    }
  }, [i18n.language]);
  
  // Initialize the TradingView widget
  const initWidget = (localeOverride?: string) => {
    if (typeof window === 'undefined' || !window.TradingView) return;
    
    if (container.current) {
      container.current.innerHTML = '';
      
      // Set up widget configuration
      const widgetOptions: any = {
        symbol,
        interval,
        timezone,
        theme,
        style: style || chartType || 1, // Default to candles (1)
        locale: localeOverride || locale,
        toolbar_bg,
        enable_publishing,
        withdateranges,
        hide_side_toolbar,
        allow_symbol_change,
        save_image,
        show_popup_button,
        popup_width,
        popup_height,
        container_id: uniqueId.current,
        autosize,
        studies_overrides: {},
        hide_top_toolbar,
        details,
        hotlist,
        calendar,
        news,
        alerts,
        hide_legend,
        fullscreen,
        debug,
        
        // Advanced options
        disabled_features: [
          'header_widget_dom_node', // Removes the TradingView logo
          'use_localstorage_for_settings',
          'timeframes_toolbar',
          ...disabled_features
        ],
        enabled_features: [
          'side_toolbar_in_fullscreen_mode',
          'header_indicators', // Add indicators like TradingView
          'header_chart_type',
          'show_interval_dialog_on_key_press',
          'header_settings',
          'header_screenshot',
          'header_symbol_search',
          'header_compare',
          'header_undo_redo',
          'header_saveload',
          'study_templates',
          'display_market_status',
          'use_localstorage_for_settings',
          'border_around_the_chart',
          'replay_mode', // Add replay button
          ...enabled_features
        ],
        saved_data_meta_info: {
          uid: user_id || 'default_user',
          userName: user_id || 'Default User',
          metaData: {
            userName: user_id || 'Default User',
            metaInfo: {
              configFlags: {
                showLastPrice: true,
                showBidAsk: true,
                showWeekendData: true,
                showVolume: true,
                showStudyArguments: true,
                showStudyTitles: true,
                showStudyValues: true,
                showStudyPlotLabels: true,
                showLegend: !hide_legend,
              }
            }
          }
        },
      };
      
      // Add conditional properties
      if (drawing_access) widgetOptions.drawings_access = drawing_access;
      if (studies_access) widgetOptions.studies_access = studies_access;
      if (charts_storage_url) {
        widgetOptions.charts_storage_url = charts_storage_url;
        widgetOptions.charts_storage_api_version = charts_storage_api_version;
        widgetOptions.client_id = client_id;
        widgetOptions.user_id = user_id;
      }
      if (loading_screen) widgetOptions.loading_screen = loading_screen;
      if (custom_css_url) widgetOptions.custom_css_url = custom_css_url;
      if (favorites) widgetOptions.favorites = favorites;
      if (study_count_limit) widgetOptions.study_count_limit = study_count_limit;
      if (symbol_search_request_delay) widgetOptions.symbol_search_request_delay = symbol_search_request_delay;
      if (compare_symbols.length > 0) widgetOptions.compare_symbols = compare_symbols;
      if (show_interval_dialog_on_key_press) widgetOptions.show_interval_dialog_on_key_press = show_interval_dialog_on_key_press;
      if (supported_resolutions.length > 0) widgetOptions.supported_resolutions = supported_resolutions;
      if (preset) widgetOptions.preset = preset;
      if (session) widgetOptions.session = session;
      
      // Add onChartReady callback to the widget options
      widgetOptions.onChartReady = function() {
        // Add the studies
        if (studies && studies.length > 0) {
          studies.forEach(study => {
            widget.chart().createStudy(study);
          });
        }
        
        // Set up price updates if callback is provided
        if (onPriceUpdate) {
          const updatePrice = () => {
            try {
              const chart = widget.chart();
              const symbolInfo = chart.symbol();
              const lastPrice = chart.lastBar().close || chart.getLastPrice(symbolInfo);
              
              if (lastPrice && lastPrice !== currentPrice) {
                setCurrentPrice(lastPrice);
                onPriceUpdate(lastPrice);
              }
            } catch (error) {
              console.error("Error getting price update:", error);
            }
          };
          
          // Clean up any existing interval before creating a new one
          cleanupIntervals();
          
          // Update price every second
          priceUpdateIntervalRef.current = window.setInterval(updatePrice, 1000);
        }
        
        // Load custom indicators if provided
        if (customIndicators && customIndicators.length > 0) {
          customIndicators.forEach(indicator => {
            try {
              widget.chart().createStudy(
                indicator.id,
                false,
                false,
                indicator.metainfo.defaults
              );
            } catch (error) {
              console.error(`Error loading custom indicator ${indicator.id}:`, error);
            }
          });
        }
      };
      
      // Initialize widget
      const widget = new window.TradingView.widget(widgetOptions);
      widgetRef.current = widget;
    }
  };
  
  // This function can be called from parent to manually refresh the widget
  const refreshWidget = () => {
    if (widgetRef.current) {
      widgetRef.current.chart().refreshData();
    }
  };

  // Expose the refresh function and widget reference to parent
  useImperativeHandle(
    ref,
    () => ({
      refreshWidget,
      widget: widgetRef.current,
      getCurrentPrice: () => currentPrice
    }),
    [widgetRef.current, currentPrice]
  );
  
  // Define available indicators grouped by categories
  const availableIndicators = {
    favorites: [
      'Moving Average',
      'RSI',
      'MACD',
      'Bollinger Bands',
      'Volume',
      'Average True Range'
    ],
    technicals: [
      'Accumulation/Distribution',
      'Average Directional Index',
      'Commodity Channel Index',
      'Chaikin Money Flow',
      'On Balance Volume',
      'Stochastic'
    ],
    financials: [
      'Current Price',
      'Previous Close',
      'Performance',
      'Volatility',
      'Relative Volume',
      'Earnings'
    ],
    community: [
      'The Ultimate Indicator by ATK',
      'Volume Profile',
      'Wyckoff Waves',
      'Support/Resistance',
      'Supply Demand Zones',
      'Market Cycle'
    ]
  };
  
  // Dynamic indicator management
  const [showIndicatorsMenu, setShowIndicatorsMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState('favorites');
  const indicatorsMenuRef = useRef<HTMLDivElement>(null);
  
  // Handle outside click for indicators menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (indicatorsMenuRef.current && !indicatorsMenuRef.current.contains(event.target as Node)) {
        setShowIndicatorsMenu(false);
      }
    };

    if (showIndicatorsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showIndicatorsMenu]);
  
  // Handle indicator selection
  const handleIndicatorSelect = (indicator: string) => {
    if (widgetRef.current) {
      try {
        widgetRef.current.chart().createStudy(indicator);
        setShowIndicatorsMenu(false);
      } catch (error) {
        console.error(`Error adding indicator ${indicator}:`, error);
      }
    }
  };
  
  // Create indicators menu overlay
  const renderIndicatorsMenu = () => {
    if (!showIndicatorsMenu) return null;
    
    return (
      <div 
        ref={indicatorsMenuRef}
        className="absolute top-[40px] left-[180px] w-[450px] max-h-[500px] bg-[#1e1e1e] border border-gray-700 rounded-md shadow-lg z-50 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
          <div className="p-3 border-b border-gray-700">
            <div className="relative flex items-center">
              <input 
                type="text"
                placeholder="Search"
                className="w-full bg-[#2a2a2a] border border-gray-700 rounded-md py-2 px-3 pr-8 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="absolute right-3 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
            </div>
          </div>
          
          <div className="flex h-full">
            <div className="w-1/3 border-r border-gray-700 p-1">
              <button 
                className={`w-full text-left p-2 my-1 rounded text-sm flex items-center hover:bg-gray-700 ${activeCategory === 'favorites' ? 'bg-gray-700' : ''}`}
                onClick={() => setActiveCategory('favorites')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                Favorites
              </button>
              <button 
                className={`w-full text-left p-2 my-1 rounded text-sm flex items-center hover:bg-gray-700 ${activeCategory === 'technicals' ? 'bg-gray-700' : ''}`}
                onClick={() => setActiveCategory('technicals')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                Technicals
              </button>
              <button 
                className={`w-full text-left p-2 my-1 rounded text-sm flex items-center hover:bg-gray-700 ${activeCategory === 'financials' ? 'bg-gray-700' : ''}`}
                onClick={() => setActiveCategory('financials')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                Financials
              </button>
              <button 
                className={`w-full text-left p-2 my-1 rounded text-sm flex items-center hover:bg-gray-700 ${activeCategory === 'community' ? 'bg-gray-700' : ''}`}
                onClick={() => setActiveCategory('community')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                Community
              </button>
            </div>
            
            <div className="w-2/3 overflow-y-auto p-2">
              <div className="flex justify-between items-center mb-2 text-sm text-gray-400 px-2">
                <span>SCRIPT NAME</span>
                <span>AUTHOR</span>
              </div>
              {availableIndicators[activeCategory as keyof typeof availableIndicators].map((indicator, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center p-2 rounded hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleIndicatorSelect(indicator)}
                >
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#f7cb45" stroke="#f7cb45" strokeWidth="0" className="mr-2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    {indicator}
                  </div>
                  <div className="text-sm text-blue-400">
                    {activeCategory === 'community' ? 'tradingview' : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Create custom toolbar buttons
  const renderCustomToolbar = () => {
    return (
      <div className="absolute top-0 left-0 w-full flex items-center h-[38px] z-10 bg-[#1e1e1e] border-b border-gray-700">
        <div className="flex items-center ml-2">
          <button 
            className="px-3 py-1 text-white text-sm rounded hover:bg-gray-700 mr-1"
            onClick={() => {
              if (widgetRef.current) {
                const currentInterval = interval;
                const timeframes = ['1', '5', '15', '30', '60', '240', 'D', 'W', 'M'];
                const currentIndex = timeframes.indexOf(currentInterval);
                const nextIndex = (currentIndex + 1) % timeframes.length;
                const nextInterval = timeframes[nextIndex];
                
                widgetRef.current.setInterval(nextInterval);
              }
            }}
          >
            {interval}
          </button>
          
          <button 
            className="px-3 py-1 text-white text-sm rounded hover:bg-gray-700 mr-1"
            onClick={() => {
              if (widgetRef.current) {
                const chartTypes = ['1', '2', '3', '4']; // Candles, Bars, Line, Area
                const currentStyle = widgetRef.current.chart().chartType() || '1';
                const currentIndex = chartTypes.indexOf(currentStyle);
                const nextIndex = (currentIndex + 1) % chartTypes.length;
                const nextStyle = chartTypes[nextIndex];
                
                widgetRef.current.chart().setChartType(parseInt(nextStyle));
              }
            }}
          >
            Candles
          </button>
          
          <button 
            className="px-3 py-1 text-white text-sm rounded hover:bg-gray-700 flex items-center"
            onClick={() => setShowIndicatorsMenu(!showIndicatorsMenu)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            Indicators
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><polyline points="6 9 12 15 18 9"></polyline></svg>
          </button>
        </div>
        
        {renderIndicatorsMenu()}
      </div>
    );
  };
  
  return (
    <div className="relative">
      {renderCustomToolbar()}
      <div 
        ref={container} 
        style={{ width, height }}
        id={uniqueId.current}
        className="trading-view-container"
      />
    </div>
  );
};

export const EnhancedTradingViewWidget = forwardRef(EnhancedTradingViewWidgetComponent);

export default EnhancedTradingViewWidget;