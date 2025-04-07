import { Switch, Route, useLocation, Redirect } from "wouter";
import { Toaster } from "./components/ui/toaster";
import NotFound from "./pages/not-found";
import Home from "./pages/Home";
import BacktestDashboard from "./pages/backtest/Dashboard";
import AdminDashboard from "./pages/backtest/Admin";
import TradeForm from "./pages/backtest/TradeForm";
import TradingEnvironment from "./pages/backtest/TradingEnvironment";
import PaperTradingPro from "./pages/backtest/PaperTradingPro";
import PositionDemo from "./components/PositionDemo";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "./hooks/use-auth";
import { EmailVerificationSection } from "./components/EmailVerificationSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./components/ui/dialog";
import { EmailVerification } from "./components/EmailVerification";
import { Loader2 } from "lucide-react";

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

// Protected route component that requires verification
function ProtectedRoute({ component: Component, adminOnly = false, ...rest }: { 
  component: React.ComponentType<any>, 
  path: string, 
  adminOnly?: boolean
}) {
  const { user, isLoading } = useAuth();
  const [showVerification, setShowVerification] = useState(false);
  const [, navigate] = useLocation();

  // Check if user is authenticated and verified
  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in, redirect to home
        navigate("/");
      } else if (!user.isEmailVerified) {
        // Logged in but not verified, show verification dialog
        setShowVerification(true);
      } else if (adminOnly && !user.isAdmin) {
        // Not an admin, redirect to home
        navigate("/");
      }
    }
  }, [user, isLoading, adminOnly, navigate]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If user isn't authenticated, don't render anything (redirect effect will handle it)
  if (!user) {
    return null;
  }

  // If user isn't verified, show verification dialog
  if (!user.isEmailVerified) {
    return (
      <>
        <Dialog open={showVerification} onOpenChange={setShowVerification}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-primary">Email Verification Required</DialogTitle>
              <DialogDescription className="text-center">
                Please verify your email to access this page
              </DialogDescription>
            </DialogHeader>
            <EmailVerification />
          </DialogContent>
        </Dialog>
        <Redirect to="/" />
      </>
    );
  }

  // If admin-only and user isn't admin, don't render (redirect effect will handle it)
  if (adminOnly && !user.isAdmin) {
    return null;
  }

  // All checks passed, render the component
  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <ProtectedRoute path="/backtest/dashboard" component={BacktestDashboard} />
      <ProtectedRoute path="/backtest/admin" component={AdminDashboard} adminOnly={true} />
      <ProtectedRoute path="/backtest/new-trade" component={TradeForm} />
      <ProtectedRoute path="/backtest/trades/:id" component={TradeForm} />
      <ProtectedRoute path="/backtest/trading" component={TradingEnvironment} />
      <ProtectedRoute path="/backtest/paper-trading" component={PaperTradingPro} />
      <ProtectedRoute path="/backtest/position-demo" component={PositionDemo} />
      <Route component={NotFound} />
    </Switch>
  );
}

// Email verification popup for new users
function EmailVerificationPopup() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // If user is logged in but not verified, show verification dialog after a short delay
    if (user && !user.isEmailVerified) {
      const timer = setTimeout(() => {
        setOpen(true);
      }, 2000); // 2 seconds delay
      
      return () => clearTimeout(timer);
    }
    
    setOpen(false);
  }, [user]);

  if (!user || user.isEmailVerified) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-primary">Verify Your Email</DialogTitle>
          <DialogDescription className="text-center">
            A verification code has been sent to your email address. Please verify to access all features.
          </DialogDescription>
        </DialogHeader>
        <EmailVerification />
      </DialogContent>
    </Dialog>
  );
}

function App() {
  return (
    <>
      <AppInitializer />
      <Router />
      <EmailVerificationPopup />
    </>
  );
}

export default App;
