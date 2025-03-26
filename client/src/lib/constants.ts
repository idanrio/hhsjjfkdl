export const features = [
  {
    icon: 'fas fa-graduation-cap',
    title: 'Expert-Led Education',
    description: 'Learn from industry professionals with years of experience in financial markets and trading strategies.'
  },
  {
    icon: 'fas fa-chart-line',
    title: 'Advanced Analytics',
    description: 'Access powerful technical analysis tools and real-time market data to inform your trading decisions.'
  },
  {
    icon: 'fas fa-users',
    title: 'Community Support',
    description: 'Join a thriving community of traders sharing insights, strategies, and support on your trading journey.'
  },
  {
    icon: 'fas fa-robot',
    title: 'Trading Simulations',
    description: 'Practice trading in a risk-free environment with our advanced market simulation technology.'
  },
  {
    icon: 'fas fa-mobile-alt',
    title: 'Mobile Access',
    description: 'Access your courses and market data on any device with our fully responsive platform.'
  },
  {
    icon: 'fas fa-certificate',
    title: 'Certification Programs',
    description: 'Earn industry-recognized certifications to validate your trading knowledge and expertise.'
  }
];

export const markets = [
  {
    name: 'S&P 500',
    icon: 'fas fa-chart-line',
    change: '+87.75',
    changePercentage: '+2.14%',
    currentValue: '4,175.48',
    highValue: '4,193.80',
    trend: 'positive' as const
  },
  {
    name: 'USD/EUR',
    icon: 'fas fa-dollar-sign',
    change: '-0.0070',
    changePercentage: '-0.75%',
    currentValue: '0.9287',
    highValue: '0.9351',
    trend: 'negative' as const
  },
  {
    name: 'Bitcoin',
    icon: 'fab fa-btc',
    change: '+2,017.89',
    changePercentage: '+3.27%',
    currentValue: '63,475.92',
    highValue: '63,890.15',
    trend: 'positive' as const
  }
];
