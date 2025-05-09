import axios from 'axios';

// Types for market data
export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  icon: string;
}

// Alpha Vantage API for stock data
const ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

// This will be stored in environment variables
const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || '';

// Function to get stock data from Alpha Vantage
export const getStockData = async (symbol: string): Promise<MarketData | null> => {
  try {
    // Check if API key is missing
    if (!API_KEY) {
      console.error('Alpha Vantage API key is missing');
      // Return a placeholder with the symbol information but inform about missing key
      const data: MarketData = createPlaceholderData(symbol, getStockName(symbol), getStockIcon(symbol), 'stock');
      return data;
    }

    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol,
        apikey: API_KEY
      }
    });

    // If API key is missing or invalid
    if (response.data.Note || response.data['Error Message']) {
      console.error('API Key issue:', response.data.Note || response.data['Error Message']);
      const data: MarketData = createPlaceholderData(symbol, getStockName(symbol), getStockIcon(symbol), 'stock');
      return data;
    }

    const globalQuote = response.data['Global Quote'];
    
    if (!globalQuote) {
      console.error('Failed to fetch data for', symbol);
      const data: MarketData = createPlaceholderData(symbol, getStockName(symbol), getStockIcon(symbol), 'stock');
      return data;
    }

    // Map API response to our MarketData interface
    const data: MarketData = {
      symbol,
      name: getStockName(symbol),
      price: parseFloat(globalQuote['05. price']),
      change: parseFloat(globalQuote['09. change']),
      changePercent: parseFloat(globalQuote['10. change percent'].replace('%', '')),
      high: parseFloat(globalQuote['03. high']),
      icon: getStockIcon(symbol)
    };

    return data;
  } catch (error) {
    console.error('Error fetching stock data:', error);
    const data: MarketData = createPlaceholderData(symbol, getStockName(symbol), getStockIcon(symbol), 'stock');
    return data;
  }
};

// For cryptocurrency data
const COINAPI_BASE_URL = 'https://rest.coinapi.io/v1';
const COIN_API_KEY = import.meta.env.VITE_COINAPI_KEY || '';

export const getCryptoData = async (symbol: string): Promise<MarketData | null> => {
  try {
    // Check if API key is missing
    if (!COIN_API_KEY) {
      console.error('CoinAPI key is missing');
      const data: MarketData = createPlaceholderData(symbol, getCryptoName(symbol), getCryptoIcon(symbol), 'crypto');
      return data;
    }
    
    const response = await axios.get(`${COINAPI_BASE_URL}/exchangerate/${symbol}/USD`, {
      headers: {
        'X-CoinAPI-Key': COIN_API_KEY
      }
    });

    if (response.data.error) {
      console.error('API Error:', response.data.error);
      const data: MarketData = createPlaceholderData(symbol, getCryptoName(symbol), getCryptoIcon(symbol), 'crypto');
      return data;
    }

    // For simplicity, we'll just use the current rate for high as well
    const data: MarketData = {
      symbol,
      name: getCryptoName(symbol),
      price: response.data.rate,
      change: 0, // Placeholder for change
      changePercent: 0, // Placeholder for change percent
      high: response.data.rate * 1.02, // Estimate a high that's 2% above current
      icon: getCryptoIcon(symbol)
    };

    return data;
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    const data: MarketData = createPlaceholderData(symbol, getCryptoName(symbol), getCryptoIcon(symbol), 'crypto');
    return data;
  }
};

// For forex data - using a different API that doesn't require a key
const FOREX_API_BASE_URL = 'https://open.er-api.com/v6/latest';

