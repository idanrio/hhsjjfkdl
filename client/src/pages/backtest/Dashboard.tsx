import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Trade, TradingPair, StrategyType } from "@shared/schema";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { Plus, Download, TrendingUp, Filter, ChevronLeft, Presentation } from "lucide-react";
import IntegratedTradingEnvironment from "@/components/IntegratedTradingEnvironment";

export default function BacktestDashboard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [tradingEnvironmentOpen, setTradingEnvironmentOpen] = useState<boolean>(false);
  const [fullScreenMode, setFullScreenMode] = useState<boolean>(false);

  // Fetch user data
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Fetch trades
  const { data: trades, isLoading: tradesLoading } = useQuery({
    queryKey: ["/api/trades"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!userData
  });

  // Fetch metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/metrics/trades"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!userData
  });

  // Fetch trading pairs
  const { data: tradingPairs } = useQuery({
    queryKey: ["/api/trading-pairs"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Fetch strategy types
  const { data: strategyTypes } = useQuery({
    queryKey: ["/api/strategy-types"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Prepare trades data for charts
  const tradeChartData = trades?.map((trade: Trade) => {
    const isLong = trade.tradeType === 'long';
    const entryPrice = parseFloat(trade.entryPrice);
    const exitPrice = trade.exitPrice ? parseFloat(trade.exitPrice) : null;
    const amount = parseFloat(trade.amount);
    
    const profitLoss = exitPrice && (isLong ? 
      (exitPrice - entryPrice) * amount : 
      (entryPrice - exitPrice) * amount);
    
    const profitLossPercentage = exitPrice && (isLong ? 
      ((exitPrice - entryPrice) / entryPrice) * 100 : 
      ((entryPrice - exitPrice) / entryPrice) * 100);
    
    return {
      id: trade.id,
      date: new Date(trade.date).toLocaleDateString(),
      pair: trade.pair,
      type: trade.tradeType,
      entryPrice: entryPrice,
      exitPrice: exitPrice,
      profitLoss: profitLoss || 0,
      profitLossPercentage: profitLossPercentage || 0,
      status: trade.status
    };
  }) || [];

  // If user is not logged in, show login page
  if (!userLoading && !userData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md bg-card">
            <CardHeader>
              <CardTitle className="text-center text-brand-primary">{t("Please log in")}</CardTitle>
              <CardDescription className="text-center">
                {t("You need to log in to access the backtesting dashboard")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <Link href="/" className="w-full">
                  <Button className="w-full">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {t("Back to Home")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-brand-primary">{t("Backtesting Dashboard")}</h1>
          <p className="text-muted-foreground">
            {t("Welcome back")}, {userData?.username} • {t("Level")}: {userData?.level}
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/backtest/new-trade">
            <Button className="bg-brand-primary hover-glow-primary">
              <Plus className="mr-2 h-4 w-4" />
              {t("New Trade")}
            </Button>
          </Link>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t("Export Data")}
          </Button>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("Total Trades")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? "..." : metrics?.totalTrades || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metricsLoading ? "..." : `${metrics?.activeTrades || 0} ${t("active")}`}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("Win Rate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? "..." : `${(metrics?.winRate || 0).toFixed(1)}%`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metricsLoading ? "..." : `${metrics?.completedTrades || 0} ${t("completed trades")}`}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("Total P/L")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(metrics?.totalProfitLoss || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
              {metricsLoading ? "..." : `$${(metrics?.totalProfitLoss || 0).toFixed(2)}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("All time")}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("User Level")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userLoading ? "..." : userData?.level || 1}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("Keep trading to level up")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-brand-primary/10 border">
          <TabsTrigger value="overview">{t("Overview")}</TabsTrigger>
          <TabsTrigger value="trades">{t("Trades")}</TabsTrigger>
          <TabsTrigger value="analytics">{t("Analytics")}</TabsTrigger>
          <TabsTrigger value="settings">{t("Settings")}</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profit/Loss Chart */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>{t("Profit/Loss")}</CardTitle>
                <CardDescription>{t("Your trading performance over time")}</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {tradesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p>{t("Loading chart data...")}</p>
                  </div>
                ) : tradeChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={tradeChartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="profitLoss" 
                        name={t("Profit/Loss")} 
                        fill="#22a1e2" 
                        fillOpacity={0.8}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-center text-muted-foreground">
                      {t("No trading data available yet")}
                    </p>
                    <p className="text-center text-muted-foreground text-sm mb-4">
                      {t("Add your first trade to see analytics")}
                    </p>
                    <Link href="/backtest/new-trade">
                      <Button size="sm" className="bg-brand-primary hover-glow-primary">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("Add Trade")}
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Trades List */}
            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>{t("Recent Trades")}</CardTitle>
                  <CardDescription>{t("Your most recent trading activity")}</CardDescription>
                </div>
                <Link href="/backtest/trades">
                  <Button variant="outline" size="sm">{t("View All")}</Button>
                </Link>
              </CardHeader>
              <CardContent>
                {tradesLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <p>{t("Loading trades...")}</p>
                  </div>
                ) : trades && trades.length > 0 ? (
                  <div className="space-y-4">
                    {trades.slice(0, 5).map((trade: Trade) => {
                      const isLong = trade.tradeType === 'long';
                      const isActive = trade.status === 'active';
                      const entryPrice = parseFloat(trade.entryPrice);
                      const exitPrice = trade.exitPrice ? parseFloat(trade.exitPrice) : null;
                      const profitLoss = exitPrice && (isLong ? 
                        (exitPrice - entryPrice) * parseFloat(trade.amount) : 
                        (entryPrice - exitPrice) * parseFloat(trade.amount));
                      
                      const isProfit = profitLoss ? profitLoss > 0 : false;
                      
                      return (
                        <div key={trade.id} className="border rounded-lg p-3 hover:bg-card/60">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-yellow-500' : (isProfit ? 'bg-success' : 'bg-danger')}`} />
                              <span className="font-medium">{trade.pair}</span>
                            </div>
                            <div className={`text-sm font-medium ${isActive ? 'text-yellow-500' : (isProfit ? 'text-success' : 'text-danger')}`}>
                              {isActive ? t("Active") : (isProfit ? `+$${profitLoss.toFixed(2)}` : `-$${Math.abs(profitLoss).toFixed(2)}`)}
                            </div>
                          </div>
                          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                            <span>{isLong ? t("Long") : t("Short")} @ ${entryPrice}</span>
                            <span>{new Date(trade.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64">
                    <p className="text-muted-foreground mb-2">
                      {t("No trades recorded yet")}
                    </p>
                    <Link href="/backtest/new-trade">
                      <Button size="sm" className="bg-brand-primary hover-glow-primary">
                        <Plus className="mr-2 h-4 w-4" />
                        {t("Add Trade")}
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Trades Tab */}
        <TabsContent value="trades">
          <Card className="bg-card">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>{t("Your Trades")}</CardTitle>
                  <CardDescription>
                    {t("Manage and analyze your trading history")}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    {t("Filter")}
                  </Button>
                  <Link href="/backtest/new-trade">
                    <Button size="sm" className="bg-brand-primary hover-glow-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      {t("Add Trade")}
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tradesLoading ? (
                <div className="flex items-center justify-center h-64">
                  <p>{t("Loading trades...")}</p>
                </div>
              ) : trades && trades.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">{t("Pair")}</th>
                        <th className="text-left py-3 px-4">{t("Type")}</th>
                        <th className="text-left py-3 px-4">{t("Entry Price")}</th>
                        <th className="text-left py-3 px-4">{t("Exit Price")}</th>
                        <th className="text-left py-3 px-4">{t("Amount")}</th>
                        <th className="text-left py-3 px-4">{t("P/L")}</th>
                        <th className="text-left py-3 px-4">{t("Status")}</th>
                        <th className="text-left py-3 px-4">{t("Date")}</th>
                        <th className="text-right py-3 px-4">{t("Actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trades.map((trade: Trade) => {
                        const isLong = trade.tradeType === 'long';
                        const isActive = trade.status === 'active';
                        const entryPrice = parseFloat(trade.entryPrice);
                        const exitPrice = trade.exitPrice ? parseFloat(trade.exitPrice) : null;
                        const profitLoss = exitPrice && (isLong ? 
                          (exitPrice - entryPrice) * parseFloat(trade.amount) : 
                          (entryPrice - exitPrice) * parseFloat(trade.amount));
                        
                        const isProfit = profitLoss ? profitLoss > 0 : false;
                        
                        return (
                          <tr key={trade.id} className="border-b hover:bg-card/60">
                            <td className="py-3 px-4 font-medium">{trade.pair}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs ${isLong ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>
                                {isLong ? t("Long") : t("Short")}
                              </span>
                            </td>
                            <td className="py-3 px-4">${entryPrice}</td>
                            <td className="py-3 px-4">{exitPrice ? `$${exitPrice}` : '-'}</td>
                            <td className="py-3 px-4">{trade.amount}</td>
                            <td className={`py-3 px-4 ${isActive ? '' : (isProfit ? 'text-success' : 'text-danger')}`}>
                              {isActive ? '-' : (isProfit ? `+$${profitLoss.toFixed(2)}` : `-$${Math.abs(profitLoss).toFixed(2)}`)}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs ${isActive ? 'bg-yellow-500/20 text-yellow-500' : 'bg-muted/20 text-muted-foreground'}`}>
                                {isActive ? t("Active") : t("Completed")}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground text-sm">
                              {new Date(trade.date).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Link href={`/backtest/trades/${trade.id}`}>
                                <Button variant="ghost" size="sm">
                                  {t("View")}
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64">
                  <p className="text-muted-foreground mb-2">
                    {t("No trades recorded yet")}
                  </p>
                  <Link href="/backtest/new-trade">
                    <Button size="sm" className="bg-brand-primary hover-glow-primary">
                      <Plus className="mr-2 h-4 w-4" />
                      {t("Add Trade")}
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics">
          {tradingEnvironmentOpen ? (
            <IntegratedTradingEnvironment 
              onClose={() => setTradingEnvironmentOpen(false)}
              fullScreen={fullScreenMode}
              onSaveTrade={(trade) => {
                // Create a trade with the data from the trading environment
                const saveTrade = async () => {
                  try {
                    const response = await apiRequest('/api/trades', {
                      method: 'POST',
                      body: JSON.stringify(trade),
                    });
                    
                    if (response.ok) {
                      toast({
                        title: t("Trade saved"),
                        description: t("Your trade has been saved successfully"),
                      });
                    }
                  } catch (error) {
                    toast({
                      title: t("Error"),
                      description: t("Failed to save trade"),
                      variant: "destructive",
                    });
                  }
                };
                
                if (!fullScreenMode) {
                  saveTrade();
                }
              }}
            />
          ) : (
            <div className="space-y-6">
              {/* Trading Environment Launch Card */}
              <Card className="bg-card border-2 border-brand-primary/20 hover:border-brand-primary/50 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="bg-brand-primary/10 p-4 rounded-full">
                        <Presentation className="h-8 w-8 text-brand-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{t("Interactive Trading Environment")}</h3>
                        <p className="text-muted-foreground">
                          {t("Practice trading in our professional backtesting environment")}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="border-brand-primary text-brand-primary hover:bg-brand-primary/10"
                        onClick={() => {
                          setTradingEnvironmentOpen(true);
                          setFullScreenMode(true);
                        }}
                      >
                        {t("Full Screen")}
                      </Button>
                      <Button 
                        className="bg-brand-primary hover-glow-primary"
                        onClick={() => {
                          setTradingEnvironmentOpen(true);
                          setFullScreenMode(false);
                        }}
                      >
                        {t("Open Trading Environment")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card">
                <CardHeader>
                  <CardTitle>{t("Trading Analytics")}</CardTitle>
                  <CardDescription>
                    {t("Detailed analysis of your trading performance")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tradesLoading || trades?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64">
                      <p className="text-muted-foreground mb-2">
                        {tradesLoading ? t("Loading analytics...") : t("Not enough trading data for analytics")}
                      </p>
                      {!tradesLoading && trades?.length === 0 && (
                        <Link href="/backtest/new-trade">
                          <Button size="sm" className="bg-brand-primary hover-glow-primary">
                            <Plus className="mr-2 h-4 w-4" />
                            {t("Add Trade")}
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Performance by Pair */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">{t("Performance by Trading Pair")}</h3>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={tradingPairs?.map((pair: TradingPair) => {
                                const pairTrades = trades?.filter((t: Trade) => t.pair === pair.pair) || [];
                                const completedTrades = pairTrades.filter(t => t.status === 'completed' && t.exitPrice);
                                const totalProfitLoss = completedTrades.reduce((total, trade) => {
                                  const isLong = trade.tradeType === 'long';
                                  const entryPrice = parseFloat(trade.entryPrice);
                                  const exitPrice = parseFloat(trade.exitPrice!);
                                  const amount = parseFloat(trade.amount);
                                  
                                  const profitLoss = isLong ? 
                                    (exitPrice - entryPrice) * amount : 
                                    (entryPrice - exitPrice) * amount;
                                  
                                  return total + profitLoss;
                                }, 0);
                                
                                return {
                                  pair: pair.pair,
                                  totalProfitLoss,
                                  tradesCount: pairTrades.length
                                };
                              })}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="pair" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar 
                                dataKey="totalProfitLoss" 
                                name={t("Total P/L")} 
                                fill="#22a1e2" 
                                fillOpacity={0.8}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      {/* Performance by Strategy */}
                      <div>
                        <h3 className="text-lg font-medium mb-4">{t("Performance by Strategy")}</h3>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={strategyTypes?.map((strategy: StrategyType) => {
                                const strategyTrades = trades?.filter((t: Trade) => t.strategy === strategy.name) || [];
                                const completedTrades = strategyTrades.filter(t => t.status === 'completed' && t.exitPrice);
                                const totalProfitLoss = completedTrades.reduce((total, trade) => {
                                  const isLong = trade.tradeType === 'long';
                                  const entryPrice = parseFloat(trade.entryPrice);
                                  const exitPrice = parseFloat(trade.exitPrice!);
                                  const amount = parseFloat(trade.amount);
                                  
                                  const profitLoss = isLong ? 
                                    (exitPrice - entryPrice) * amount : 
                                    (entryPrice - exitPrice) * amount;
                                  
                                  return total + profitLoss;
                                }, 0);
                                
                                return {
                                  strategy: strategy.name,
                                  totalProfitLoss,
                                  tradesCount: strategyTrades.length
                                };
                              })}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="strategy" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar 
                                dataKey="totalProfitLoss" 
                                name={t("Total P/L")} 
                                fill="#22a1e2" 
                                fillOpacity={0.8}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>{t("Settings")}</CardTitle>
              <CardDescription>
                {t("Manage your account and preferences")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Profile Settings */}
                <div>
                  <h3 className="text-lg font-medium mb-4">{t("Profile Settings")}</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium block mb-1">{t("Username")}</label>
                        <div className="p-2 border rounded bg-muted/10">
                          {userData?.username}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-1">{t("Email")}</label>
                        <div className="p-2 border rounded bg-muted/10">
                          {userData?.email || t("No email provided")}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium block mb-1">{t("Bio")}</label>
                      <div className="p-2 border rounded bg-muted/10 min-h-[60px]">
                        {userData?.bio || t("No bio provided")}
                      </div>
                    </div>
                    <Button className="bg-brand-primary hover-glow-primary">{t("Edit Profile")}</Button>
                  </div>
                </div>
                
                <Separator />
                
                {/* Risk Tolerance */}
                <div>
                  <h3 className="text-lg font-medium mb-4">{t("Risk Tolerance")}</h3>
                  <div className="space-y-4">
                    <div className="p-2 border rounded bg-muted/10">
                      {userData?.riskTolerance || t("Not set")}
                    </div>
                    <Button variant="outline">{t("Update Risk Tolerance")}</Button>
                  </div>
                </div>
                
                <Separator />
                
                {/* Trading Preferences */}
                <div>
                  <h3 className="text-lg font-medium mb-4">{t("Trading Preferences")}</h3>
                  <div className="space-y-4">
                    <Button variant="outline">{t("Manage Preferred Trading Pairs")}</Button>
                    <Button variant="outline">{t("Manage Strategy Templates")}</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}