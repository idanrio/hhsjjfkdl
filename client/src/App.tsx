import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import BacktestDashboard from "@/pages/backtest/Dashboard";
import AdminDashboard from "@/pages/backtest/Admin";
import TradeForm from "@/pages/backtest/TradeForm";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

// Initialize app with RTL support based on stored language preference
function AppInitializer() {
  const { i18n } = useTranslation();
  
  useEffect(() => {
    // Get the stored language or use browser default
    const storedLanguage = localStorage.getItem('i18nextLng') || navigator.language;
    const langToUse = storedLanguage.includes('he') ? 'he' : 'en';
    
    // Set the initial language
    if (i18n.language !== langToUse) {
      i18n.changeLanguage(langToUse);
    }
    
    // Set initial document direction
    document.documentElement.dir = langToUse === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = langToUse;
  }, [i18n]);
  
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/backtest/dashboard" component={BacktestDashboard} />
      <Route path="/backtest/admin" component={AdminDashboard} />
      <Route path="/backtest/new-trade" component={TradeForm} />
      <Route path="/backtest/trades/:id" component={TradeForm} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <AppInitializer />
      <Router />
      <Toaster />
    </>
  );
}

export default App;
