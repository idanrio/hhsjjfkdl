import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, Ref, ForwardRefRenderFunction } from 'react';
import { useTranslation } from 'react-i18next';

// Define TradingView study typings
interface TradingViewStudy {
  name: string;
  forceOverlay?: boolean;
  lock?: boolean;
  inputs?: any[];
  overrides?: Record<string, any>;
  options?: Record<string, any>;
}

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
  
  // Initialize the TradingView widget with optional saved state
  const initWidget = (localeOverride?: string, savedState?: any) => {
    if (typeof window === 'undefined' || !window.TradingView) return;
    
    if (container.current) {
      container.current.innerHTML = '';
      
      // Set up widget configuration
      const widgetOptions: any = {
        symbol: savedState?.symbol || symbol,
        interval: savedState?.interval || interval,
        timezone,
        theme,
        style: savedState?.chartType || style || chartType || 1, // Default to candles (1)
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
          'timeframes_toolbar',
          ...disabled_features
        ],
        enabled_features: [
          // Essential features
          'side_toolbar_in_fullscreen_mode',
          'header_indicators',
          'header_chart_type',
          'show_interval_dialog_on_key_press',
          'header_settings',
          'header_screenshot',
          'header_symbol_search',
          'header_compare',
          'header_undo_redo',
          'header_saveload',
          
          // Enhanced functionality
          'study_templates',
          'display_market_status',
          'use_localstorage_for_settings',
          'border_around_the_chart',
          
          // Pro features - Removed duplicates
          'replay_mode',
          'drawing_tools_on_chart',
          'multiple_drawing_tools_on_chart',
          'chart_crosshair_menu',
          'chart_events',
          'check_scale_sequence_on_new_bar',
          'same_data_requery',
          'show_chart_property_page',
          'create_volume_indicator_by_default',
          'right_bar_stays_on_scroll',
          
          // Additional features
          'property_pages',
          'legend_context_menu',
          'go_to_date',
          'adaptive_logo',
          'caption_buttons_text_if_possible',
          'line_extension_left',
          'line_extension_right',
          'compare_symbol',
          'control_bar',
          'source_selection_markers',
          'keep_left_toolbar_visible_on_small_screens',
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
        // If we have saved studies from state, restore those first
        if (savedState?.studies && savedState.studies.length > 0) {
          console.log(`Restoring ${savedState.studies.length} studies from saved state`);
          savedState.studies.forEach((study: any) => {
            try {
              if (study.name) {
                widget.chart().createStudy(
                  study.name,
                  study.forceOverlay || false,
                  study.lock || false,
                  study.inputs || [],
                  study.overrides || {},
                  { checkLimit: false, ...(study.options || {}) }
                );
              }
            } catch (error) {
              console.warn(`Failed to restore saved study ${study.name}:`, error);
            }
          });
        } 
        // Otherwise add default studies
        else if (studies && studies.length > 0) {
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
  
  // Track selected indicators
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([]);
  
  // Handle indicator selection
  const handleIndicatorSelect = (indicator: string) => {
    if (widgetRef.current) {
      try {
        // Ensure the indicator isn't already added
        if (!selectedIndicators.includes(indicator)) {
          // Use different methods to add indicators with proper error handling
          // Use advanced options to ensure indicators are displayed correctly
          const studyInputs: Record<string, any> = {};
          const studyOverrides: Record<string, any> = {};
          
          // Special handling for common indicators
          switch(indicator) {
            case 'RSI':
              studyOverrides['Plot.linewidth'] = 2;
              studyOverrides['Plot.color'] = '#5D69B1';
              break;
            case 'MACD':
              studyOverrides['Fast MA Length'] = 12;
              studyOverrides['Slow MA Length'] = 26;
              studyOverrides['Signal Length'] = 9;
              break;
            case 'Bollinger Bands':
              studyOverrides['Plot.linewidth'] = 2;
              studyOverrides['Upper.linewidth'] = 2;
              studyOverrides['Lower.linewidth'] = 2;
              break;
            case 'Moving Average':
              studyOverrides['Plot.linewidth'] = 2;
              studyOverrides['Length'] = 20;
              break;
            case 'Volume':
              studyOverrides['volume.precision'] = 0;
              break;
            case 'Accumulation/Distribution':
              studyOverrides['Plot.linewidth'] = 2;
              break;
          }
          
          // Try multiple methods to ensure indicator is added
          try {
            // Method 1: Direct createStudy with proper options
            const studyId = widgetRef.current.chart().createStudy(
              indicator,
              false, // forceOverlay
              false, // lock
              [], // inputs
              studyOverrides, // overrides
              { checkLimit: false } // options to bypass study limit
            );
            console.log(`Added indicator ${indicator} with ID: ${studyId}`);
          } catch (err1) {
            // Method 2: Alternative approach using chart() method
            try {
              const chart = widgetRef.current.chart();
              chart.addCustomIndicator({
                name: indicator,
                metainfo: {
                  _metainfoVersion: 51,
                  id: indicator.replace(/\s+/g, '').toLowerCase(),
                  description: indicator,
                  shortDescription: indicator,
                  isCustomIndicator: true,
                },
                constructor: function() {
                  this.init = function() {
                    this.exec = function() {
                      // Try to add a standard indicator
                      chart.createStudy(indicator);
                      return [0];
                    };
                  };
                }
              });
              console.log(`Added custom indicator ${indicator}`);
            } catch (err2) {
              // Method 3: Last resort - try with the widget API
              try {
                (widgetRef.current as any).addCustomIndicator(indicator);
              } catch (err3) {
                throw new Error(`All methods failed: ${err1}, ${err2}, ${err3}`);
              }
            }
          }
          
          // Update selected indicators list
          setSelectedIndicators(prev => [...prev, indicator]);
        } else {
          console.log(`Indicator ${indicator} already added`);
        }
      } catch (error) {
        console.error(`Error adding indicator ${indicator}:`, error);
      }
    }
  };
  
  // Apply all selected indicators
  const applyAllIndicators = () => {
    setShowIndicatorsMenu(false);
    
    if (widgetRef.current && selectedIndicators.length > 0) {
      try {
        // Force chart redraw to ensure indicators appear
        const symbol = widgetRef.current.chart().symbol();
        const resolution = widgetRef.current.chart().resolution();
        
        // Refresh the chart to ensure indicators are visible
        widgetRef.current.chart().refreshDWM(true);
        
        console.log(`Applied ${selectedIndicators.length} indicators to chart`);
      } catch (error) {
        console.error('Error applying indicators:', error);
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
          
          <div className="flex flex-col h-full">
            <div className="flex flex-grow">
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
            
            {/* Indicators status bar and Apply button */}
            <div className="border-t border-gray-700 p-3 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                <span className="font-medium text-white">{selectedIndicators.length}</span> indicators selected
              </div>
              <button
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
                onClick={applyAllIndicators}
              >
                Apply
              </button>
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
          <div className="flex items-center space-x-1 mr-2">
            {['1', '5', '15', '30', '60', 'D', 'W', 'M'].map((timeframe) => (
              <button
                key={timeframe}
                className={`px-2 py-1 text-xs rounded ${
                  interval === timeframe ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
                onClick={() => {
                  if (widgetRef.current) {
                    try {
                      console.log(`Attempting to change interval to ${timeframe}...`);
                      
                      // PRO METHOD: Directly access the TradingView internal API
                      // This method exactly replicates how TradingView Pro changes intervals
                      if (widgetRef.current._innerAPI) {
                        widgetRef.current._innerAPI().changeInterval(timeframe);
                        console.log(`Changed interval using _innerAPI to ${timeframe}`);
                        return;
                      }
                      
                      // FALLBACK METHOD 1: Most reliable standard method
                      // Save chart configuration and studies before changing interval
                      const chartType = widgetRef.current.chart().chartType();
                      const currentSymbol = widgetRef.current.chart().symbol();
                      let activeStudies: any[] = [];
                      
                      try {
                        // Get all active studies with complete configuration
                        activeStudies = widgetRef.current.chart().getAllStudies() || [];
                        console.log(`Found ${activeStudies.length} active studies`);
                      } catch (studyErr) {
                        console.warn("Could not retrieve studies:", studyErr);
                      }
                      
                      // Create a promise to track the resolution change
                      const changeResolutionPromise = new Promise<void>((resolve, reject) => {
                        try {
                          // Properly set the resolution with a callback
                          widgetRef.current.chart().setResolution(timeframe, (error: any) => {
                            if (error) {
                              console.error('Error in resolution callback:', error);
                              reject(error);
                            } else {
                              console.log(`Successfully changed interval to ${timeframe}`);
                              resolve();
                            }
                          });
                        } catch (err) {
                          reject(err);
                        }
                      });
                      
                      changeResolutionPromise.then(() => {
                        // After interval change, ensure widget is fully updated
                        try {
                          // Force a refresh with the same symbol but new interval
                          widgetRef.current.setSymbol(currentSymbol, timeframe, () => {
                            console.log(`Reset symbol to ${currentSymbol} with interval ${timeframe}`);
                            
                            // Restore chart type after interval change
                            if (chartType) {
                              try {
                                widgetRef.current.chart().setChartType(chartType);
                                console.log(`Restored chart type to ${chartType}`);
                              } catch (chartErr) {
                                console.warn("Could not restore chart type:", chartErr);
                              }
                            }
                            
                            // Re-add studies that were active before interval change
                            if (activeStudies && activeStudies.length > 0) {
                              activeStudies.forEach((study: any) => {
                                try {
                                  if (study.name) {
                                    // Create each study with its exact original configuration
                                    const studyId = widgetRef.current.chart().createStudy(
                                      study.name,
                                      study.forceOverlay || false,
                                      study.lock || false,
                                      study.inputs || [],
                                      study.overrides || {},
                                      { checkLimit: false, ...study.options }
                                    );
                                    console.log(`Restored study ${study.name} with ID ${studyId}`);
                                  }
                                } catch (studyErr) {
                                  console.warn(`Failed to restore study ${study.name}:`, studyErr);
                                }
                              });
                              
                              // Final chart refresh to ensure everything is visible
                              try {
                                widgetRef.current.chart().refreshDWM(true);
                                widgetRef.current.chart().executeActionById("refreshMarks");
                              } catch (refreshErr) {
                                console.warn("Could not perform final refresh:", refreshErr);
                              }
                            }
                          });
                        } catch (symbolErr) {
                          console.error("Error resetting symbol:", symbolErr);
                        }
                      }).catch(err => {
                        console.error("Resolution change process failed:", err);
                        
                        // FALLBACK METHOD 2: Last resort - reinitialize the widget
                        try {
                          // Save the current state we need to restore
                          const savedState = {
                            symbol: currentSymbol,
                            interval: timeframe,
                            chartType: chartType,
                            studies: activeStudies
                          };
                          
                          // Clean up the container
                          if (container.current) {
                            container.current.innerHTML = '';
                            // Reinitialize with the new interval
                            const localeToUse = i18n.language === 'he' ? 'he_IL' : 'en';
                            initWidget(localeToUse, {
                              symbol: currentSymbol,
                              interval: timeframe,
                              chartType: chartType,
                              studies: activeStudies
                            });
                          }
                        } catch (finalErr) {
                          console.error("All interval change methods failed:", finalErr);
                        }
                      });
                    } catch (err) {
                      console.error('Error setting interval:', err);
                    }
                  }
                }}
              >
                {timeframe === '1' && '1m'}
                {timeframe === '5' && '5m'}
                {timeframe === '15' && '15m'}
                {timeframe === '30' && '30m'}
                {timeframe === '60' && '1h'}
                {timeframe === 'D' && '1D'}
                {timeframe === 'W' && '1W'}
                {timeframe === 'M' && '1M'}
              </button>
            ))}
          </div>
          
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
          
          {/* Drawing Tools Button */}
          <button 
            className="px-3 py-1 text-white text-sm rounded hover:bg-gray-700 ml-2 flex items-center"
            onClick={() => {
              if (widgetRef.current) {
                try {
                  // Open drawing tools menu using TradingView internal API
                  widgetRef.current.chart().executeActionById("drawingToolbarAction");
                } catch (error) {
                  console.error("Error opening drawing tools:", error);
                }
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
            Draw
          </button>
          
          {/* Replay Button */}
          <button 
            className="px-3 py-1 text-white text-sm rounded hover:bg-gray-700 ml-2 flex items-center"
            onClick={() => {
              if (widgetRef.current) {
                try {
                  // Toggle replay mode using TradingView internal API
                  widgetRef.current.chart().executeActionById("replayMode");
                } catch (error) {
                  console.error("Error toggling replay mode:", error);
                }
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            Replay
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