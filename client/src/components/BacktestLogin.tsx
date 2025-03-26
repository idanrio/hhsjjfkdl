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
    <>
      <div className="text-lg font-semibold mb-2">{t('backtest.loginTitle')}</div>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="backtest-email">{t('backtest.emailLabel')}</Label>
          <Input
            id="backtest-email"
            type="email"
            placeholder={t('backtest.emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="backtest-password">{t('backtest.passwordLabel')}</Label>
          <Input
            id="backtest-password"
            type="password"
            placeholder={t('backtest.passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>
      <div className="flex justify-between mt-4">
        <Button variant="outline" onClick={() => onLogin('', '')}>
          {t('backtest.cancel')}
        </Button>
        <Button onClick={handleSubmit}>
          {t('backtest.loginButton')}
        </Button>
      </div>
    </>
  );
};

export default BacktestLogin;