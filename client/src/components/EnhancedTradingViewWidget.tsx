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
  
  // Create unique container ID for each instance
  const uniqueId = useRef(`tradingview_widget_${Math.random().toString(36).substring(2, 9)}`);
  
  useEffect(() => {
    if (container.current) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => initWidget();
      
      document.body.appendChild(script);
      scriptRef.current = script;

      return () => {
        if (scriptRef.current) {
          document.body.removeChild(scriptRef.current);
        }
      };
    }
  }, []);
  
  useEffect(() => {
    // Update the widget if key properties change
    if (widgetRef.current) {
      widgetRef.current.setSymbol(symbol, interval);
    }
  }, [symbol, interval]);
  
  useEffect(() => {
    // Sync locale with i18n
    if (widgetRef.current && i18n.language) {
      const tvLocale = i18n.language === 'he' ? 'he_IL' : 'en';
      if (tvLocale !== locale) {
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
        disabled_features,
        enabled_features,
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
      
      // Initialize widget
      const widget = new window.TradingView.widget(widgetOptions);
      widgetRef.current = widget;
      
      // Add the studies once the widget is ready
      if (studies && studies.length > 0) {
        widget.onChartReady(() => {
          studies.forEach(study => {
            widget.chart().createStudy(study);
          });
          
          // Set up price updates if callback is provided
          if (onPriceUpdate) {
            const updatePrice = () => {
              try {
                const chart = widget.chart();
                const symbolInfo = chart.symbol();
                const lastPrice = chart.getLastPrice(symbolInfo);
                
                if (lastPrice && lastPrice !== currentPrice) {
                  setCurrentPrice(lastPrice);
                  onPriceUpdate(lastPrice);
                }
              } catch (error) {
                console.error("Error getting price update:", error);
              }
            };
            
            // Update price every second
            const interval = setInterval(updatePrice, 1000);
            return () => clearInterval(interval);
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
        });
      }
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