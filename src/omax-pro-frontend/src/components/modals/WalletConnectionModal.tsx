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
  X,
  KeyRound,
  Copy,
  LogOut,
  Check,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../auth/AuthProvider";
import CryptoBalances from "./CryproBalances";

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
  const [showToast, setShowToast] = useState(false);

  const handleWalletConnect = (walletType: string) => {
    console.log(`Connecting to ${walletType}`);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
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

  const truncatePID = (pid: string) => {
    const parts = pid.split("-");
    return parts.length > 2 ? `${parts[0]}-${parts[1]}` : pid;
  };

  const copyToClipboard = async () => {
    if (!principalId) return;
    await navigator.clipboard.writeText(principalId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="bg-surface border border-border rounded-xl p-0 w-full max-w-md 
                     mx-auto my-8 max-h-[calc(100vh-4rem)] overflow-y-auto"
        >
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-accent/20 via-accent/10 to-transparent p-6 pb-8">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Wallet className="w-6 h-6 text-accent" />
                  {isAuthenticated ? "Your Wallet" : "Connect Wallet"}
                </DialogTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="hover:bg-background/50"
                  data-testid="button-close-wallet-modal"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {!isAuthenticated && (
                <p className="text-sm text-muted-foreground mt-2">
                  Choose your preferred wallet to connect
                </p>
              )}
            </DialogHeader>
          </div>

          <div className="p-6 pt-0">
            {isAuthenticated && principalId ? (
  <div className="flex flex-col space-y-4">
    {/* Compact header row with icon + PID */}
    <div className="flex items-center justify-between bg-background p-3 rounded-lg border border-border">
      <div className="flex items-center gap-2">
        <KeyRound className="w-5 h-5 text-accent" />
        <span className="text-sm font-mono text-foreground break-all">
          {principalId}
        </span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={copyToClipboard}
        className="flex items-center gap-1"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 text-success" />
            <span>Copied</span>
          </>
        ) : (
          <>
            <Copy className="w-3 h-3" />
            <span>Copy</span>
          </>
        )}
      </Button>
    </div>

    {/* Balances */}
    {principalId && <CryptoBalances principalId={principalId} />}

    {/* Logout button */}
    <Button
      variant="destructive"
      className="w-full flex items-center justify-center gap-2"
      onClick={logout}
      data-testid="button-logout-ii"
    >
      <LogOut className="w-4 h-4" />
      Logout
    </Button>
  </div>
) : (

              <>
                <div className="space-y-3">
                  {/* Internet Identity - Active */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      className="w-full flex items-center justify-start space-x-4 p-4 bg-gradient-to-r from-accent/5 to-transparent hover:from-accent/10 border-2 border-accent/20 hover:border-accent/40 rounded-xl transition-all duration-200"
                      onClick={handleIIConnect}
                      data-testid="button-connect-ii"
                    >
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                        <KeyRound className="w-6 h-6 text-accent" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="font-semibold text-foreground text-base">
                          Internet Identity
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Secure ICP authentication
                        </div>
                      </div>
                      <div className="px-2 py-1 bg-accent/20 text-accent text-xs font-medium rounded-full">
                        Active
                      </div>
                    </Button>
                  </div>

                  {/* Divider */}
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-surface px-3 text-muted-foreground font-medium">
                        Coming Soon
                      </span>
                    </div>
                  </div>

                  {/* Other Wallets - Coming Soon (no icons) */}
                  <div className="space-y-2 opacity-60">
                    <Button
                      variant="ghost"
                      className="w-full flex items-center justify-start p-4 bg-background hover:bg-muted/50 border border-border rounded-xl cursor-not-allowed"
                      onClick={() => handleWalletConnect("MetaMask")}
                      data-testid="button-connect-metamask"
                    >
                      <div className="text-left flex-1">
                        <div className="font-semibold text-foreground text-base">
                          Xverse
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Connect Bitcoin wallet
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full flex items-center justify-start p-4 bg-background hover:bg-muted/50 border border-border rounded-xl cursor-not-allowed"
                      onClick={() => handleWalletConnect("WalletConnect")}
                      data-testid="button-connect-walletconnect"
                    >
                      <div className="text-left flex-1">
                        <div className="font-semibold text-foreground text-base">
                          WalletConnect
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Mobile wallet connection
                        </div>
                      </div>
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full flex items-center justify-start p-4 bg-background hover:bg-muted/50 border border-border rounded-xl cursor-not-allowed"
                      onClick={() => handleWalletConnect("Phantom")}
                      data-testid="button-connect-phantom"
                    >
                      <div className="text-left flex-1">
                        <div className="font-semibold text-foreground text-base">
                          Phantom
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Solana & multi-chain wallet
                        </div>
                      </div>
                    </Button>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-xs text-center text-muted-foreground">
                    By connecting, you agree to our{" "}
                    <span className="text-accent hover:underline cursor-pointer">
                      Terms of Service
                    </span>{" "}
                    and{" "}
                    <span className="text-accent hover:underline cursor-pointer">
                      Privacy Policy
                    </span>
                    .
                  </p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-5 fade-in duration-300">
          <div className="bg-surface border border-accent/50 rounded-lg shadow-lg p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Coming Soon!</p>
              <p className="text-sm text-muted-foreground">
                This wallet will be available soon
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* --------------------------
   EXTERNAL CONNECT BUTTON
--------------------------- */
export function ConnectButton() {
  const { isAuthenticated, principalId } = useAuth();
  const [isModalOpen, setModalOpen] = useState(false);

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
          ? `${truncatePID(principalId)}`
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
