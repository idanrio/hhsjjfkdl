import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as LightweightCharts from 'lightweight-charts';
import { 
  Button, 
  ButtonGroup 
} from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Card, 
  CardContent 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ChevronDown, 
  Lightbulb, 
  Maximize2, 
  Settings, 
  BarChart3, 
  CandlestickChart, 
  LineChart, 
  Combine, 
  BarChart4, 
  Pencil, 
  MousePointer, 
  MoveHorizontal, 
  Search, 
  PanelTop, 
  Square, 
  Trash2, 
  RotateCcw,
  AlignJustify,
  Lock,
  ArrowUpDown,
  X,
  Plus,
  ChevronUp,
  ChevronRight
} from 'lucide-react';
import type { Position, ChartPatternRecognitionResult } from '@/types/trading';

// Technical indicators implementation for charts
import { computeRSI, computeMACD, computeBollingerBands, computeEMA, computeSMA } from '@/lib/indicators';

// Enhanced market service for better chart data
import { 
  getChartData, 
  formatOHLCVForLightweightCharts, 
  TIME_FRAMES, 
  calculatePositionPnL, 
  calculatePositionPnLPercentage,
  getRealTimePrice
} from '@/services/enhancedMarketService';

export interface ProTradingViewChartProps {
  symbol: string;
  initialPrice?: number;
  className?: string;
  initialPositions?: Position[];
  showVolume?: boolean;
  activeIndicators?: string[];
  activeRange?: string;
  timeControllerDate?: Date;
  isPlaying?: boolean;
  playbackSpeed?: number;
  enableDrawingTools?: boolean;
  enablePatternRecognition?: boolean;
  onPatternDetected?: (patterns: ChartPatternRecognitionResult[]) => void;
  onPositionCreated?: (position: Position) => void;
  onPositionClosed?: (position: Position) => void;
  onPositionModified?: (position: Position) => void;
  fullScreen?: boolean;
  onFullScreenChange?: (isFullScreen: boolean) => void;
}

// Define all available indicators with their parameters
const allAvailableIndicators = [
  { id: 'sma', name: 'Simple Moving Average (SMA)', parameters: [{ name: 'period', defaultValue: 20 }], category: 'trend' },
  { id: 'ema', name: 'Exponential Moving Average (EMA)', parameters: [{ name: 'period', defaultValue: 21 }], category: 'trend' },
  { id: 'bb', name: 'Bollinger Bands', parameters: [{ name: 'period', defaultValue: 20 }, { name: 'multiplier', defaultValue: 2 }], category: 'volatility' },
  { id: 'rsi', name: 'Relative Strength Index (RSI)', parameters: [{ name: 'period', defaultValue: 14 }], category: 'momentum' },
  { id: 'macd', name: 'MACD', parameters: [{ name: 'fastPeriod', defaultValue: 12 }, { name: 'slowPeriod', defaultValue: 26 }, { name: 'signalPeriod', defaultValue: 9 }], category: 'momentum' },
  { id: 'adx', name: 'Average Directional Index (ADX)', parameters: [{ name: 'period', defaultValue: 14 }], category: 'trend' },
  { id: 'atr', name: 'Average True Range (ATR)', parameters: [{ name: 'period', defaultValue: 14 }], category: 'volatility' },
  { id: 'stoch', name: 'Stochastic Oscillator', parameters: [{ name: 'period', defaultValue: 14 }, { name: 'smoothK', defaultValue: 3 }, { name: 'smoothD', defaultValue: 3 }], category: 'momentum' },
  { id: 'volume', name: 'Volume', parameters: [], category: 'volume' },
];

