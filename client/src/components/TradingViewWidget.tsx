import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// Define TradingView widget configuration properties
interface TradingViewWidgetProps {
  symbol: string;
  interval?: string;
  timezone?: string;
  theme?: 'light' | 'dark';
  style?: '1' | '2' | '3' | '4'; // Different chart types
  locale?: string;
  toolbar_bg?: string;
  enable_publishing?: boolean;
  withdateranges?: boolean;
  hide_side_toolbar?: boolean;
  allow_symbol_change?: boolean;
  save_image?: boolean;
  show_popup_button?: boolean;
  popup_width?: string;
  popup_height?: string;
  watchlist?: string[];
  studies?: string[];
  container_id?: string;
  width?: string | number;
  height?: string | number;
  autosize?: boolean;
  fullscreen?: boolean;
  studies_overrides?: Record<string, any>;
  disabled_features?: string[];
  enabled_features?: string[];
  proaccount?: boolean; // Whether to use pro account features
  className?: string;
}

/**
 * TradingViewWidget - Embeds the full TradingView Pro Chart
 * 
 * This component uses the official TradingView Widget API to embed
 * the full professional TradingView chart with all advanced features.
 */
export function TradingViewWidget({
  symbol = 'NASDAQ:AAPL',
  interval = '1D',
  timezone = 'Etc/UTC',
  theme = 'dark',
  style = '1',
  locale = 'en',
  toolbar_bg = '#1c3d86', // Capitulre primary blue
  enable_publishing = false,
  withdateranges = true,
  hide_side_toolbar = false,
  allow_symbol_change = true,
  save_image = true,
  show_popup_button = false,
  popup_width = '1000',
  popup_height = '650',
  watchlist = [],
  studies = [],
  container_id = 'tradingview_widget',
  width = '100%',
  height = '500',
  autosize = true,
  fullscreen = false,
  studies_overrides = {},
  disabled_features = [],
  enabled_features = [],
  proaccount = true,
  className = ''
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const { i18n } = useTranslation();
  
  // Set locale based on current application language
  const currentLocale = i18n.language === 'he' ? 'he_IL' : 'en';
  
  // Load TradingView widget script
  useEffect(() => {
    // Create a unique container ID to avoid conflicts with multiple widgets
    const uniqueId = container_id + '_' + Math.random().toString(36).substring(2, 9);
    
    if (containerRef.current) {
      containerRef.current.id = uniqueId;
    }
    
    // Function to load the TradingView Widget
    const loadTradingViewWidget = () => {
      // Check if the TradingView object already exists
      if (window.TradingView) {
        // Create new widget
        new window.TradingView.widget({
          "autosize": autosize,
          "symbol": symbol,
          "interval": interval,
          "timezone": timezone,
          "theme": theme,
          "style": style,
          "locale": currentLocale,
          "toolbar_bg": toolbar_bg,
          "enable_publishing": enable_publishing,
          "withdateranges": withdateranges,
          "hide_side_toolbar": hide_side_toolbar,
          "allow_symbol_change": allow_symbol_change,
          "save_image": save_image,
          "show_popup_button": show_popup_button,
          "popup_width": popup_width,
          "popup_height": popup_height,
          "container_id": uniqueId,
          "studies": studies,
          "fullscreen": fullscreen,
          "studies_overrides": studies_overrides,
          "disabled_features": disabled_features,
          "enabled_features": enabled_features
        });
        
        return;
      }
      
      // If TradingView is not loaded yet, load the script
      if (!scriptRef.current) {
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
          if (window.TradingView) {
            // Create new widget after script loads
            new window.TradingView.widget({
              "autosize": autosize,
              "symbol": symbol,
              "interval": interval,
              "timezone": timezone,
              "theme": theme,
              "style": style,
              "locale": currentLocale,
              "toolbar_bg": toolbar_bg,
              "enable_publishing": enable_publishing,
              "withdateranges": withdateranges,
              "hide_side_toolbar": hide_side_toolbar,
              "allow_symbol_change": allow_symbol_change,
              "save_image": save_image,
              "show_popup_button": show_popup_button,
              "popup_width": popup_width,
              "popup_height": popup_height,
              "container_id": uniqueId,
              "studies": studies,
              "fullscreen": fullscreen,
              "studies_overrides": studies_overrides,
              "disabled_features": disabled_features,
              "enabled_features": enabled_features
            });
          }
        };
        
        document.head.appendChild(script);
        scriptRef.current = script;
      }
    };
    
    loadTradingViewWidget();
    
    // Cleanup function
    return () => {
      if (scriptRef.current && scriptRef.current.parentNode) {
        // Don't remove the script on unmount as it might be used by other widget instances
        // Just clean up references
        scriptRef.current = null;
      }
    };
  }, [
    symbol,
    interval,
    timezone,
    theme,
    style,
    currentLocale,
    toolbar_bg,
    enable_publishing,
    withdateranges,
    hide_side_toolbar,
    allow_symbol_change,
    save_image,
    show_popup_button,
    popup_width,
    popup_height,
    studies,
    container_id,
    fullscreen,
    studies_overrides,
    disabled_features,
    enabled_features,
    autosize
  ]);
  
  // Set advanced features for TradingView Pro
  useEffect(() => {
    if (proaccount && window.TradingView) {
      // Enable Pro account features if available
      const enabledProFeatures = [
        'study_templates',
        'multiple_watchlists',
        'drawing_templates',
        'advanced_alerts',
        'multi_timeframe_studies',
        'countdown',
        'custom_resolutions',
        'custom_indicators_length'
      ];
      
      if (containerRef.current && containerRef.current.id) {
        const widgetInstance = window.TradingView.widget(containerRef.current.id);
        if (widgetInstance && widgetInstance.setFeatures) {
          widgetInstance.setFeatures(enabledProFeatures);
        }
      }
    }
  }, [proaccount]);
  
  return (
    <div 
      className={`tradingview-widget-container ${className}`}
      style={{ width: typeof width === 'number' ? `${width}px` : width, height: typeof height === 'number' ? `${height}px` : height }}
    >
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}

// Add global TypeScript definition for TradingView
declare global {
  interface Window {
    TradingView: any;
  }
}

export default TradingViewWidget;