import React from 'react';
import { Link, useLocation } from 'wouter';
import { Diamond, Search, Compass, Wallet, Settings } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function MobileNavigation() {
  const [location] = useLocation();
  const { t } = useLanguage();

  const isActive = (path: string) => location === path;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-50">
      <div className="grid grid-cols-5 h-16">
        <Link href="/">
          <a className={`flex flex-col items-center justify-center transition-colors ${
            isActive('/') ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
          }`} data-testid="nav-home">
            <Diamond className="text-lg mb-1" />
            <span className="text-xs">Omax</span>
          </a>
        </Link>
        
        <button className="flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-search">
          <Search className="text-lg mb-1" />
          <span className="text-xs">Search</span>
        </button>
        
        <Link href="/trenches">
          <a className={`flex flex-col items-center justify-center transition-colors ${
            isActive('/trenches') ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
          }`} data-testid="nav-explore">
            <Compass className="text-lg mb-1" />
            <span className="text-xs">Explore</span>
          </a>
        </Link>
        
        <Link href="/wallet">
          <a className={`flex flex-col items-center justify-center transition-colors ${
            isActive('/wallet') ? 'text-accent' : 'text-muted-foreground hover:text-foreground'
          }`} data-testid="nav-wallet">
            <Wallet className="text-lg mb-1" />
            <span className="text-xs">Wallet</span>
          </a>
        </Link>
        
        <button className="flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-settings">
          <Settings className="text-lg mb-1" />
          <span className="text-xs">Settings</span>
        </button>
      </div>
    </nav>
  );
}