// Define available drawing tools
const drawingTools = [
  { id: 'cursor', name: 'Cursor', icon: <MousePointer size={16} /> },
  { id: 'line', name: 'Trend Line', icon: <MoveHorizontal size={16} /> },
  { id: 'horizontal', name: 'Horizontal Line', icon: <AlignJustify size={16} className="rotate-90" /> },
  { id: 'rectangle', name: 'Rectangle', icon: <Square size={16} /> },
  { id: 'fibonacci', name: 'Fibonacci Retracement', icon: <ArrowUpDown size={16} /> },
  { id: 'text', name: 'Text', icon: <Pencil size={16} /> },
];

// Available timeframes
const timeframes = [
  { value: '1m', label: '1 min' },
  { value: '5m', label: '5 min' },
  { value: '15m', label: '15 min' },
  { value: '30m', label: '30 min' },
  { value: '1h', label: '1 hour' },
  { value: '4h', label: '4 hour' },
  { value: '1d', label: '1 day' },
  { value: '1w', label: '1 week' },
];

// Chart types
const chartTypes = [
  { id: 'candle', name: 'Candle', icon: <CandlestickChart size={16} /> },
  { id: 'line', name: 'Line', icon: <LineChart size={16} /> },
  { id: 'area', name: 'Area', icon: <BarChart4 size={16} /> },
  { id: 'bar', name: 'Bar', icon: <BarChart3 size={16} /> },
];

