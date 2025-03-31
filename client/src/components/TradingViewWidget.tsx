import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Position } from '@/types/trading';

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
  
  // Positions and Orders related props
  positions?: Position[];
  onPositionCreated?: (position: Position) => void;
  onPositionClosed?: (positionId: string) => void;
  onPositionModified?: (position: Position) => void;
  enableBrokerIntegration?: boolean; // Enable TradingView broker integration
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
  className = '',
  // Positions and orders props
  positions = [],
  onPositionCreated,
  onPositionClosed,
  onPositionModified,
  enableBrokerIntegration = false
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const { i18n } = useTranslation();
  
  // Set locale based on current application language
  const currentLocale = i18n.language === 'he' ? 'he_IL' : 'en';
  
  // Store widget instance reference
  const widgetInstanceRef = useRef<any>(null);
  
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
        // Create new widget with enhanced configuration
        const widgetOptions = {
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
          "disabled_features": disabled_features.concat([
            // Disable features that might conflict with broker integration
            ...(enableBrokerIntegration ? ['header_compare', 'header_symbol_search'] : [])
          ]),
          "enabled_features": enabled_features.concat([
            // Enable trading features for TradingView Pro
            ...(enableBrokerIntegration ? [
              'trading_account_manager',
              'header_chart_type',
              'order_panel',
              'trading_notifications',
              'buy_sell_buttons',
              'show_trading_notifications_history'
            ] : [])
          ]),
          
          // Add broker configuration if enabled
          ...(enableBrokerIntegration ? {
            "broker_config": {
              "configFlags": {
                "supportOrderBrackets": true,
                "supportPositions": true,
                "supportClosePosition": true,
                "supportPLUpdate": true,
                "supportLevel2Data": true
              }
            }
          } : {})
        };
        
        // Create the widget
        widgetInstanceRef.current = new window.TradingView.widget(widgetOptions);
        
        return;
      }
      
      // If TradingView is not loaded yet, load the script
      if (!scriptRef.current) {
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
          if (window.TradingView) {
            // Create new widget after script loads with the same enhanced configuration
            const widgetOptions = {
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
              "disabled_features": disabled_features.concat([
                // Disable features that might conflict with broker integration
                ...(enableBrokerIntegration ? ['header_compare', 'header_symbol_search'] : [])
              ]),
              "enabled_features": enabled_features.concat([
                // Enable trading features for TradingView Pro
                ...(enableBrokerIntegration ? [
                  'trading_account_manager',
                  'header_chart_type',
                  'order_panel',
                  'trading_notifications',
                  'buy_sell_buttons',
                  'show_trading_notifications_history'
                ] : [])
              ]),
              
              // Add broker configuration if enabled
              ...(enableBrokerIntegration ? {
                "broker_config": {
                  "configFlags": {
                    "supportOrderBrackets": true,
                    "supportPositions": true,
                    "supportClosePosition": true,
                    "supportPLUpdate": true,
                    "supportLevel2Data": true
                  }
                }
              } : {})
            };
            
            // Create the widget
            widgetInstanceRef.current = new window.TradingView.widget(widgetOptions);
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
        widgetInstanceRef.current = null;
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
    autosize,
    enableBrokerIntegration
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
  
  // Handle position creation, modification, and closing
  useEffect(() => {
    if (!enableBrokerIntegration || !widgetInstanceRef.current) return;
    
    // Wait for the widget to be ready
    const widget = widgetInstanceRef.current;
    
    const onReady = () => {
      if (!widget || !widget.chart) return;
      
      // Set up chart event listeners for positions and orders
      if (widget.chart && widget.chart().onChartReady) {
        widget.chart().onChartReady(() => {
          console.log('TradingView chart is ready for trading operations');
          
          // Set up custom broker interface for handling positions
          if (widget.chart().createPositionBroker) {
            const broker = widget.chart().createPositionBroker();
            
            // Set positions if any were provided
            if (positions && positions.length > 0) {
              // Convert our positions to TradingView format
              const tvPositions = positions.map(position => ({
                id: position.id,
                symbol: symbol,
                side: position.type === 'long' ? 'buy' : 'sell',
                qty: position.amount,
                entryPrice: position.entryPrice,
                stopLoss: position.stopLoss || undefined,
                takeProfit: position.takeProfit || undefined,
                entryTime: new Date(position.entryTime).getTime(),
                profit: position.profitLoss || 0,
                status: position.status
              }));
              
              // Add positions to chart
              broker.setPositions(tvPositions);
            }
            
            // Set up event listeners for position changes
            if (broker.on) {
              // Listen for position created events
              broker.on('positionCreated', (params: any) => {
                if (onPositionCreated) {
                  // Convert TradingView position to our format
                  const newPosition: Position = {
                    id: params.id || `pos-${Date.now()}`,
                    type: params.side === 'buy' ? 'long' : 'short',
                    entryPrice: params.entryPrice,
                    entryTime: params.entryTime || Date.now(),
                    stopLoss: params.stopLoss || null,
                    takeProfit: params.takeProfit || null,
                    amount: params.qty,
                    leverage: params.leverage || 1,
                    status: 'active'
                  };
                  
                  onPositionCreated(newPosition);
                }
              });
              
              // Listen for position closed events
              broker.on('positionClosed', (params: any) => {
                if (onPositionClosed && params.id) {
                  onPositionClosed(params.id);
                }
              });
              
              // Listen for position modified events
              broker.on('positionModified', (params: any) => {
                if (onPositionModified) {
                  // Find the existing position
                  const existingPosition = positions.find(p => p.id === params.id);
                  if (!existingPosition) return;
                  
                  // Create modified position with updated values
                  const modifiedPosition: Position = {
                    ...existingPosition,
                    stopLoss: params.stopLoss || existingPosition.stopLoss,
                    takeProfit: params.takeProfit || existingPosition.takeProfit,
                    amount: params.qty || existingPosition.amount
                  };
                  
                  onPositionModified(modifiedPosition);
                }
              });
            }
          }
        });
      }
    };
    
    // Check if widget is ready or wait for it
    if (widget.iframe && widget.iframe.contentWindow) {
      onReady();
    } else if (widget.onChartReady) {
      widget.onChartReady(onReady);
    }
    
  }, [widgetInstanceRef.current, enableBrokerIntegration, positions, symbol, onPositionCreated, onPositionClosed, onPositionModified]);
  
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