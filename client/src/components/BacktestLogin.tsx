import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface BacktestLoginProps {
  onLogin: (email: string, password: string) => void;
}

const BacktestLogin: React.FC<BacktestLoginProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'he';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, setLocation] = useLocation();

  // Quick access buttons for demo and admin
  const loginAsDemo = () => {
    setUsername('demo');
    setPassword('demo123');
  };

  const loginAsAdmin = () => {
    setUsername('admin');
    setPassword('admin123');
  };

  // Handle login with proper API request
  const handleLogin = async () => {
    if (!username || !password) {
      toast({
        title: t('auth.errorTitle'),
        description: t('auth.errorAllFields'),
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Use normal fetch directly instead of apiRequest since it's expecting different parameters
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const userData = await response.json();

      // Invalidate the user query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      toast({
        title: t('auth.loginSuccess'),
        description: t('auth.welcomeBack', { name: userData.username }),
      });
      
      // Redirect to appropriate dashboard
      if (userData.isAdmin) {
        setLocation('/backtest/admin');
      } else {
        setLocation('/backtest/dashboard');
      }
      
      // Close the modal through callback
      onLogin(username, password);
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: t('auth.loginFailed'),
        description: t('auth.invalidCredentials'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Stock Chart Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-primary/10 to-black/80 z-0">
        <div className="absolute inset-0 bg-grid-white/5 bg-grid z-0"></div>
        
        {/* SVG Stock Chart */}
        <svg className="absolute bottom-0 left-0 right-0 w-full opacity-20" height="150" viewBox="0 0 500 150" preserveAspectRatio="none">
          <path 
            d="M0,150 L0,110 C20,130 40,90 60,100 C80,110 100,80 120,70 C140,60 160,80 180,90 C200,100 220,80 240,60 C260,40 280,70 300,80 C320,90 340,60 360,40 C380,20 400,30 420,40 C440,50 460,30 480,20 L500,10 L500,150 Z" 
            fill="url(#chartGradient)" 
            strokeWidth="3"
            stroke="rgba(var(--primary-rgb), 0.8)"
          />
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(var(--primary-rgb), 0.4)" />
              <stop offset="100%" stopColor="rgba(var(--primary-rgb), 0)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 p-6 backdrop-blur-sm">
        <div className="text-xl font-bold mb-4 text-center">{t('backtest.loginTitle')}</div>
        
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="username">{t('auth.usernameLabel')}</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('auth.usernamePlaceholder')}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="password">{t('auth.passwordLabel')}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordPlaceholder')}
            />
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={loginAsDemo}
              className="text-xs"
            >
              {t('backtest.loginAsDemo')}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loginAsAdmin}
              className="text-xs"
            >
              {t('backtest.loginAsAdmin')}
            </Button>
          </div>
        </div>
        
        <div className={`flex ${isRtl ? 'flex-row-reverse' : ''} justify-between mt-6 gap-4`}>
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "#markets"}
            className="flex-1 border-white/20 hover:bg-white/10 hover:text-white"
          >
            {t('backtest.cancel')}
          </Button>
          <Button 
            onClick={handleLogin}
            className="flex-1 bg-brand-primary hover:bg-brand-primary/90"
            disabled={isLoading}
          >
            {isLoading ? t('auth.loggingIn') : t('backtest.loginButton')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BacktestLogin;