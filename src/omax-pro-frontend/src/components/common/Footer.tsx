import React from 'react';
import { Crosshair, Wallet, Activity, Bell, TrendingUp, Settings } from 'lucide-react';

export function Footer() {
  return (
    <footer className="hidden md:block fixed bottom-0 left-0 right-0 bg-surface border-t border-border backdrop-blur-lg bg-opacity-95 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center space-x-6">
            <button className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-sniper">
              <Crosshair className="w-4 h-4" />
              <span className="text-sm">Sniper</span>
            </button>
            <button className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-wallet-tracker">
              <Wallet className="w-4 h-4" />
              <span className="text-sm">Wallet Tracker</span>
            </button>
            <button className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-monitor">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Monitor</span>
            </button>
            <button className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-alerts">
              <Bell className="w-4 h-4" />
              <span className="text-sm">Alerts</span>
            </button>
            <button className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="button-pnl">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">P&L Tracker</span>
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs text-muted-foreground">© 2024 Omax</span>
            <button className="text-muted-foreground hover:text-foreground transition-colors" data-testid="button-settings">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