export default function ProTradingViewChart({
  symbol,
  initialPrice,
  className = '',
  initialPositions = [],
  showVolume = true,
  activeIndicators = [],
  activeRange = '1d',
  timeControllerDate,
  isPlaying = false,
  playbackSpeed = 1,
  enableDrawingTools = true,
  enablePatternRecognition = true,
  onPatternDetected,
  onPositionCreated,
  onPositionClosed,
  onPositionModified,
  fullScreen = false,
  onFullScreenChange
}: ProTradingViewChartProps) {
  // Translation hook
  const { t } = useTranslation();
  
  // Chart container ref
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<LightweightCharts.IChartApi | null>(null);
  const mainSeriesRef = useRef<LightweightCharts.ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<LightweightCharts.ISeriesApi<"Histogram"> | null>(null);
  const indicatorSeriesRefs = useRef<Map<string, LightweightCharts.ISeriesApi<any>>>(new Map());
  const drawingsRef = useRef<any[]>([]);
  
  // Component state
  const [chartType, setChartType] = useState<'candle' | 'line' | 'area' | 'bar'>('candle');
  const [selectedTimeframe, setSelectedTimeframe] = useState(activeRange);
  const [chartData, setChartData] = useState<LightweightCharts.CandlestickData[]>([]);
  const [volumeData, setVolumeData] = useState<LightweightCharts.HistogramData[]>([]);
  const [positions, setPositions] = useState<Position[]>(initialPositions);
  const [loading, setLoading] = useState(true);
  const [activeDrawingTool, setActiveDrawingTool] = useState<string>('cursor');
  const [showIndicatorDialog, setShowIndicatorDialog] = useState(false);
  const [searchIndicator, setSearchIndicator] = useState('');
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(activeIndicators || []);
  const [indicatorParameters, setIndicatorParameters] = useState<Record<string, Record<string, number>>>({});
  const [detectedPatterns, setDetectedPatterns] = useState<ChartPatternRecognitionResult[]>([]);
  const [lastPrice, setLastPrice] = useState<number>(initialPrice || 0);
  const [showSettings, setShowSettings] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load chart data on component mount or when parameters change
  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        // Get chart data using our enhanced market service
        let symbolToUse = symbol;
        if (symbol.includes('/')) {
          // Extract base currency for crypto pairs (e.g., BTC/USD -> BTC)
          symbolToUse = symbol.split('/')[0];
        }
        
        // Calculate start date based on timeframe - go back enough periods to have meaningful data
        const endDate = timeControllerDate || new Date();
        let startDate = new Date(endDate);
        
        // Determine how far back to go based on the selected timeframe
        const timeframeMultiplier = {
          '1m': 60 * 24 * 3,       // 3 days of 1-minute data
          '5m': 60 * 24 * 5 / 5,    // 5 days of 5-minute data
          '15m': 60 * 24 * 7 / 15,  // 7 days of 15-minute data
          '30m': 60 * 24 * 14 / 30, // 14 days of 30-minute data
          '1h': 24 * 30,           // 30 days of hourly data
          '4h': 24 * 60 / 4,        // 60 days of 4-hour data
          '1d': 365,               // 1 year of daily data
          '1w': 156                // 3 years of weekly data
        };
        
        // Set the start date back by the appropriate number of periods
        const periodsToGoBack = timeframeMultiplier[selectedTimeframe as keyof typeof timeframeMultiplier] || 100;
        const timeframeInSeconds = TIME_FRAMES[selectedTimeframe as keyof typeof TIME_FRAMES]?.seconds || 86400;
        startDate.setSeconds(startDate.getSeconds() - timeframeInSeconds * periodsToGoBack);
        
        // Fetch OHLCV data using our enhanced service
        const ohlcvData = await getChartData(symbolToUse, selectedTimeframe, startDate, endDate);
        
        if (ohlcvData && ohlcvData.length > 0) {
          // Format the data for lightweight-charts
          const formattedData = formatOHLCVForLightweightCharts(ohlcvData);
          
          // Create candle data
          const candleData = formattedData.map(item => ({
            time: item.time as number,
            open: item.open,
            high: item.high,
            low: item.low,
            close: item.close
          }));
          
          // Create volume data
          const volumeHistogramData = formattedData.map(item => ({
            time: item.time as number,
            value: item.volume || 0,
            color: item.close >= item.open ? 'rgba(0, 150, 136, 0.3)' : 'rgba(255, 82, 82, 0.3)'
          }));
          
          // Update chart data state
          setChartData(candleData as any); // Type assertion to bypass TypeScript error
          setVolumeData(volumeHistogramData as any); // Type assertion to bypass TypeScript error
          
          // Update last price
          if (candleData.length > 0) {
            const lastCandlePrice = candleData[candleData.length - 1].close;
            setLastPrice(lastCandlePrice);
            
            // Update position PnL based on new price
            if (positions.length > 0) {
              const updatedPositions = positions.map(position => {
                if (position.status === 'active') {
                  const pnl = calculatePositionPnL(position, lastCandlePrice);
                  return {
                    ...position,
                    profitLoss: pnl
                  };
                }
                return position;
              });
              setPositions(updatedPositions);
            }
          }
          
          // Check for chart patterns if enabled
          if (enablePatternRecognition && onPatternDetected) {
            // Pattern detection logic would go here
            // This would be implemented with the talib-web library
          }
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchChartData();
  }, [symbol, selectedTimeframe, timeControllerDate, positions, refreshTrigger, enablePatternRecognition, onPatternDetected]);

  // Initialize chart with data
  useEffect(() => {
    if (!chartContainerRef.current || chartData.length === 0) return;
    
    // Create chart if it doesn't exist
    if (!chartInstanceRef.current) {
      const chartOptions: LightweightCharts.ChartOptions = {
        layout: {
          background: { color: 'transparent' },
          textColor: '#D9D9D9',
        },
        grid: {
          vertLines: { color: 'rgba(42, 46, 57, 0.5)' },
          horzLines: { color: 'rgba(42, 46, 57, 0.5)' },
        },
        crosshair: {
          mode: LightweightCharts.CrosshairMode.Normal,
          vertLine: {
            color: '#22a1e2',
            width: 1,
            style: LightweightCharts.LineStyle.Dashed,
          },
          horzLine: {
            color: '#22a1e2',
            width: 1,
            style: LightweightCharts.LineStyle.Dashed,
          },
        },
        timeScale: {
          borderColor: 'rgba(197, 203, 206, 0.3)',
          timeVisible: true,
          secondsVisible: false,
        },
        rightPriceScale: {
          borderColor: 'rgba(197, 203, 206, 0.3)',
        },
      };
      
      // Create chart instance
      chartInstanceRef.current = LightweightCharts.createChart(
        chartContainerRef.current,
        chartOptions
      );
      
      // Handle window resize
      const resizeObserver = new ResizeObserver(() => {
        if (chartContainerRef.current && chartInstanceRef.current) {
          chartInstanceRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
          });
        }
      });
      
      if (chartContainerRef.current) {
        resizeObserver.observe(chartContainerRef.current);
      }
      
      return () => {
        resizeObserver.disconnect();
        if (chartInstanceRef.current) {
          chartInstanceRef.current.remove();
          chartInstanceRef.current = null;
        }
      };
    }
    
    return () => {};
  }, [chartData]);

  // Update chart data and type when data changes
  useEffect(() => {
    if (!chartInstanceRef.current || chartData.length === 0) return;
    
    // Remove existing series if they exist
    if (mainSeriesRef.current) {
      chartInstanceRef.current.removeSeries(mainSeriesRef.current);
      mainSeriesRef.current = null;
    }
    
    // Create the appropriate series based on chart type
    switch (chartType) {
      case 'candle':
        mainSeriesRef.current = chartInstanceRef.current.addCandlestickSeries({
          upColor: '#22a1e2',
          downColor: '#ef4444',
          borderUpColor: '#22a1e2',
          borderDownColor: '#ef4444',
          wickUpColor: '#22a1e2',
          wickDownColor: '#ef4444',
        });
        mainSeriesRef.current.setData(chartData);
        break;
        
      case 'line':
        const lineSeries = chartInstanceRef.current.addLineSeries({
          color: '#22a1e2',
          lineWidth: 2,
        });
        lineSeries.setData(chartData.map(d => ({
          time: d.time,
          value: d.close,
        })));
        mainSeriesRef.current = lineSeries as any;
        break;
        
      case 'area':
        const areaSeries = chartInstanceRef.current.addAreaSeries({
          topColor: 'rgba(34, 161, 226, 0.4)',
          bottomColor: 'rgba(34, 161, 226, 0.1)',
          lineColor: '#22a1e2',
          lineWidth: 2,
        });
        areaSeries.setData(chartData.map(d => ({
          time: d.time,
          value: d.close,
        })));
        mainSeriesRef.current = areaSeries as any;
        break;
        
      case 'bar':
        const barSeries = chartInstanceRef.current.addBarSeries({
          upColor: '#22a1e2',
          downColor: '#ef4444',
        });
        barSeries.setData(chartData);
        mainSeriesRef.current = barSeries as any;
        break;
    }
    
    // Add volume series if enabled
    if (showVolume && volumeData.length > 0) {
      if (volumeSeriesRef.current) {
        chartInstanceRef.current.removeSeries(volumeSeriesRef.current);
      }
      
      // Create and add volume series
      volumeSeriesRef.current = chartInstanceRef.current.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: 'volume',
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
      
      volumeSeriesRef.current.setData(volumeData);
    } else if (volumeSeriesRef.current) {
      chartInstanceRef.current.removeSeries(volumeSeriesRef.current);
      volumeSeriesRef.current = null;
    }
    
    // Fit content to view
    chartInstanceRef.current.timeScale().fitContent();
    
  }, [chartData, volumeData, chartType, showVolume]);

  // Function to add a technical indicator to the chart
  const addIndicator = useCallback((indicatorId: string) => {
    if (!chartInstanceRef.current || !mainSeriesRef.current) return;
    
    // If this indicator already exists, remove it first
    if (indicatorSeriesRefs.current.has(indicatorId)) {
      const series = indicatorSeriesRefs.current.get(indicatorId);
      if (series) {
        chartInstanceRef.current.removeSeries(series);
        indicatorSeriesRefs.current.delete(indicatorId);
      }
    }
    
    // Get indicator definition
    const indicator = allAvailableIndicators.find(ind => ind.id === indicatorId);
    if (!indicator) return;
    
    // Get parameters for this indicator (or use defaults)
    const params = indicatorParameters[indicatorId] || {};
    
    // Compute indicator values
    let indicatorData: any[] = [];
    
    switch (indicatorId) {
      case 'sma':
        const smaPeriod = params.period || 20;
        indicatorData = computeSMA(chartData, smaPeriod);
        
        const smaSeries = chartInstanceRef.current.addLineSeries({
          color: '#22a1e2',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          priceScaleId: 'right',
        });
        
        smaSeries.setData(indicatorData);
        indicatorSeriesRefs.current.set(indicatorId, smaSeries);
        break;
        
      case 'ema':
        const emaPeriod = params.period || 21;
        indicatorData = computeEMA(chartData, emaPeriod);
        
        const emaSeries = chartInstanceRef.current.addLineSeries({
          color: '#f59e0b',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          priceScaleId: 'right',
        });
        
        emaSeries.setData(indicatorData);
        indicatorSeriesRefs.current.set(indicatorId, emaSeries);
        break;
        
      case 'bb':
        const bbPeriod = params.period || 20;
        const bbMultiplier = params.multiplier || 2;
        const bbData = computeBollingerBands(chartData, bbPeriod, bbMultiplier);
        
        // Upper band
        const upperBandSeries = chartInstanceRef.current.addLineSeries({
          color: '#9333ea',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          priceScaleId: 'right',
        });
        
        upperBandSeries.setData(bbData.upper);
        indicatorSeriesRefs.current.set(indicatorId + '_upper', upperBandSeries);
        
        // Middle band
        const middleBandSeries = chartInstanceRef.current.addLineSeries({
          color: '#9333ea',
          lineWidth: 1,
          lineStyle: LightweightCharts.LineStyle.Dotted,
          priceLineVisible: false,
          lastValueVisible: false,
          priceScaleId: 'right',
        });
        
        middleBandSeries.setData(bbData.middle);
        indicatorSeriesRefs.current.set(indicatorId + '_middle', middleBandSeries);
        
        // Lower band
        const lowerBandSeries = chartInstanceRef.current.addLineSeries({
          color: '#9333ea',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          priceScaleId: 'right',
        });
        
        lowerBandSeries.setData(bbData.lower);
        indicatorSeriesRefs.current.set(indicatorId + '_lower', lowerBandSeries);
        break;
        
      case 'rsi':
        const rsiPeriod = params.period || 14;
        indicatorData = computeRSI(chartData, rsiPeriod);
        
        // Create a separate pane for RSI
        const rsiSeries = chartInstanceRef.current.addLineSeries({
          color: '#22a1e2',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: true,
          priceFormat: {
            type: 'price',
            precision: 2,
            minMove: 0.01,
          },
          priceScaleId: 'rsi',
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });
        
        rsiSeries.setData(indicatorData);
        
        // Add overbought/oversold levels at 70 and 30
        const overboughtSeries = chartInstanceRef.current.addLineSeries({
          color: '#ef4444',
          lineWidth: 1,
          lineStyle: LightweightCharts.LineStyle.Dashed,
          priceLineVisible: false,
          lastValueVisible: false,
          priceScaleId: 'rsi',
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });
        
        const oversoldSeries = chartInstanceRef.current.addLineSeries({
          color: '#22c55e',
          lineWidth: 1,
          lineStyle: LightweightCharts.LineStyle.Dashed,
          priceLineVisible: false,
          lastValueVisible: false,
          priceScaleId: 'rsi',
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });
        
        // Create constant lines at 70 and 30
        const overboughtData = indicatorData.map(d => ({ time: d.time, value: 70 }));
        const oversoldData = indicatorData.map(d => ({ time: d.time, value: 30 }));
        
        overboughtSeries.setData(overboughtData);
        oversoldSeries.setData(oversoldData);
        
        indicatorSeriesRefs.current.set(indicatorId, rsiSeries);
        indicatorSeriesRefs.current.set(indicatorId + '_overbought', overboughtSeries);
        indicatorSeriesRefs.current.set(indicatorId + '_oversold', oversoldSeries);
        break;
        
      case 'macd':
        const fastPeriod = params.fastPeriod || 12;
        const slowPeriod = params.slowPeriod || 26;
        const signalPeriod = params.signalPeriod || 9;
        
        const macdData = computeMACD(chartData, fastPeriod, slowPeriod, signalPeriod);
        
        // MACD Line
        const macdLineSeries = chartInstanceRef.current.addLineSeries({
          color: '#22a1e2',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: true,
          priceScaleId: 'macd',
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });
        
        // Signal Line
        const signalLineSeries = chartInstanceRef.current.addLineSeries({
          color: '#f59e0b',
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: true,
          priceScaleId: 'macd',
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });
        
        // Histogram
        const histogramSeries = chartInstanceRef.current.addHistogramSeries({
          color: '#22c55e',
          priceFormat: {
            type: 'price',
            precision: 2,
            minMove: 0.01,
          },
          priceScaleId: 'macd',
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });
        
        macdLineSeries.setData(macdData.macdLine);
        signalLineSeries.setData(macdData.signalLine);
        histogramSeries.setData(macdData.histogram.map(bar => ({
          ...bar,
          color: bar.value >= 0 ? 'rgba(0, 150, 136, 0.5)' : 'rgba(255, 82, 82, 0.5)',
        })));
        
        indicatorSeriesRefs.current.set(indicatorId + '_line', macdLineSeries);
        indicatorSeriesRefs.current.set(indicatorId + '_signal', signalLineSeries);
        indicatorSeriesRefs.current.set(indicatorId + '_histogram', histogramSeries);
        break;
    }
    
    // Add indicator to selected indicators list if not already there
    if (!selectedIndicators.includes(indicatorId)) {
      setSelectedIndicators(prev => [...prev, indicatorId]);
    }
    
  }, [chartData, indicatorParameters, selectedIndicators]);

  // Remove an indicator from the chart
  const removeIndicator = useCallback((indicatorId: string) => {
    if (!chartInstanceRef.current) return;
    
    // Handle special cases for indicators with multiple series
    if (indicatorId === 'bb') {
      ['bb_upper', 'bb_middle', 'bb_lower'].forEach(id => {
        const series = indicatorSeriesRefs.current.get(id);
        if (series) {
          chartInstanceRef.current!.removeSeries(series);
          indicatorSeriesRefs.current.delete(id);
        }
      });
    } else if (indicatorId === 'rsi') {
      ['rsi', 'rsi_overbought', 'rsi_oversold'].forEach(id => {
        const series = indicatorSeriesRefs.current.get(id);
        if (series) {
          chartInstanceRef.current!.removeSeries(series);
          indicatorSeriesRefs.current.delete(id);
        }
      });
    } else if (indicatorId === 'macd') {
      ['macd_line', 'macd_signal', 'macd_histogram'].forEach(id => {
        const series = indicatorSeriesRefs.current.get(id);
        if (series) {
          chartInstanceRef.current!.removeSeries(series);
          indicatorSeriesRefs.current.delete(id);
        }
      });
    } else {
      // Standard single-series indicator
      const series = indicatorSeriesRefs.current.get(indicatorId);
      if (series) {
        chartInstanceRef.current.removeSeries(series);
        indicatorSeriesRefs.current.delete(indicatorId);
      }
    }
    
    // Remove from selected indicators list
    setSelectedIndicators(prev => prev.filter(id => id !== indicatorId));
  }, []);

  // Update indicators when selected indicators change
  useEffect(() => {
    selectedIndicators.forEach(indicatorId => {
      addIndicator(indicatorId);
    });
  }, [selectedIndicators, addIndicator]);

  // Handle refresh button click
  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Update indicator parameters
  const updateIndicatorParameter = (indicatorId: string, paramName: string, value: number) => {
    setIndicatorParameters(prev => ({
      ...prev,
      [indicatorId]: {
        ...(prev[indicatorId] || {}),
        [paramName]: value,
      },
    }));
    
    // Re-add the indicator with new parameters
    if (selectedIndicators.includes(indicatorId)) {
      addIndicator(indicatorId);
    }
  };

  // Filter indicators by search term
  const filteredIndicators = allAvailableIndicators.filter(indicator => 
    indicator.name.toLowerCase().includes(searchIndicator.toLowerCase()) ||
    indicator.category.toLowerCase().includes(searchIndicator.toLowerCase())
  );

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chart Toolbar */}
      <div className="flex items-center justify-between border-b border-border/40 p-2 bg-card/40">
        <div className="flex items-center space-x-2">
          {/* Symbol Display */}
          <div className="font-medium text-foreground">{symbol}</div>
          
          {/* Timeframe Selector */}
          <Select 
            value={selectedTimeframe} 
            onValueChange={(value) => setSelectedTimeframe(value)}
          >
            <SelectTrigger className="w-[90px] h-8">
              <SelectValue placeholder={t('Timeframe')} />
            </SelectTrigger>
            <SelectContent>
              {timeframes.map((tf) => (
                <SelectItem key={tf.value} value={tf.value}>
                  {tf.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Chart Type Buttons */}
          <ButtonGroup>
            {chartTypes.map((type) => (
              <Button
                key={type.id}
                variant={chartType === type.id ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType(type.id as any)}
                className="h-8 px-2 py-0"
              >
                {type.icon}
              </Button>
            ))}
          </ButtonGroup>
          
          {/* Add Indicator Button */}
          <Popover open={showIndicatorDialog} onOpenChange={setShowIndicatorDialog}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Plus size={14} className="mr-1" />
                {t('Indicators')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('Search indicators...')}
                    className="pl-8"
                    value={searchIndicator}
                    onChange={(e) => setSearchIndicator(e.target.value)}
                  />
                </div>
              </div>
              <ScrollArea className="h-60">
                <div className="p-3 space-y-2">
                  {filteredIndicators.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-3">
                      {t('No indicators found')}
                    </p>
                  ) : (
                    <>
                      {/* Group by category */}
                      {['trend', 'momentum', 'volatility', 'volume'].map(category => (
                        <div key={category} className="mb-3">
                          <h3 className="text-xs font-medium uppercase text-muted-foreground mb-1.5">
                            {t(category.charAt(0).toUpperCase() + category.slice(1))}
                          </h3>
                          {filteredIndicators
                            .filter(ind => ind.category === category)
                            .map(indicator => (
                              <div
                                key={indicator.id}
                                className="flex items-center justify-between py-1"
                              >
                                <span className="text-sm">{indicator.name}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (selectedIndicators.includes(indicator.id)) {
                                      removeIndicator(indicator.id);
                                    } else {
                                      addIndicator(indicator.id);
                                    }
                                  }}
                                  className={`h-7 ${
                                    selectedIndicators.includes(indicator.id) ? 'bg-primary/20' : ''
                                  }`}
                                >
                                  {selectedIndicators.includes(indicator.id) ? (
                                    <X size={14} />
                                  ) : (
                                    <Plus size={14} />
                                  )}
                                </Button>
                              </div>
                            ))}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
          
          {/* Active Indicators Display */}
          <div className="flex items-center space-x-1 ml-1">
            {selectedIndicators.length > 0 && (
              <>
                {selectedIndicators.map(indicatorId => {
                  const indicator = allAvailableIndicators.find(ind => ind.id === indicatorId);
                  if (!indicator) return null;
                  
                  return (
                    <Badge 
                      key={indicatorId}
                      variant="outline"
                      className="px-2 py-1 h-6 bg-primary/10 hover:bg-primary/20 cursor-pointer"
                    >
                      <span className="text-xs mr-1">{indicator.id.toUpperCase()}</span>
                      <X 
                        size={12} 
                        className="text-muted-foreground hover:text-foreground" 
                        onClick={() => removeIndicator(indicatorId)}
                      />
                    </Badge>
                  );
                })}
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Drawing Tools */}
          {enableDrawingTools && (
            <ButtonGroup>
              {drawingTools.map((tool) => (
                <Button
                  key={tool.id}
                  variant={activeDrawingTool === tool.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveDrawingTool(tool.id)}
                  className="h-8 w-8 p-0"
                >
                  {tool.icon}
                </Button>
              ))}
            </ButtonGroup>
          )}
          
          {/* Settings */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                <Settings size={16} />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium">{t('Chart Settings')}</h4>
                <div className="space-y-1">
                  {/* Volume Toggle */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-volume"
                      checked={showVolume}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          // Ensure we still have volume data to display
                          if (volumeData.length > 0 && chartInstanceRef.current) {
                            volumeSeriesRef.current = chartInstanceRef.current.addHistogramSeries({
                              color: '#26a69a',
                              priceFormat: {
                                type: 'volume',
                              },
                              priceScaleId: 'volume',
                              scaleMargins: {
                                top: 0.8,
                                bottom: 0,
                              },
                            });
                            volumeSeriesRef.current.setData(volumeData);
                          }
                        } else if (volumeSeriesRef.current && chartInstanceRef.current) {
                          chartInstanceRef.current.removeSeries(volumeSeriesRef.current);
                          volumeSeriesRef.current = null;
                        }
                      }}
                    />
                    <label
                      htmlFor="show-volume"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {t('Show Volume')}
                    </label>
                  </div>
                  
                  {/* Parameter settings for active indicators */}
                  {selectedIndicators.length > 0 && (
                    <>
                      <Separator className="my-2" />
                      <h5 className="text-sm font-medium">{t('Indicator Settings')}</h5>
                      {selectedIndicators.map(indicatorId => {
                        const indicator = allAvailableIndicators.find(ind => ind.id === indicatorId);
                        if (!indicator || indicator.parameters.length === 0) return null;
                        
                        return (
                          <div key={indicatorId} className="mt-2 space-y-1">
                            <h6 className="text-xs font-medium text-primary">{indicator.name}</h6>
                            {indicator.parameters.map(param => {
                              const currentValue = indicatorParameters[indicatorId]?.[param.name] || param.defaultValue;
                              
                              return (
                                <div key={param.name} className="flex items-center justify-between">
                                  <label className="text-xs">{param.name}</label>
                                  <div className="flex items-center space-x-1">
                                    <Input
                                      type="number"
                                      value={currentValue}
                                      onChange={(e) => {
                                        const newValue = parseInt(e.target.value, 10);
                                        if (!isNaN(newValue) && newValue > 0) {
                                          updateIndicatorParameter(indicatorId, param.name, newValue);
                                        }
                                      }}
                                      className="w-16 h-6 text-xs"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {/* Refresh */}
          <Button variant="outline" size="sm" onClick={handleRefresh} className="h-8 w-8 p-0">
            <RotateCcw size={16} />
          </Button>
          
          {/* Fullscreen Toggle */}
          {onFullScreenChange && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onFullScreenChange(!fullScreen)}
              className="h-8 w-8 p-0"
            >
              <Maximize2 size={16} />
            </Button>
          )}
        </div>
      </div>
      
      {/* Main Chart Area */}
      <div className="flex-1 relative">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">{t('Loading chart data...')}</p>
            </div>
          </div>
        )}
        
        {/* Price Display */}
        <div className="absolute top-2 left-3 z-10 flex items-center space-x-1">
          <div className="text-lg font-semibold">${lastPrice.toFixed(2)}</div>
        </div>
        
        {/* Chart Container */}
        <div ref={chartContainerRef} className="h-full w-full" />
      </div>
    </div>
  );
}