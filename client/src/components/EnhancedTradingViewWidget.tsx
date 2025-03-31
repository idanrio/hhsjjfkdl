import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle, Ref, ForwardRefRenderFunction } from 'react';
import { useTranslation } from 'react-i18next';

// Extend the window object with TradingView properties
declare global {
  interface Window {
    TradingView: any;
  }
}

// Define the replay status interface
interface ReplayStatus {
  active: boolean;
  speed?: number;
  timer?: any;
  bufferSize?: number;
}

// Define the type for the ref
export interface TradingViewRef {
  refreshWidget: () => void;
  widget: any;
  getCurrentPrice: () => number;
  toggleReplayMode: () => void;
  setReplaySpeed: (speed: number) => void;
  isReplayAvailable: () => boolean;
  getReplayStatus: () => ReplayStatus;
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
        
        // Enhanced features for indicators and replay
        // Indicator categories matching TradingView Pro
        preset: "capitulre", // Custom preset to match your company branding
        
        // Load the studies specified in props
        studies: studies || [],
        
        // Advanced options
        disabled_features: [
          ...(disabled_features || []),
        ],
        enabled_features: [
          ...(enabled_features || []),
          
          // Advanced features for professional trading
          "study_templates",
          "use_localstorage_for_settings",
          "save_chart_properties_to_local_storage",
          "right_bar_stays_on_scroll",
          "header_widget_dom_node",
          "side_toolbar_in_fullscreen_mode",
          
          // Replay mode features
          "show_replay",
          "replay_mode",
          "replay_mode_available",
          "replay_reset_time_visible",
          
          // Study/indicator features
          "show_chart_property_page",
          "property_pages",
          "chart_property_page_style",
          "chart_property_page_scales",
          "chart_property_page_background",
          "chart_property_page_timezone_sessions",
          "support_multicharts",
          "header_fullscreen_button",
          "header_widget",
          "header_screenshot",
          "header_saveload",
          "header_symbol_search",
          "header_indicators",
          "header_compare",
          "header_undo_redo", 
          "header_settings",
          "border_around_the_chart",
          "display_market_status",
          "timeframes_toolbar",
          "go_to_date",
          "property_pages",
          "show_chart_property_page",
          "symbol_info",
          "streaming_high_frequency",
          "volume_force_overlay",
          "left_toolbar",
          "control_bar",
          "legend_context_menu",
          "scales_context_menu",
          "chart_property_page_background",
          "chart_property_page_scales",
          "chart_property_page_timezone_sessions",
          "chart_property_page_trading",
          "chart_property_page_style",
          "show_interval_dialog_on_key_press",
          "caption_buttons_text_if_possible",
          "show_object_tree",
          "source_selection_markers",
          "property_pages",
          "support_search_bar",
          "support_multicharts",
          "drawing_templates",
          "chart_crosshair_menu",
          // Replay mode features
          "show_replay",
          "replay_mode",
          "replay_reset_time_visible",
          "replay_mode_available",
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
      
      // Define indicator categories for the menu (matching TradingView Pro)
      widgetOptions.studies_overrides = {
        "volume.volume.color.0": "#ea3943", // Red for down volume
        "volume.volume.color.1": "#16c784", // Green for up volume
        "volume.volume.transparency": 70,
        "volume.volume ma.color": "#FF9800",
        "volume.volume ma.transparency": 30,
        "volume.volume ma.linewidth": 1,
        "macd.histogram.color": "#22a1e2", // Company light blue 
        "macd.macd.color": "#1c3d86", // Company dark blue
        "macd.signal.color": "#FF9800"
      };
      
      // Define indicator categories structure
      widgetOptions.favorites = {
        intervals: ["1D", "1W", "1M"],
        chartTypes: ["Candles", "Bars", "Line"],
        studies: [
          "MACD",
          "RSI",
          "Bollinger Bands",
          "Moving Average",
          "Ichimoku Cloud"
        ]
      };
      
      // Add onChartReady callback to the widget options
      widgetOptions.onChartReady = function() {
        // Set up custom theme to match Capitulre brand colors
        widget.applyOverrides({
          "paneProperties.background": theme === 'dark' ? "#131722" : "#FFFFFF",
          "paneProperties.vertGridProperties.color": theme === 'dark' ? "#1E3d80" : "#E3F2FD",
          "paneProperties.horzGridProperties.color": theme === 'dark' ? "#1E3d80" : "#E3F2FD",
          "scalesProperties.lineColor": theme === 'dark' ? "#22a1e2" : "#1c3d86",
          "mainSeriesProperties.candleStyle.upColor": "#16c784",
          "mainSeriesProperties.candleStyle.downColor": "#ea3943",
          "mainSeriesProperties.candleStyle.borderUpColor": "#16c784",
          "mainSeriesProperties.candleStyle.borderDownColor": "#ea3943",
          "mainSeriesProperties.candleStyle.wickUpColor": "#16c784",
          "mainSeriesProperties.candleStyle.wickDownColor": "#ea3943",
        });
        
        // Add the studies
        if (studies && studies.length > 0) {
          studies.forEach(study => {
            widget.chart().createStudy(study);
          });
        }
        
        // Configure Replay mode settings
        try {
          const chart = widget.chart();
          
          // This enables the replay functionality with proper visual styling
          chart.onIntervalChanged().subscribe(null, () => {
            // Refresh replay availability when interval changes
            if (chart.isReplayAvailable()) {
              console.log("Replay is available for this symbol and timeframe");
            }
          });
          
          // Add event listener for replay mode
          chart.onReplayStateChanged().subscribe(null, (replayState: ReplayStatus) => {
            if (replayState.active) {
              console.log("Replay mode is active");
            } else {
              console.log("Replay mode is inactive");
            }
          });
        } catch (error) {
          console.error("Error setting up replay:", error);
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
        
        // Configure popular default indicators for quick access
        const defaultIndicators = [
          { name: "Volume", id: "Volume" },
          { name: "Moving Average", id: "Moving Average", inputs: { length: 50, source: "close" } },
          { name: "Moving Average", id: "Moving Average", inputs: { length: 200, source: "close" } },
          { name: "RSI", id: "RSI" }
        ];
        
        // Load default indicators
        defaultIndicators.forEach(indicator => {
          try {
            widget.chart().createStudy(
              indicator.id,
              false,
              false,
              indicator.inputs
            );
          } catch (error) {
            console.error(`Error loading default indicator ${indicator.id}:`, error);
          }
        });
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

  // Function to toggle replay mode
  const toggleReplayMode = () => {
    if (widgetRef.current) {
      try {
        const chart = widgetRef.current.chart();
        if (chart.isReplayAvailable()) {
          if (chart.replayStatus().active) {
            // If replay is active, stop it
            chart.stopReplaying();
          } else {
            // If replay is not active, start it
            chart.startReplaying();
          }
        } else {
          console.log("Replay is not available for this symbol/timeframe");
        }
      } catch (error) {
        console.error("Error toggling replay mode:", error);
      }
    }
  };

  // Function to control replay speed
  const setReplaySpeed = (speed: number) => {
    if (widgetRef.current) {
      try {
        const chart = widgetRef.current.chart();
        if (chart.replayStatus().active) {
          chart.setReplaySpeed(speed);
        }
      } catch (error) {
        console.error("Error setting replay speed:", error);
      }
    }
  };

  // Expose functions and widget reference to parent
  useImperativeHandle(
    ref,
    () => ({
      refreshWidget,
      widget: widgetRef.current,
      getCurrentPrice: () => currentPrice,
      toggleReplayMode,
      setReplaySpeed,
      // Helper method to check if replay is available
      isReplayAvailable: () => {
        if (widgetRef.current) {
          try {
            return widgetRef.current.chart().isReplayAvailable();
          } catch (error) {
            console.error("Error checking replay availability:", error);
            return false;
          }
        }
        return false;
      },
      // Helper method to get replay status
      getReplayStatus: () => {
        if (widgetRef.current) {
          try {
            return widgetRef.current.chart().replayStatus();
          } catch (error) {
            console.error("Error getting replay status:", error);
            return { active: false };
          }
        }
        return { active: false };
      }
    }),
    [widgetRef.current, currentPrice]
  );
  
  return (
    <div 
      ref={container} 
      style={{ width, height }}
      id={uniqueId.current}
      className="trading-view-container"
    />
  );
};

export const EnhancedTradingViewWidget = forwardRef(EnhancedTradingViewWidgetComponent);

export default EnhancedTradingViewWidget;