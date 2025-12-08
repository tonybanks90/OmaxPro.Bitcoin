
import { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { ArrowUp, ArrowDown, ArrowRightLeft, Settings, Zap, DollarSign, Loader2, Bitcoin, Info } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../auth/AuthProvider';
import { useOdinTrading } from '../../hooks/useOdinTrading';
import { useToast } from '../../hooks/use-toast';

interface TradingInterfaceProps {
  tokenSymbol: string;
  tokenId: string;
  tokenPrice?: number;  // Current token price in API format (raw from Odin API)
  btcPriceUSD?: number;
}

// Format helpers
const SATOSHI_TO_BTC = 0.00000001;

function formatNumber(num: number, decimals: number = 4): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(2)} B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)} M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)} K`;
  return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

export function TradingInterface({ tokenSymbol, tokenId, tokenPrice, btcPriceUSD }: TradingInterfaceProps) {
  const { t } = useLanguage();
  const { identity, isAuthenticated, login } = useAuth();
  const { buyToken, sellToken, initialize, isLoading, error } = useOdinTrading();
  const { toast } = useToast();

  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [slippage, setSlippage] = useState('0.5');

  // Initialize Odin service when identity is available
  useEffect(() => {
    if (isAuthenticated && identity) {
      console.log('TradingInterface: Initializing Odin with authenticated identity');
      initialize(identity);
    }
  }, [isAuthenticated, identity, initialize]); // Added initialize to dependency array

  const quickAmounts = tradeType === 'buy'
    ? [0.001, 0.005, 0.01, 0.05, 0.1, 0.5]
    : [100, 1000, 5000, 10000, 50000, 100000];

  // Calculate estimated return based on current token price
  const estimatedReturn = useMemo(() => {
    if (!amount || parseFloat(amount) <= 0 || !tokenPrice) {
      return null;
    }

    const numAmount = parseFloat(amount);

    // Token price from Odin API: needs to be divided by 1000 to get satoshis
    const priceInSatoshis = tokenPrice / 1000;
    const priceInBTC = priceInSatoshis * SATOSHI_TO_BTC;

    if (tradeType === 'buy') {
      // Buying: BTC -> Tokens
      // Amount is in BTC, calculate how many tokens you get
      // tokens = btc_amount / price_per_token_in_btc
      const tokensReceived = numAmount / priceInBTC;
      const usdValue = btcPriceUSD ? numAmount * btcPriceUSD : null;
      return {
        amount: tokensReceived,
        unit: tokenSymbol,
        usdValue,
        btcValue: numAmount
      };
    } else {
      // Selling: Tokens -> BTC
      // Amount is in tokens, calculate how much BTC you get
      // btc = token_amount * price_per_token_in_btc
      const btcReceived = numAmount * priceInBTC;
      const usdValue = btcPriceUSD ? btcReceived * btcPriceUSD : null;
      return {
        amount: btcReceived,
        unit: 'BTC',
        usdValue,
        btcValue: btcReceived
      };
    }
  }, [amount, tokenPrice, tradeType, btcPriceUSD, tokenSymbol]);

  const handleTrade = async () => {
    if (!isAuthenticated) {
      await login();
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid trade amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    const numAmount = parseFloat(amount);
    const numSlippage = parseFloat(slippage) || 0.5;

    console.log(`Starting ${tradeType} trade...`, { tokenId, amount: numAmount, slippage: numSlippage });

    const slippageSettings = undefined; // Placeholder for future slippage implementation

    try {
      let result;
      if (tradeType === 'buy') {
        result = await buyToken(tokenId, numAmount, slippageSettings);
      } else {
        result = await sellToken(tokenId, numAmount, slippageSettings);
      }

      if (result && 'ok' in result) {
        console.log('Trade successful!', result);
        toast({
          title: "Trade Successful",
          description: `Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} tokens.`,
          variant: "default", // or success if available, default usually maps to a standard look
        });
        setAmount('');
      } else if (result && 'err' in result) {
        console.error('Trade failed:', result.err);

        let errorTitle = "Trade Failed";
        let errorDesc = result.err;

        if (result.err.includes('No token exists')) {
          errorDesc = `Token '${tokenId}' does not exist on the Odin Development Canister.It may only be available on Mainnet.`;
        } else if (result.err.includes('Insufficient funds')) {
          errorTitle = "Insufficient Funds";
          errorDesc = "You do not have enough deposited funds in the Odin Canister to complete this trade. Please deposit BTC first.";
        }

        toast({
          title: errorTitle,
          description: errorDesc,
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error('Trade execution error:', e);
      toast({
        title: "Trade Execution Error",
        description: "An unexpected error occurred while executing the trade. Check console for details.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      {/* Buy/Sell Toggle */}
      <Tabs value={tradeType} onValueChange={(value) => setTradeType(value as 'buy' | 'sell')} className="mb-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="buy" className="flex items-center space-x-2" data-testid="tab-buy">
            <ArrowUp className="w-4 h-4" />
            <span>{t('common.buy')}</span>
          </TabsTrigger>
          <TabsTrigger value="sell" className="flex items-center space-x-2" data-testid="tab-sell">
            <ArrowDown className="w-4 h-4" />
            <span>{t('common.sell')}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Quick Amount Buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {quickAmounts.map((amt) => (
          <Button
            key={amt}
            variant="ghost"
            size="sm"
            onClick={() => setAmount(amt.toString())}
            className="flex items-center justify-center space-x-1"
            data-testid={`button-amount-${amt}`}
          >
            {tradeType === 'buy' ? (
              <Bitcoin className="w-3 h-3 text-warning" />
            ) : (
              <DollarSign className="w-3 h-3 text-accent" />
            )}
            <span>{formatNumber(amt)}</span>
          </Button>
        ))}
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <div className="relative">
          <Input
            type="number"
            placeholder={`Amount in ${tradeType === 'buy' ? 'BTC' : tokenSymbol}`}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full pr-16"
            data-testid="input-trade-amount"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium pointer-events-none">
            {tradeType === 'buy' ? 'BTC' : tokenSymbol}
          </div>
        </div>
      </div>

      {/* Estimated Return Preview */}
      {estimatedReturn && (
        <div className="mb-4 p-3 bg-background/50 border border-border rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ArrowRightLeft className="w-4 h-4" />
              <span>You will receive (est.)</span>
            </div>
            <div className="text-right">
              <div className={`font-bold text-lg ${tradeType === 'buy' ? 'text-accent' : 'text-warning'}`}>
                ~{formatNumber(estimatedReturn.amount)} {estimatedReturn.unit}
              </div>
              {estimatedReturn.usdValue && (
                <div className="text-xs text-muted-foreground">
                  ≈ ${formatNumber(estimatedReturn.usdValue, 2)} USD
                </div>
              )}
            </div>
          </div>
          <div className="mt-2 flex items-start gap-1 text-xs text-muted-foreground">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>Estimate based on current price. Actual amount may vary due to slippage and price impact.</span>
          </div>
        </div>
      )}

      {/* Advanced Settings */}
      <div className="mb-4">
        <Button
          variant="ghost"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full text-left"
          data-testid="button-advanced-settings"
        >
          <span className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span className="font-medium">Advanced Settings</span>
          </span>
          <ArrowDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </Button>

        {showAdvanced && (
          <div className="mt-4 p-4 bg-background border border-border rounded-lg">
            <div className="space-y-3">
              <div>
                <label className="text-sm text-muted-foreground">Slippage Tolerance (%)</label>
                <Input
                  type="number"
                  placeholder="0.5"
                  value={slippage}
                  onChange={(e) => setSlippage(e.target.value)}
                  className="mt-1"
                  data-testid="input-slippage"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {
        error && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
            {error}
          </div>
        )
      }

      {/* Trade Button */}
      <Button
        onClick={handleTrade}
        disabled={isLoading}
        className={`w-full py-3 font-bold text-lg transition-colors mb-4 ${!isAuthenticated
          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
          : tradeType === 'buy'
            ? 'bg-accent hover:bg-accent/90 text-accent-foreground'
            : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
          } `}
        data-testid="button-execute-trade"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        ) : (
          <Zap className="w-5 h-5 mr-2" />
        )}
        {!isAuthenticated
          ? 'Connect Wallet to Trade'
          : `Quick ${tradeType === 'buy' ? 'Buy' : 'Sell'} ${amount || '0'} ${tradeType === 'buy' ? 'BTC' : tokenSymbol}`
        }
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        This does not account for price impact
      </p>

      {/* Security Section */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium text-foreground">Data & Security</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-destructive rounded-full"></div>
            <span className="text-sm text-destructive">0 Issues</span>
          </div>
        </div>
      </div>
    </div>
  );
}