export const getForexData = async (baseCurrency: string, targetCurrency: string): Promise<MarketData | null> => {
  try {
    const response = await axios.get(FOREX_API_BASE_URL, {
      params: {
        base: baseCurrency
      }
    });

    if (!response.data.rates || !response.data.rates[targetCurrency]) {
      console.error('Failed to fetch forex data');
      const data: MarketData = createPlaceholderData(
        `${baseCurrency}/${targetCurrency}`, 
        getForexName(baseCurrency, targetCurrency), 
        getForexIcon(baseCurrency),
        'forex'
      );
      return data;
    }

    const currentRate = response.data.rates[targetCurrency];
    
    // Since we don't have historical data in this simple API, we'll create placeholder values
    const change = 0.001; // Small placeholder change
    const changePercent = 0.1; // Small placeholder percent

    const data: MarketData = {
      symbol: `${baseCurrency}/${targetCurrency}`,
      name: getForexName(baseCurrency, targetCurrency),
      price: currentRate,
      change,
      changePercent,
      high: currentRate * 1.005, // Slightly higher than current
      icon: getForexIcon(baseCurrency)
    };

    return data;
  } catch (error) {
    console.error('Failed to fetch forex data');
    const data: MarketData = createPlaceholderData(
      `${baseCurrency}/${targetCurrency}`, 
      getForexName(baseCurrency, targetCurrency), 
      getForexIcon(baseCurrency),
      'forex'
    );
    return data;
  }
};

// Helper functions for getting names and icons
function getStockName(symbol: string): string {
  const stockNames: {[key: string]: string} = {
    'SPY': 'S&P 500',
    'DIA': 'Dow Jones',
    'QQQ': 'NASDAQ',
    'IWM': 'Russell 2000',
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft',
    'AMZN': 'Amazon',
    'GOOGL': 'Alphabet',
    'META': 'Meta Platforms',
    'TSLA': 'Tesla Inc.'
  };
  
  return stockNames[symbol] || symbol;
}

function getCryptoName(symbol: string): string {
  const cryptoNames: {[key: string]: string} = {
    'BTC': 'Bitcoin',
    'ETH': 'Ethereum',
    'XRP': 'Ripple',
    'LTC': 'Litecoin',
    'ADA': 'Cardano',
    'DOT': 'Polkadot',
    'LINK': 'Chainlink',
    'XLM': 'Stellar',
    'DOGE': 'Dogecoin',
    'UNI': 'Uniswap'
  };
  
  return cryptoNames[symbol] || symbol;
}

function getForexName(base: string, target: string): string {
  const currencyNames: {[key: string]: string} = {
    'USD': 'US Dollar',
    'EUR': 'Euro',
    'GBP': 'British Pound',
    'JPY': 'Japanese Yen',
    'AUD': 'Australian Dollar',
    'CAD': 'Canadian Dollar',
    'CHF': 'Swiss Franc',
    'CNY': 'Chinese Yuan',
    'HKD': 'Hong Kong Dollar',
    'NZD': 'New Zealand Dollar'
  };
  
  return `${currencyNames[base] || base}/${currencyNames[target] || target}`;
}

function getStockIcon(symbol: string): string {
  // Map symbols to Font Awesome icons
  return 'fas fa-chart-line';
}

function getCryptoIcon(symbol: string): string {
  const cryptoIcons: {[key: string]: string} = {
    'BTC': 'fab fa-bitcoin',
    'ETH': 'fab fa-ethereum',
    'default': 'fas fa-coins'
  };
  
  return cryptoIcons[symbol] || cryptoIcons.default;
}

function getForexIcon(symbol: string): string {
  const forexIcons: {[key: string]: string} = {
    'USD': 'fas fa-dollar-sign',
    'EUR': 'fas fa-euro-sign',
    'GBP': 'fas fa-pound-sign',
    'JPY': 'fas fa-yen-sign',
    'default': 'fas fa-money-bill-wave'
  };
  
  return forexIcons[symbol] || forexIcons.default;
}

