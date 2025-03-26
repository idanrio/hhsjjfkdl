import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface BacktestLoginProps {
  onLogin: (email: string, password: string) => void;
}

const BacktestLogin: React.FC<BacktestLoginProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'he';

  const handleSubmit = () => {
    if (!email || !password) {
      toast({
        title: 'Error',
        description: t('backtest.loginError'),
        variant: 'destructive',
      });
      return;
    }
    
    onLogin(email, password);
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
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="backtest-email" className="text-white">{t('backtest.emailLabel')}</Label>
            <Input
              id="backtest-email"
              type="email"
              placeholder={t('backtest.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-primary/30 bg-black/50 backdrop-blur-md focus:border-primary"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="backtest-password" className="text-white">{t('backtest.passwordLabel')}</Label>
            <Input
              id="backtest-password"
              type="password"
              placeholder={t('backtest.passwordPlaceholder')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-primary/30 bg-black/50 backdrop-blur-md focus:border-primary"
            />
          </div>
        </div>
        <div className={`flex ${isRtl ? 'flex-row-reverse' : ''} justify-between mt-6 gap-4`}>
          <Button 
            variant="outline" 
            onClick={() => onLogin('', '')}
            className="flex-1 border-white/20 hover:bg-white/10 hover:text-white"
          >
            {t('backtest.cancel')}
          </Button>
          <Button 
            onClick={handleSubmit}
            className="flex-1 bg-primary hover:bg-primary/80"
          >
            {t('backtest.loginButton')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BacktestLogin;