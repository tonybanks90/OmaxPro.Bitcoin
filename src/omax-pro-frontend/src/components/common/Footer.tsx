import React, { useState } from 'react';
import { Crosshair, Wallet, Settings } from 'lucide-react';
import { SettingsModal } from '../modals/SettingsModal';
import { Link, useLocation } from 'wouter';

export function Footer() {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [location] = useLocation();

  const isActive = (path: string) => location.startsWith(path);

  return (
    <>
      <footer className="hidden md:block fixed bottom-0 left-0 right-0 bg-surface border-t border-border backdrop-blur-lg bg-opacity-95 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center space-x-6">
              <Link
                href="/sniper"
                className={`flex items-center space-x-2 transition-colors ${
                  isActive('/sniper')
                    ? 'text-accent'
                    : 'text-muted-foreground hover:text-accent'
                }`}
                data-testid="button-sniper"
              >
                <Crosshair className="w-4 h-4" />
                <span className="text-sm">Sniper</span>
              </Link>

              <Link
                href="/wallet-manager"
                className={`flex items-center space-x-2 transition-colors ${
                  isActive('/wallet-manager')
                    ? 'text-accent'
                    : 'text-muted-foreground hover:text-accent'
                }`}
                data-testid="button-wallet-tracker"
              >
                <Wallet className="w-4 h-4" />
                <span className="text-sm">Wallet Manager</span>
              </Link>

              <Link
                href="/coming-soon"
                className={`flex items-center space-x-2 transition-colors ${
                  isActive('/coming-soon')
                    ? 'text-accent'
                    : 'text-muted-foreground hover:text-accent'
                }`}
                data-testid="button-monitor"
              >
                <Wallet className="w-4 h-4" />
                <span className="text-sm">Monitor</span>
              </Link>

              <Link
                href="/coming-soon"
                className={`flex items-center space-x-2 transition-colors ${
                  isActive('/coming-soon')
                    ? 'text-accent'
                    : 'text-muted-foreground hover:text-accent'
                }`}
                data-testid="button-alerts"
              >
                <Wallet className="w-4 h-4" />
                <span className="text-sm">Alerts</span>
              </Link>

              <Link
                href="/holdings"
                className={`flex items-center space-x-2 transition-colors ${
                  isActive('/holdings')
                    ? 'text-accent'
                    : 'text-muted-foreground hover:text-accent'
                }`}
                data-testid="button-pnl"
              >
                <Wallet className="w-4 h-4" />
                <span className="text-sm">P&amp;L Tracker</span>
              </Link>

              <Link
  href="/boost"
  className={`flex items-center space-x-2 rounded-lg px-2 py-1 transition-all duration-300
    ${
      isActive('/coming-soon')
        ? 'text-accent animate-[glow_1.5s_ease-in-out_infinite_alternate]'
        : 'text-muted-foreground hover:text-accent hover:animate-[glow_1.5s_ease-in-out_infinite_alternate]'
    }`}
  data-testid="button-alerts"
>
  <Wallet className="w-4 h-4" />
  <span className="text-sm">TEST-CKBTC-DEP</span>
</Link>

            </div>

            <div className="flex items-center space-x-4">
              <span className="text-xs text-muted-foreground">© 2025 OMAX</span>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </footer>

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </>
  );
}