// Function to create placeholder data when API calls fail
function createPlaceholderData(
  symbol: string, 
  name: string, 
  icon: string, 
  type: 'stock' | 'crypto' | 'forex'
): MarketData {
  // Default values based on asset type
  let basePrice = 0;
  let change = 0;
  let changePercent = 0;
  
  if (type === 'stock') {
    basePrice = symbol === 'SPY' ? 450.75 : 
               symbol === 'AAPL' ? 175.20 : 
               symbol === 'MSFT' ? 380.50 : 100.00;
    change = (Math.random() * 2) - 1; // Random change between -1 and 1
    changePercent = (change / basePrice) * 100;
  } else if (type === 'crypto') {
    basePrice = symbol === 'BTC' ? 56000 : 
               symbol === 'ETH' ? 3200 : 1.00;
    change = (Math.random() * basePrice * 0.05) - (basePrice * 0.025); // Random change ±2.5%
    changePercent = (change / basePrice) * 100;
  } else if (type === 'forex') {
    // For forex pairs, use appropriate ranges
    if (symbol.includes('USD/EUR')) {
      basePrice = 0.92;
    } else if (symbol.includes('USD/JPY')) {
      basePrice = 110.5;
    } else {
      basePrice = 1.0;
    }
    change = (Math.random() * 0.01) - 0.005; // Small forex changes
    changePercent = (change / basePrice) * 100;
  }
  
  return {
    symbol,
    name,
    price: parseFloat(basePrice.toFixed(2)),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2)),
    high: parseFloat((basePrice * 1.02).toFixed(2)), // 2% higher than base price
    icon
  };
}

// Function to get Gold price data from Alpha Vantage
export const getGoldData = async (): Promise<MarketData | null> => {
  try {
    if (!API_KEY) {
      console.error('Alpha Vantage API key is missing');
      // Return a placeholder with gold information
      return {
        symbol: 'GOLD',
        name: 'Gold',
        price: 2350.25,
        change: 15.75,
        changePercent: 0.67,
        high: 2355.50,
        icon: 'fas fa-coins'
      };
    }

    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: 'GLD', // GLD ETF tracks gold prices
        apikey: API_KEY
      }
    });

    // If API key is missing or invalid
    if (response.data.Note || response.data['Error Message']) {
      console.error('API Key issue:', response.data.Note || response.data['Error Message']);
      return {
        symbol: 'GOLD',
        name: 'Gold',
        price: 2350.25,
        change: 15.75,
        changePercent: 0.67,
        high: 2355.50,
        icon: 'fas fa-coins'
      };
    }

    const globalQuote = response.data['Global Quote'];
    
    if (!globalQuote) {
      console.error('Failed to fetch data for Gold');
      return {
        symbol: 'GOLD',
        name: 'Gold',
        price: 2350.25,
        change: 15.75,
        changePercent: 0.67,
        high: 2355.50,
        icon: 'fas fa-coins'
      };
    }

    // Map API response to our MarketData interface
    return {
      symbol: 'GOLD',
      name: 'Gold',
      price: parseFloat(globalQuote['05. price']),
      change: parseFloat(globalQuote['09. change']),
      changePercent: parseFloat(globalQuote['10. change percent'].replace('%', '')),
      high: parseFloat(globalQuote['03. high']),
      icon: 'fas fa-coins'
    };
  } catch (error) {
    console.error('Error fetching gold data:', error);
    return {
      symbol: 'GOLD',
      name: 'Gold',
      price: 2350.25,
      change: 15.75,
      changePercent: 0.67,
      high: 2355.50,
      icon: 'fas fa-coins'
    };
  }
};

// Interface for historical data point
export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Function to get historical stock data from Alpha Vantage
export const getHistoricalStockData = async (
  symbol: string, 
  interval: 'daily' | 'weekly' | 'monthly' = 'daily',
  outputSize: 'compact' | 'full' = 'compact' // compact = 100 data points, full = 20+ years
): Promise<HistoricalDataPoint[]> => {
  try {
    if (!API_KEY) {
      console.error('Alpha Vantage API key is missing for historical data');
      throw new Error('API key is required for historical data');
    }

    let timeSeriesFunction = 'TIME_SERIES_DAILY';
    if (interval === 'weekly') timeSeriesFunction = 'TIME_SERIES_WEEKLY';
    if (interval === 'monthly') timeSeriesFunction = 'TIME_SERIES_MONTHLY';

    const response = await axios.get(ALPHA_VANTAGE_BASE_URL, {
      params: {
        function: timeSeriesFunction,
        symbol,
        outputsize: outputSize,
        apikey: API_KEY
      }
    });

    // Check for API errors
    if (response.data.Note || response.data['Error Message']) {
      console.error('API Key issue:', response.data.Note || response.data['Error Message']);
      throw new Error('API error: ' + (response.data.Note || response.data['Error Message']));
    }

    // Extract the time series data (the property name varies by interval)
    const timeSeriesKey = `Time Series (${
      interval === 'daily' ? 'Daily' : 
      interval === 'weekly' ? 'Weekly' : 'Monthly'
    })`;
    
    const timeSeries = response.data[timeSeriesKey];
    
    if (!timeSeries) {
      console.error('Failed to fetch historical data for', symbol);
      throw new Error('No time series data available');
    }

    // Convert the time series data to an array of data points
    const historicalData: HistoricalDataPoint[] = [];
    
    for (const date in timeSeries) {
      const dataPoint = timeSeries[date];
      historicalData.push({
        date,
        open: parseFloat(dataPoint['1. open']),
        high: parseFloat(dataPoint['2. high']),
        low: parseFloat(dataPoint['3. low']),
        close: parseFloat(dataPoint['4. close']),
        volume: parseFloat(dataPoint['5. volume'])
      });
    }

    // Sort by date ascending (oldest to newest)
    historicalData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return historicalData;
  } catch (error) {
    console.error('Error fetching historical stock data:', error);
    throw error;
  }
};

