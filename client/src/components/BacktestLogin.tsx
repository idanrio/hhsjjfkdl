import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

interface BacktestLoginProps {
  onLogin: (email: string, password: string) => void;
}

const BacktestLogin: React.FC<BacktestLoginProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t('backtest.loginError'));
      return;
    }
    
    // Here we would normally validate against a backend
    // For now, we'll just pass the credentials to the parent
    onLogin(email, password);
    setIsOpen(false);
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button className="bg-primary px-6 py-3 rounded font-semibold hover:bg-primary-light transition-all duration-300 flex items-center">
          {t('backtest.launchSystem')}
          <i className="fas fa-chart-line ml-2"></i>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-black border border-white/10 rounded-xl p-6 z-50">
          <Dialog.Title className="text-2xl font-bold mb-6">
            {t('backtest.loginTitle')}
          </Dialog.Title>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-900/30 border border-red-500 text-red-200 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium">
                {t('backtest.emailLabel')}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-secondary p-3 rounded-md border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('backtest.emailPlaceholder')}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium">
                {t('backtest.passwordLabel')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-secondary p-3 rounded-md border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('backtest.passwordPlaceholder')}
              />
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                className="bg-primary px-5 py-2 rounded font-semibold hover:bg-primary-light transition-all duration-300"
              >
                {t('backtest.loginButton')}
              </button>
              
              <button
                type="button"
                className="text-white/70 hover:text-white"
                onClick={() => setIsOpen(false)}
              >
                {t('backtest.cancel')}
              </button>
            </div>
          </form>
          
          <Dialog.Close asChild className="absolute top-4 right-4">
            <button
              type="button"
              className="text-white/70 hover:text-white rounded-full p-1"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default BacktestLogin;