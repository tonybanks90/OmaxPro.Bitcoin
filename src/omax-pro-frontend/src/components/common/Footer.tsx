import React, { useState } from 'react';
import { Crosshair, Wallet, Settings } from 'lucide-react';
import { SettingsModal } from '../modals/SettingsModal';
import { Link, useLocation } from 'wouter';

// X (Twitter) Icon as SVG component
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export function Footer() {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [location] = useLocation();

  const isActive = (path: string) => location.startsWith(path);

  return (
    <>
      <footer className="hidden md:block fixed bottom-0 left-0 right-0 bg-surface border-t border-border backdrop-blur-lg bg-opacity-95 z-50">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
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
                href="/ckbtcdeposit"
                className={`flex items-center space-x-2 rounded-lg px-2 py-1 transition-all duration-300 ${
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
              {/* X (Twitter) Icon */}
              <a
                href="https://x.com/omaxpro_"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-accent transition-colors"
                data-testid="link-twitter"
                title="Follow us on X (Twitter)"
              >
                <XIcon className="w-4 h-4" />
              </a>

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