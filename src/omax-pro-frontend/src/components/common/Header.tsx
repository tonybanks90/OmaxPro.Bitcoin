import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { WalletConnectionModal } from '../modals/WalletConnectionModal';
import { Diamond, Globe, Palette, Search, Bell, UserCircle, Wallet } from 'lucide-react';
import { NotificationsPopup } from '../modals/NotificationsPopup';
import { ProfileMenu } from '../modals/ProfileMenu';

export function Header() {
  const { toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [location] = useLocation(); // <-- get current path

  // helper to check if tab is active
  const isActive = (path: string) => location.startsWith(path);

  return (
    <>
      <header className="sticky top-0 z-50 bg-surface border-b border-border backdrop-blur-lg bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Diamond className="text-2xl text-accent" />
                <span className="text-xl font-bold text-foreground" data-testid="brand-name">
                  {t('brand.name')}
                </span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
               <Link
    href="/discovery"
    className={`font-medium transition-colors ${
      isActive('/discovery')
        ? 'text-accent'
        : 'text-muted-foreground hover:text-accent'
    }`}
    data-testid="link-discovery"
  >
    {t('nav.discovery')}
  </Link>
              <Link
    href="/prediction-markets"
    className={`font-medium transition-colors ${
      isActive('/prediction-markets')
        ? 'text-accent'
        : 'text-muted-foreground hover:text-accent'
    }`}
    data-testid="link-prediction-markets"
  >
    {t('nav.PredictionMarkets')}
  </Link>
  <Link
    href="/trending"
    className={`font-medium transition-colors ${
      isActive('/trending')
        ? 'text-accent'
        : 'text-muted-foreground hover:text-accent'
    }`}
    data-testid="link-trending"
  >
    {t('nav.trending')}
  </Link>
 
  <Link
    href="/trenches"
    className={`font-medium transition-colors ${
      isActive('/trenches')
        ? 'text-accent'
        : 'text-muted-foreground hover:text-accent'
    }`}
    data-testid="link-trenches"
  >
    {t('nav.trenches')}
  </Link>
  <Link
    href="/wallet"
    className={`font-medium transition-colors ${
      isActive('/wallet')
        ? 'text-accent'
        : 'text-muted-foreground hover:text-accent'
    }`}
    data-testid="link-wallet-tracker"
  >
    {t('nav.walletTracker')}
  </Link>
  <Link
    href="/holdings"
    className={`font-medium transition-colors ${
      isActive('/holdings')
        ? 'text-accent'
        : 'text-muted-foreground hover:text-accent'
    }`}
    data-testid="link-holdings"
  >
    {t('nav.holdings')}
  </Link>
  <Link
    href="/earn"
    className={`font-medium transition-colors ${
      isActive('/earn')
        ? 'text-accent'
        : 'text-muted-foreground hover:text-accent'
    }`}
    data-testid="link-earn"
  >
    {t('nav.earn')}
  </Link>
</nav>


            {/* Header Controls */}
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <button 
                onClick={toggleLanguage}
                className="hidden sm:flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-language-toggle"
              >
                <Globe className="text-sm" />
                <span className="text-sm">{language.toUpperCase()}</span>
              </button>

              {/* Theme Toggle */}
              <button 
                onClick={toggleTheme}
                className="hidden sm:flex items-center space-x-1 text-accent hover:text-foreground transition-colors"
                data-testid="button-theme-toggle"
              >
                <Palette className="text-sm" />
              </button>

              {/* Search */}
              <button className="text-muted-foreground hover:text-foreground transition-colors" data-testid="button-search">
                <Search className="w-5 h-5" />
              </button>

              {/* Notifications */}
              <NotificationsPopup>
                <button
                  className="relative text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-notifications"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    3
                  </span>
                </button>
              </NotificationsPopup>

              {/* Connect Wallet (icon only) */}
              <button 
                onClick={() => setShowWalletModal(true)}
                className="relative text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-connect-wallet"
              >
                <Wallet className="w-6 h-6" />
                {/* Connection status dot */}
                <span
                  className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border border-background ${
                    isWalletConnected ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                />
              </button>

              {/* Account Menu */}
              <ProfileMenu>
                <button className="text-accent hover:text-foreground transition-colors" data-testid="button-account">
                  <UserCircle className="w-6 h-6" />
                </button>
              </ProfileMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Wallet Modal */}
      <WalletConnectionModal 
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={() => {
          setIsWalletConnected(true);
          setShowWalletModal(false);
        }}
      />
    </>
  );
}
