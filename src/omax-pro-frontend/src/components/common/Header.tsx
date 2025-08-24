import React, { useState } from 'react';
import { Link } from 'wouter';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { WalletConnectionModal } from '@/components/modals/WalletConnectionModal';
import { Diamond, Globe, Palette, Search, Bell, UserCircle } from 'lucide-react';

export function Header() {
  const { toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);

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
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/trending">
                <a className="text-foreground hover:text-accent transition-colors font-medium" data-testid="link-trending">
                  {t('nav.trending')}
                </a>
              </Link>
              <Link href="/wallet">
                <a className="text-muted-foreground hover:text-accent transition-colors" data-testid="link-wallet-tracker">
                  {t('nav.walletTracker')}
                </a>
              </Link>
              <Link href="/trenches">
                <a className="text-muted-foreground hover:text-accent transition-colors" data-testid="link-monitor">
                  {t('nav.monitor')}
                </a>
              </Link>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors" data-testid="link-holdings">
                {t('nav.holdings')}
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors" data-testid="link-earn">
                {t('nav.earn')}
              </a>
              <a href="#" className="text-muted-foreground hover:text-accent transition-colors" data-testid="link-points">
                {t('nav.points')}
              </a>
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
                className="hidden sm:flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-theme-toggle"
              >
                <Palette className="text-sm" />
              </button>

              {/* Search */}
              <button className="text-muted-foreground hover:text-foreground transition-colors" data-testid="button-search">
                <Search className="w-5 h-5" />
              </button>

              {/* Notifications */}
              <button className="relative text-muted-foreground hover:text-foreground transition-colors" data-testid="button-notifications">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  3
                </span>
              </button>

              {/* Connect Wallet */}
              <button 
                onClick={() => setShowWalletModal(true)}
                className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg font-medium transition-colors"
                data-testid="button-connect-wallet"
              >
                {isWalletConnected ? t('wallet.connected') : t('wallet.connect')}
              </button>

              {/* Account Menu */}
              <button className="text-muted-foreground hover:text-foreground transition-colors" data-testid="button-account">
                <UserCircle className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

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
