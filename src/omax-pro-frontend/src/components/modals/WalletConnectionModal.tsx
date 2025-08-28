import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import {
  Wallet,
  Smartphone,
  Shield,
  X,
  KeyRound,
  Copy,
  LogOut,
  Check,
} from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";

interface WalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: () => void;
}

export function WalletConnectionModal({
  isOpen,
  onClose,
  onConnect,
}: WalletConnectionModalProps) {
  const { isAuthenticated, principalId, login, logout } = useAuth();
  const [copied, setCopied] = useState(false);

  const handleWalletConnect = (walletType: string) => {
    console.log(`Connecting to ${walletType}`);
    onConnect();
  };

  const handleIIConnect = async () => {
    if (!isAuthenticated) {
      await login();
      onConnect();
    } else {
      console.log("Already connected with Internet Identity:", principalId);
      onConnect();
    }
  };

  // Truncate PID for button display
  const truncatePID = (pid: string) => {
    const parts = pid.split("-");
    return parts.length > 2 ? `${parts[0]}-${parts[1]}` : pid;
  };

  // Copy to clipboard
  const copyToClipboard = async () => {
    if (!principalId) return;
    await navigator.clipboard.writeText(principalId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-surface border border-border rounded-xl p-6 w-full max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-foreground">
              {isAuthenticated ? "Your Wallet" : "Connect Wallet"}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              data-testid="button-close-wallet-modal"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* If logged in with II → show PID, copy, logout */}
        {isAuthenticated && principalId ? (
          <div className="flex flex-col items-center justify-center space-y-4 mt-6">
            <KeyRound className="w-10 h-10 text-accent" />
            <p className="text-sm font-mono text-foreground break-all text-center">
              {principalId}
            </p>

            <div className="flex items-center gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1 flex items-center justify-center gap-2"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied!" : "Copy"}
              </Button>

              <Button
                variant="destructive"
                className="flex-1 flex items-center justify-center gap-2"
                onClick={logout}
                data-testid="button-logout-ii"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3 mt-4">
              {/* Internet Identity option */}
              <Button
                variant="ghost"
                className="w-full flex items-center justify-start space-x-3 p-3 bg-background hover:bg-muted border border-border rounded-lg"
                onClick={handleIIConnect}
                data-testid="button-connect-ii"
              >
                <KeyRound className="text-accent text-xl" />
                <div className="text-left">
                  <div className="font-medium text-foreground">
                    Internet Identity 2.0
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Connect using ICP Internet Identity
                  </div>
                </div>
              </Button>

              {/* MetaMask */}
              <Button
                variant="ghost"
                className="w-full flex items-center justify-start space-x-3 p-3 bg-background hover:bg-muted border border-border rounded-lg"
                onClick={() => handleWalletConnect("MetaMask")}
                data-testid="button-connect-metamask"
              >
                <Wallet className="text-accent text-xl" />
                <div className="text-left">
                  <div className="font-medium text-foreground">MetaMask</div>
                  <div className="text-xs text-muted-foreground">
                    Connect using browser extension
                  </div>
                </div>
              </Button>

              {/* WalletConnect */}
              <Button
                variant="ghost"
                className="w-full flex items-center justify-start space-x-3 p-3 bg-background hover:bg-muted border border-border rounded-lg"
                onClick={() => handleWalletConnect("WalletConnect")}
                data-testid="button-connect-walletconnect"
              >
                <Smartphone className="text-accent text-xl" />
                <div className="text-left">
                  <div className="font-medium text-foreground">
                    WalletConnect
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Connect using mobile wallet
                  </div>
                </div>
              </Button>

              {/* Phantom */}
              <Button
                variant="ghost"
                className="w-full flex items-center justify-start space-x-3 p-3 bg-background hover:bg-muted border border-border rounded-lg"
                onClick={() => handleWalletConnect("Phantom")}
                data-testid="button-connect-phantom"
              >
                <Shield className="text-accent text-xl" />
                <div className="text-left">
                  <div className="font-medium text-foreground">Phantom</div>
                  <div className="text-xs text-muted-foreground">
                    Solana wallet
                  </div>
                </div>
              </Button>
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-center text-muted-foreground">
                By connecting, you agree to our Terms of Service and Privacy
                Policy.
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* --------------------------
   EXTERNAL CONNECT BUTTON
--------------------------- */
export function ConnectButton() {
  const { isAuthenticated, principalId } = useAuth();
  const [isModalOpen, setModalOpen] = useState(false);

  // Truncate PID for display
  const truncatePID = (pid: string) => {
    const parts = pid.split("-");
    return parts.length > 2 ? `${parts[0]}-${parts[1]}` : pid;
  };

  return (
    <>
      <Button
        variant={isAuthenticated ? "outline" : "default"}
        className="flex items-center gap-2"
        onClick={() => setModalOpen(true)}
      >
        <Wallet className="w-4 h-4" />
        {isAuthenticated && principalId
          ? `Wallet Connected - ${truncatePID(principalId)}`
          : "Connect Wallet"}
      </Button>

      <WalletConnectionModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onConnect={() => setModalOpen(false)}
      />
    </>
  );
}
