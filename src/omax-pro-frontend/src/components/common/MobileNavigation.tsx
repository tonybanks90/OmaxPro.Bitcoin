import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Diamond, 
  Search, 
  Compass, 
  Wallet, 
  UserCircle,
  TrendingUp,
  BarChart3,
  Eye,
  Gift,
  Monitor,
  DollarSign,
  Target,
  Bell,
  TrendingDown,
  X,
  Globe,
  Palette
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ProfileMenu } from '../../components/modals/ProfileMenu';

export function MobileNavigation() {
  const [location] = useLocation();
  const { t, language, toggleLanguage } = useLanguage();
  const { toggleTheme } = useTheme();
  const [isExploreOpen, setIsExploreOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const toggleExplore = () => {
    setIsExploreOpen(!isExploreOpen);
  };

  const closeExplore = () => {
    setIsExploreOpen(false);
  };

  const mainMenuItems = [
    { path: '/trending', label: 'Trending', icon: TrendingUp },
    { path: '/discovery', label: 'Discovery', icon: Compass },
    { path: '/prediction-markets', label: 'Prediction', icon: TrendingUp },
    { path: '/holdings', label: 'Holdings', icon: BarChart3 },
    { path: '/wallet', label: 'Wallet Tracker', icon: Eye },
    { path: '/earn', label: 'Referral', icon: Gift },
    { path: '/trenches', label: 'Trenches', icon: Monitor },
    { path: '/earn', label: 'Earn', icon: DollarSign },
    { path: '/coming-soon', label: 'Points', icon: Target },
  ];

  const otherMenuItems = [
    { path: '/sniper', label: 'Sniper', icon: Target },
    { path: '/create-prediction', label: 'Create Prediction', icon: Target },
    { path: '/coming-soon', label: 'Alerts', icon: Bell },
    { path: '/holdings', label: 'P&L Tracker', icon: TrendingDown },
  ];

  return (
    <>
      {/* Explore Menu Overlay */}
      {isExploreOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeExplore}
          data-testid="explore-overlay"
        />
      )}

      {/* Sliding Explore Menu */}
      <div className={`md:hidden fixed bottom-16 left-0 right-0 bg-background border-t border-border z-50 transform transition-transform duration-300 ease-in-out ${
        isExploreOpen ? 'translate-y-0' : 'translate-y-full'
      }`} data-testid="explore-menu">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Explore</h3>
            <button 
              onClick={closeExplore}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-close-explore"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Menu */}
          <div className="mb-6">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              MAIN MENU
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {mainMenuItems.map(({ path, label, icon: Icon }) => (
                <Link key={path} href={path}>
                  <a 
                    onClick={closeExplore}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                    data-testid={`nav-${label.toLowerCase().replace(' ', '-')}`}
                  >
                    <Icon className="w-5 h-5 text-accent" />
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </a>
                </Link>
              ))}
            </div>
          </div>

          {/* Other Menu */}
          <div className="mb-6">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              OTHER
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {otherMenuItems.map(({ path, label, icon: Icon }) => (
                <Link key={path} href={path}>
                  <a 
                    onClick={closeExplore}
                    className="flex items-center space-x-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                    data-testid={`nav-${label.toLowerCase().replace(' ', '-').replace('&', 'and')}`}
                  >
                    <Icon className="w-5 h-5 text-accent" />
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </a>
                </Link>
              ))}
            </div>
          </div>

          {/* Preferences (Language + Theme) */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Preferences
            </h4>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleLanguage}
                className="flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                data-testid="button-language-toggle"
              >
                <Globe className="w-5 h-5 text-accent" />
                <span className="text-sm">{language.toUpperCase()}</span>
              </button>
              <button
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center space-x-2 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                data-testid="button-theme-toggle"
              >
                <Palette className="w-5 h-5 text-accent" />
                <span className="text-sm">Theme</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
        <div className="flex items-center justify-around h-16">
          <Link href="/">
            <a
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive('/') ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="nav-home"
            >
              <Diamond className="w-5 h-5" />
              <span className="text-xs">Trade</span>
            </a>
          </Link>

          <Link href="/prediction-markets">
            <a
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive('/prediction-markets') ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="nav-home"
            >
              <Diamond className="w-5 h-5" />
              <span className="text-xs">Predict</span>
            </a>
          </Link>

          <button
            onClick={toggleExplore}
            className={`flex flex-col items-center justify-center gap-1 transition-colors ${
              isExploreOpen ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid="nav-explore"
          >
            <Compass className="w-5 h-5" />
            <span className="text-xs">Explore</span>
          </button>

          <Link href="/wallet-manager">
            <a
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive('/wallet-manager') ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="nav-wallet"
            >
              <Wallet className="w-5 h-5" />
              <span className="text-xs">Wallet</span>
            </a>
          </Link>

          <Link href="/discovery">
            <a
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive('/discovery') ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="nav-discovery"
            >
              <Compass className="w-5 h-5" />
              <span className="text-xs">Discover</span>
            </a>
          </Link>
        </div>
      </nav>
    </>
  );
}
