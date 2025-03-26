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

// We need to ask the user to set up their API key for Alpha Vantage
// This will be stored in environment variables
const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || '';

// Function to get stock data from Alpha Vantage
export const getStockData = async (symbol: string): Promise<MarketData | null> => {
  try {
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
      return null;
    }

    const globalQuote = response.data['Global Quote'];
    
    if (!globalQuote) {
      console.error('Failed to fetch data for', symbol);
      return null;
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
    return null;
  }
};

// For cryptocurrency data
const COINAPI_BASE_URL = 'https://rest.coinapi.io/v1';
const COIN_API_KEY = import.meta.env.VITE_COINAPI_KEY || '';

export const getCryptoData = async (symbol: string): Promise<MarketData | null> => {
  try {
    const response = await axios.get(`${COINAPI_BASE_URL}/exchangerate/${symbol}/USD`, {
      headers: {
        'X-CoinAPI-Key': COIN_API_KEY
      }
    });

    if (response.data.error) {
      console.error('API Error:', response.data.error);
      return null;
    }

    // For the high value, we can make another call or use a placeholder
    const highResponse = await axios.get(`${COINAPI_BASE_URL}/ohlcv/${symbol}/USD/latest?period_id=1DAY`, {
      headers: {
        'X-CoinAPI-Key': COIN_API_KEY
      }
    });

    const data: MarketData = {
      symbol,
      name: getCryptoName(symbol),
      price: response.data.rate,
      change: 0, // API doesn't provide change directly
      changePercent: 0, // We'd need to calculate this from historical data
      high: highResponse.data[0]?.price_high || response.data.rate,
      icon: getCryptoIcon(symbol)
    };

    // If we need historical data to calculate change, make additional API call
    // This would be implemented based on the API's capabilities

    return data;
  } catch (error) {
    console.error('Error fetching crypto data:', error);
    return null;
  }
};

// For forex data
const FOREX_API_BASE_URL = 'https://api.exchangerate.host/latest';

export const getForexData = async (baseCurrency: string, targetCurrency: string): Promise<MarketData | null> => {
  try {
    const response = await axios.get(FOREX_API_BASE_URL, {
      params: {
        base: baseCurrency,
        symbols: targetCurrency
      }
    });

    if (!response.data.rates || !response.data.rates[targetCurrency]) {
      console.error('Failed to fetch forex data');
      return null;
    }

    const currentRate = response.data.rates[targetCurrency];
    
    // To get historical data for calculating change, we need another API call
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const historicalResponse = await axios.get(`https://api.exchangerate.host/${yesterdayStr}`, {
      params: {
        base: baseCurrency,
        symbols: targetCurrency
      }
    });

    const yesterdayRate = historicalResponse.data.rates[targetCurrency];
    const change = currentRate - yesterdayRate;
    const changePercent = (change / yesterdayRate) * 100;

    const data: MarketData = {
      symbol: `${baseCurrency}/${targetCurrency}`,
      name: getForexName(baseCurrency, targetCurrency),
      price: currentRate,
      change,
      changePercent,
      high: Math.max(currentRate, yesterdayRate), // Simple high calculation
      icon: getForexIcon(baseCurrency)
    };

    return data;
  } catch (error) {
    console.error('Error fetching forex data:', error);
    return null;
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

// Function to get multiple market data points
export const getMultipleMarketData = async (): Promise<MarketData[]> => {
  try {
    // Define the assets we want to fetch
    const stockSymbols = ['SPY', 'AAPL', 'MSFT'];
    const cryptoSymbols = ['BTC', 'ETH'];
    const forexPairs = [
      { base: 'USD', target: 'EUR' },
      { base: 'USD', target: 'JPY' }
    ];
    
    // Create promises for all the data fetching
    const stockPromises = stockSymbols.map(symbol => getStockData(symbol));
    const cryptoPromises = cryptoSymbols.map(symbol => getCryptoData(symbol));
    const forexPromises = forexPairs.map(pair => getForexData(pair.base, pair.target));
    
    // Wait for all promises to settle
    const results = await Promise.allSettled([
      ...stockPromises,
      ...cryptoPromises,
      ...forexPromises
    ]);
    
    // Filter out the fulfilled promises and their values
    const marketData = results
      .filter((result): result is PromiseFulfilledResult<MarketData | null> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value as MarketData);
    
    return marketData;
  } catch (error) {
    console.error('Error fetching multiple market data:', error);
    return [];
  }
};