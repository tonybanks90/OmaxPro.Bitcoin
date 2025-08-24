import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wallet, Smartphone, Shield, X } from 'lucide-react';

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
}

export function WalletConnectionModal({ isOpen, onClose, onConnect }: WalletConnectionModalProps) {
  const handleWalletConnect = (walletType: string) => {
    // In a real implementation, this would handle actual wallet connection
    console.log(`Connecting to ${walletType}`);
    onConnect();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-surface border border-border rounded-xl p-6 w-full max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-foreground">
              Connect Wallet
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="button-close-wallet-modal">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-start space-x-3 p-3 bg-background hover:bg-muted border border-border rounded-lg"
            onClick={() => handleWalletConnect('MetaMask')}
            data-testid="button-connect-metamask"
          >
            <Wallet className="text-accent text-xl" />
            <div className="text-left">
              <div className="font-medium text-foreground">MetaMask</div>
              <div className="text-xs text-muted-foreground">Connect using browser extension</div>
            </div>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full flex items-center justify-start space-x-3 p-3 bg-background hover:bg-muted border border-border rounded-lg"
            onClick={() => handleWalletConnect('WalletConnect')}
            data-testid="button-connect-walletconnect"
          >
            <Smartphone className="text-accent text-xl" />
            <div className="text-left">
              <div className="font-medium text-foreground">WalletConnect</div>
              <div className="text-xs text-muted-foreground">Connect using mobile wallet</div>
            </div>
          </Button>

          <Button
            variant="ghost"
            className="w-full flex items-center justify-start space-x-3 p-3 bg-background hover:bg-muted border border-border rounded-lg"
            onClick={() => handleWalletConnect('Phantom')}
            data-testid="button-connect-phantom"
          >
            <Shield className="text-accent text-xl" />
            <div className="text-left">
              <div className="font-medium text-foreground">Phantom</div>
              <div className="text-xs text-muted-foreground">Solana wallet</div>
            </div>
          </Button>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            By connecting, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