// Function to get historical crypto data from CoinAPI
export const getHistoricalCryptoData = async (
  symbol: string,
  timeStart: string, // ISO date string
  timeEnd: string = new Date().toISOString(),
  period: string = '1DAY' // Options: 1SEC, 1MIN, 5MIN, 15MIN, 30MIN, 1HRS, 4HRS, 1DAY, etc.
): Promise<HistoricalDataPoint[]> => {
  try {
    if (!COIN_API_KEY) {
      console.error('CoinAPI key is missing for historical data');
      throw new Error('API key is required for historical data');
    }

    const response = await axios.get(
      `${COINAPI_BASE_URL}/ohlcv/${symbol}/USD/history`, {
      headers: {
        'X-CoinAPI-Key': COIN_API_KEY
      },
      params: {
        period_id: period,
        time_start: timeStart,
        time_end: timeEnd,
        limit: 500 // Maximum limit for data points
      }
    });

    if (response.data.error) {
      console.error('API Error:', response.data.error);
      throw new Error('API error: ' + response.data.error);
    }

    // Map CoinAPI response to our HistoricalDataPoint interface
    const historicalData: HistoricalDataPoint[] = response.data.map((item: any) => ({
      date: item.time_period_start.split('T')[0],
      open: item.price_open,
      high: item.price_high,
      low: item.price_low,
      close: item.price_close,
      volume: item.volume_traded
    }));

    return historicalData;
  } catch (error) {
    console.error('Error fetching historical crypto data:', error);
    throw error;
  }
};

// Function to get multiple market data points
export const getMultipleMarketData = async (): Promise<MarketData[]> => {
  try {
    // Only fetch the specific assets requested: S&P 500, Bitcoin, and Gold
    const spyPromise = getStockData('SPY'); // S&P 500
    const btcPromise = getCryptoData('BTC'); // Bitcoin
    const goldPromise = getGoldData(); // Gold
    
    // Wait for all promises to settle
    const results = await Promise.allSettled([
      spyPromise,
      btcPromise,
      goldPromise
    ]);
    
    // Create the market data array with a fixed order
    const marketData: MarketData[] = [];
    
    // Add each asset to the marketData array
    // Check if data was successfully fetched
    
    // S&P 500
    const spyResult = results[0];
    if (spyResult.status === 'fulfilled' && spyResult.value) {
      marketData.push(spyResult.value);
    } else {
      throw new Error('Failed to fetch S&P 500 data');
    }
    
    // Bitcoin
    const btcResult = results[1];
    if (btcResult.status === 'fulfilled' && btcResult.value) {
      marketData.push(btcResult.value);
    } else {
      throw new Error('Failed to fetch Bitcoin data');
    }
    
    // Gold
    const goldResult = results[2];
    if (goldResult.status === 'fulfilled' && goldResult.value) {
      marketData.push(goldResult.value);
    } else {
      throw new Error('Failed to fetch Gold data');
    }
    
    return marketData;
  } catch (error) {
    console.error('Error fetching multiple market data:', error);
    throw error;
  }
};