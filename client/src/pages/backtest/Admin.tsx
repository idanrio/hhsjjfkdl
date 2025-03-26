import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Trade, TradingPair, StrategyType, User } from "@shared/schema";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { 
  Plus, 
  Download, 
  TrendingUp, 
  Filter, 
  ChevronLeft, 
  Users, 
  Activity, 
  LineChart as LineChartIcon,
  Settings,
  Trash,
  Edit,
  Lock,
  Search,
  LayoutPanelTop,
  ArrowUp,
  ArrowDown,
  AlertTriangle
} from "lucide-react";

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [newTradingPair, setNewTradingPair] = useState("");
  const [newStrategyType, setNewStrategyType] = useState("");

  // Fetch user data (for admin check)
  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Fetch all users (admin only)
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!userData && userData.isAdmin
  });

  // Fetch all trades (admin view)
  const { data: allTrades, isLoading: allTradesLoading } = useQuery({
    queryKey: ["/api/admin/trades"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!userData && userData.isAdmin
  });

  // Fetch trading pairs
  const { data: tradingPairs, isLoading: tradingPairsLoading } = useQuery({
    queryKey: ["/api/trading-pairs"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!userData && userData.isAdmin
  });

  // Fetch strategy types
  const { data: strategyTypes, isLoading: strategyTypesLoading } = useQuery({
    queryKey: ["/api/strategy-types"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!userData && userData.isAdmin
  });

  // Mutations
  const deleteTradingPairMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/trading-pairs/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading-pairs'] });
      toast({
        title: t("Success"),
        description: t("Trading pair deleted successfully"),
      });
    },
    onError: (error) => {
      toast({
        title: t("Error"),
        description: t("Failed to delete trading pair"),
        variant: "destructive",
      });
    }
  });

  const addTradingPairMutation = useMutation({
    mutationFn: (pairData: { pair: string }) => 
      apiRequest('/api/trading-pairs', { method: "POST", data: pairData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trading-pairs'] });
      setNewTradingPair("");
      toast({
        title: t("Success"),
        description: t("Trading pair added successfully"),
      });
    },
    onError: (error) => {
      toast({
        title: t("Error"),
        description: t("Failed to add trading pair"),
        variant: "destructive",
      });
    }
  });

  const deleteStrategyTypeMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/strategy-types/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strategy-types'] });
      toast({
        title: t("Success"),
        description: t("Strategy type deleted successfully"),
      });
    },
    onError: (error) => {
      toast({
        title: t("Error"),
        description: t("Failed to delete strategy type"),
        variant: "destructive",
      });
    }
  });

  const addStrategyTypeMutation = useMutation({
    mutationFn: (strategyData: { name: string }) => 
      apiRequest('/api/strategy-types', { method: "POST", data: strategyData }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/strategy-types'] });
      setNewStrategyType("");
      toast({
        title: t("Success"),
        description: t("Strategy type added successfully"),
      });
    },
    onError: (error) => {
      toast({
        title: t("Error"),
        description: t("Failed to add strategy type"),
        variant: "destructive",
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => 
      apiRequest(`/api/admin/users/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setShowDeleteConfirm(false);
      setUserToDelete(null);
      toast({
        title: t("Success"),
        description: t("User deleted successfully"),
      });
    },
    onError: (error) => {
      toast({
        title: t("Error"),
        description: t("Failed to delete user"),
        variant: "destructive",
      });
    }
  });

  const updateUserLevelMutation = useMutation({
    mutationFn: (userId: number) => 
      apiRequest(`/api/admin/users/${userId}/level-up`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: t("Success"),
        description: t("User level updated successfully"),
      });
    },
    onError: (error) => {
      toast({
        title: t("Error"),
        description: t("Failed to update user level"),
        variant: "destructive",
      });
    }
  });

  // Filter users by search term
  const filteredUsers = users?.filter((user: User) => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  // Compute stats
  const stats = {
    totalUsers: users?.length || 0,
    activeUsers: users?.filter((user: User) => user.lastLogin && new Date(user.lastLogin) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length || 0,
    totalTrades: allTrades?.length || 0,
    activeTrades: allTrades?.filter((trade: Trade) => trade.status === 'active').length || 0,
    completedTrades: allTrades?.filter((trade: Trade) => trade.status === 'completed').length || 0,
    tradingPairsCount: tradingPairs?.length || 0,
    strategyCount: strategyTypes?.length || 0
  };

  // Prepare data for charts
  const userLevelDistribution = users?.reduce((acc: {[key: string]: number}, user: User) => {
    const level = user.level || 1;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});

  const userLevelData = userLevelDistribution ? Object.keys(userLevelDistribution).map(level => ({
    level: `Level ${level}`,
    count: userLevelDistribution[level]
  })) : [];

  // Calculate trading activity by date
  const tradingActivity = allTrades?.reduce((acc: {[key: string]: number}, trade: Trade) => {
    const date = new Date(trade.date).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const tradingActivityData = tradingActivity ? Object.keys(tradingActivity).map(date => ({
    date,
    count: tradingActivity[date]
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : [];

  // Calculate trading pair distribution
  const tradingPairDistribution = allTrades?.reduce((acc: {[key: string]: number}, trade: Trade) => {
    acc[trade.pair] = (acc[trade.pair] || 0) + 1;
    return acc;
  }, {});

  const tradingPairData = tradingPairDistribution ? Object.keys(tradingPairDistribution).map(pair => ({
    pair,
    count: tradingPairDistribution[pair]
  })).sort((a, b) => b.count - a.count).slice(0, 5) : [];

  // If user is not admin, show access denied
  if (!userLoading && userData && !userData.isAdmin) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md bg-card">
            <CardHeader>
              <CardTitle className="text-center text-danger">{t("Access Denied")}</CardTitle>
              <CardDescription className="text-center">
                {t("You need administrator privileges to access this page")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <AlertTriangle className="text-warning h-16 w-16 mb-2" />
                <p className="text-center mb-4">{t("This area is restricted to administrators only")}</p>
                <Link href="/backtest/dashboard" className="w-full">
                  <Button className="w-full">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {t("Back to Dashboard")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If user is not logged in, show login page
  if (!userLoading && !userData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md bg-card">
            <CardHeader>
              <CardTitle className="text-center text-brand-primary">{t("Please log in")}</CardTitle>
              <CardDescription className="text-center">
                {t("You need to log in to access the admin dashboard")}
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
          <h1 className="text-3xl font-bold text-brand-primary">{t("Admin Dashboard")}</h1>
          <p className="text-muted-foreground">
            {t("Manage users, trades, and platform settings")}
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/backtest/dashboard">
            <Button variant="outline">
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t("Back to Dashboard")}
            </Button>
          </Link>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t("Export Reports")}
          </Button>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("Total Users")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersLoading ? "..." : stats.totalUsers}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {usersLoading ? "..." : `${stats.activeUsers} ${t("active in last 30 days")}`}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("Total Trades")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allTradesLoading ? "..." : stats.totalTrades}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {allTradesLoading ? "..." : `${stats.completedTrades} ${t("completed")}, ${stats.activeTrades} ${t("active")}`}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("Trading Pairs")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tradingPairsLoading ? "..." : stats.tradingPairsCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("Available trading pairs")}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("Strategies")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {strategyTypesLoading ? "..." : stats.strategyCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("Available strategy types")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-brand-primary/10 border">
          <TabsTrigger value="overview">
            <LayoutPanelTop className="h-4 w-4 mr-2" />
            {t("Overview")}
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            {t("User Management")}
          </TabsTrigger>
          <TabsTrigger value="trading">
            <Activity className="h-4 w-4 mr-2" />
            {t("Trading Data")}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            {t("Settings")}
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Level Distribution */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>{t("User Level Distribution")}</CardTitle>
                <CardDescription>{t("Number of users at each level")}</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {usersLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p>{t("Loading chart data...")}</p>
                  </div>
                ) : userLevelData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={userLevelData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="level" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="count" 
                        name={t("Users")} 
                        fill="#22a1e2" 
                        fillOpacity={0.8}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Users className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-center text-muted-foreground">
                      {t("No user data available")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Trading Activity */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>{t("Trading Activity")}</CardTitle>
                <CardDescription>{t("Number of trades over time")}</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {allTradesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p>{t("Loading chart data...")}</p>
                  </div>
                ) : tradingActivityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={tradingActivityData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        name={t("Trades")} 
                        stroke="#22a1e2" 
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Activity className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-center text-muted-foreground">
                      {t("No trading activity data available")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Trading Pairs */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>{t("Popular Trading Pairs")}</CardTitle>
                <CardDescription>{t("Most frequently traded pairs")}</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {allTradesLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <p>{t("Loading chart data...")}</p>
                  </div>
                ) : tradingPairData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tradingPairData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                        nameKey="pair"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {tradingPairData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`hsl(${(index * 40) % 360}, 70%, 50%)`} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <LineChartIcon className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-center text-muted-foreground">
                      {t("No trading pair data available")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="bg-card">
              <CardHeader>
                <CardTitle>{t("System Status")}</CardTitle>
                <CardDescription>{t("Platform health overview")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-success" />
                      <span>{t("API Services")}</span>
                    </div>
                    <span className="text-success">{t("Operational")}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-success" />
                      <span>{t("Database")}</span>
                    </div>
                    <span className="text-success">{t("Operational")}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-success" />
                      <span>{t("Authentication")}</span>
                    </div>
                    <span className="text-success">{t("Operational")}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-success" />
                      <span>{t("Market Data")}</span>
                    </div>
                    <span className="text-success">{t("Operational")}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <p className="text-xs text-muted-foreground">
                  {t("Last checked")}: {new Date().toLocaleString()}
                </p>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* User Management Tab */}
        <TabsContent value="users">
          <Card className="bg-card">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>{t("User Management")}</CardTitle>
                  <CardDescription>
                    {t("Manage user accounts and permissions")}
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={t("Search users...")}
                    className="pl-8 w-full md:w-[250px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="flex items-center justify-center h-64">
                  <p>{t("Loading users...")}</p>
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">{t("Username")}</th>
                        <th className="text-left py-3 px-4">{t("Email")}</th>
                        <th className="text-left py-3 px-4">{t("Level")}</th>
                        <th className="text-left py-3 px-4">{t("Status")}</th>
                        <th className="text-left py-3 px-4">{t("Last Login")}</th>
                        <th className="text-right py-3 px-4">{t("Actions")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user: User) => {
                        const isRecentlyActive = user.lastLogin && new Date(user.lastLogin) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                        
                        return (
                          <tr key={user.id} className="border-b hover:bg-card/60">
                            <td className="py-3 px-4 font-medium">
                              {user.username}
                              {user.isAdmin && (
                                <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-brand-primary/20 text-brand-primary">
                                  {t("Admin")}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">{user.email || "-"}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span>{user.level || 1}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6" 
                                  onClick={() => updateUserLevelMutation.mutate(user.id)}
                                  disabled={updateUserLevelMutation.isPending}
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-xs ${isRecentlyActive ? 'bg-success/20 text-success' : 'bg-muted/20 text-muted-foreground'}`}>
                                {isRecentlyActive ? t("Active") : t("Inactive")}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground text-sm">
                              {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : t("Never")}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex justify-end items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  className="h-8 w-8 text-danger hover:text-danger/80"
                                  onClick={() => {
                                    setUserToDelete(user.id);
                                    setShowDeleteConfirm(true);
                                  }}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
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
                    {searchTerm ? t("No users match your search") : t("No users found")}
                  </p>
                  {searchTerm && (
                    <Button 
                      variant="outline" 
                      onClick={() => setSearchTerm("")}
                    >
                      {t("Clear search")}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delete User Confirmation Dialog */}
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("Delete User")}</DialogTitle>
                <DialogDescription>
                  {t("Are you sure you want to delete this user? This action cannot be undone.")}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                  {t("Cancel")}
                </Button>
                <Button 
                  variant="destructive"
                  disabled={deleteUserMutation.isPending}
                  onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete)}
                >
                  {deleteUserMutation.isPending ? t("Deleting...") : t("Delete")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* Trading Data Tab */}
        <TabsContent value="trading">
          <div className="grid grid-cols-1 gap-6">
            {/* Trading Pairs Management */}
            <Card className="bg-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>{t("Trading Pairs")}</CardTitle>
                    <CardDescription>
                      {t("Manage available trading pairs")}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      className="w-full sm:w-[200px]"
                      placeholder={t("New trading pair...")}
                      value={newTradingPair}
                      onChange={(e) => setNewTradingPair(e.target.value)}
                    />
                    <Button 
                      className="bg-brand-primary hover-glow-primary"
                      onClick={() => addTradingPairMutation.mutate({ pair: newTradingPair })}
                      disabled={!newTradingPair.trim() || addTradingPairMutation.isPending}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("Add")}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {tradingPairsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <p>{t("Loading trading pairs...")}</p>
                  </div>
                ) : tradingPairs && tradingPairs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {tradingPairs.map((pair: TradingPair) => (
                      <div key={pair.id} className="border rounded-lg p-3 flex justify-between items-center hover:bg-card/60">
                        <span className="font-medium">{pair.pair}</span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-danger hover:text-danger/80"
                          onClick={() => deleteTradingPairMutation.mutate(pair.id)}
                          disabled={deleteTradingPairMutation.isPending}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32">
                    <p className="text-muted-foreground mb-2">
                      {t("No trading pairs available")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Strategy Types Management */}
            <Card className="bg-card">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle>{t("Strategy Types")}</CardTitle>
                    <CardDescription>
                      {t("Manage available strategy types")}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      className="w-full sm:w-[200px]"
                      placeholder={t("New strategy type...")}
                      value={newStrategyType}
                      onChange={(e) => setNewStrategyType(e.target.value)}
                    />
                    <Button 
                      className="bg-brand-primary hover-glow-primary"
                      onClick={() => addStrategyTypeMutation.mutate({ name: newStrategyType })}
                      disabled={!newStrategyType.trim() || addStrategyTypeMutation.isPending}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("Add")}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {strategyTypesLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <p>{t("Loading strategy types...")}</p>
                  </div>
                ) : strategyTypes && strategyTypes.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {strategyTypes.map((strategy: StrategyType) => (
                      <div key={strategy.id} className="border rounded-lg p-3 flex justify-between items-center hover:bg-card/60">
                        <span className="font-medium">{strategy.name}</span>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-danger hover:text-danger/80"
                          onClick={() => deleteStrategyTypeMutation.mutate(strategy.id)}
                          disabled={deleteStrategyTypeMutation.isPending}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32">
                    <p className="text-muted-foreground mb-2">
                      {t("No strategy types available")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>{t("Platform Settings")}</CardTitle>
              <CardDescription>
                {t("Configure platform behavior and options")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {/* Registration Settings */}
                <div>
                  <h3 className="text-lg font-medium mb-4">{t("Registration")}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="registration-open">{t("Open Registration")}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t("Allow new users to register")}
                        </p>
                      </div>
                      <Switch id="registration-open" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="require-activation">{t("Require Email Activation")}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t("Users must verify email before accessing platform")}
                        </p>
                      </div>
                      <Switch id="require-activation" defaultChecked />
                    </div>
                    
                    <div>
                      <Label htmlFor="registration-code">{t("Registration Code")}</Label>
                      <div className="flex gap-2 mt-1">
                        <Input id="registration-code" value="ABC123" disabled />
                        <Button variant="outline">{t("Generate New")}</Button>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {t("Share this code with users to allow registration")}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Platform Features */}
                <div>
                  <h3 className="text-lg font-medium mb-4">{t("Platform Features")}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="feature-backtesting" defaultChecked />
                      <Label htmlFor="feature-backtesting">{t("Backtesting")}</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox id="feature-market-data" defaultChecked />
                      <Label htmlFor="feature-market-data">{t("Market Data")}</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox id="feature-news" defaultChecked />
                      <Label htmlFor="feature-news">{t("Market News Feed")}</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox id="feature-signals" />
                      <Label htmlFor="feature-signals">{t("Trading Signals")}</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox id="feature-social" />
                      <Label htmlFor="feature-social">{t("Social Features")}</Label>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* Backup & Maintenance */}
                <div>
                  <h3 className="text-lg font-medium mb-4">{t("Backup & Maintenance")}</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {t("Last backup")}: {new Date().toLocaleString()}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline">{t("Create Backup")}</Button>
                        <Button variant="outline">{t("Restore")}</Button>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <h4 className="font-medium mb-2">{t("Scheduled Backups")}</h4>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="enable-autobackup">{t("Enable Automatic Backups")}</Label>
                          <p className="text-sm text-muted-foreground">
                            {t("Daily backup at midnight")}
                          </p>
                        </div>
                        <Switch id="enable-autobackup" defaultChecked />
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* API Settings */}
                <div>
                  <h3 className="text-lg font-medium mb-4">{t("API Settings")}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enable-api">{t("API Access")}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t("Allow third-party API access")}
                        </p>
                      </div>
                      <Switch id="enable-api" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="require-api-key">{t("Require API Keys")}</Label>
                        <p className="text-sm text-muted-foreground">
                          {t("Users must generate API keys for access")}
                        </p>
                      </div>
                      <Switch id="require-api-key" defaultChecked />
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {t("Rate limit")}: 100 {t("requests per minute")}
                      </p>
                      <div className="flex gap-2">
                        <Button variant="outline">{t("Manage API Keys")}</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="bg-brand-primary hover-glow-primary">{t("Save Settings")}</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}