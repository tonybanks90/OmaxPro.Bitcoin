import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ArrowUpDown, ArrowDown, Zap, AlertTriangle, Clock, DollarSign, Settings, TrendingUp, TrendingDown, Wallet, RefreshCw, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '../../lib/queryClient';

interface SwapComponentProps {
  tokenSymbol?: string;
  tokenId?: string;
}

interface SwapQuote {
  inputAmount: string;
  outputAmount: string;
  rate: number;
  priceImpact: number;
  fee: number;
  estimatedGas: number;
  slippage: number;
}

interface SwapTransaction {
  transactionId: string;
  status: 'pending' | 'confirmed' | 'failed';
  inputToken: string;
  outputToken: string;
  inputAmount: string;
  outputAmount: string;
  timestamp: number;
}

interface TokenInfo {
  symbol: string;
  name: string;
  balance: string;
  icon: string;
  price: string;
  change24h: number;
}

export function SwapComponent({ tokenSymbol = 'ODIN', tokenId }: SwapComponentProps) {
  const { toast } = useToast();
  const [fromToken, setFromToken] = useState('BTC');
  const [toToken, setToToken] = useState(tokenSymbol);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isQuoting, setIsQuoting] = useState(false);
  const [priceImpact, setPriceImpact] = useState(0);
  const [swapRoute, setSwapRoute] = useState('Direct');

  // Available tokens for swapping with more detailed info
  const availableTokens: TokenInfo[] = [
    { 
      symbol: 'BTC', 
      name: 'Bitcoin', 
      balance: '0.00000000',
      icon: '₿',
      price: '$43,250.00',
      change24h: 2.4
    },
    { 
      symbol: 'ckBTC', 
      name: 'Chain Key Bitcoin', 
      balance: '0.00000000',
      icon: '⚡',
      price: '$43,245.00',
      change24h: 2.3
    },
    { 
      symbol: tokenSymbol, 
      name: `${tokenSymbol} Token`, 
      balance: '0.00000000',
      icon: '💎',
      price: '$0.00',
      change24h: 0
    },
  ];

  // Get swap quote with enhanced error handling
  const getSwapQuote = async (from: string, to: string, amount: string): Promise<SwapQuote> => {
    const response = await apiRequest('POST', `/api/swap/quote`, {
      fromToken: from,
      toToken: to,
      amount: amount,
      slippage: slippage
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to get quote');
    }
    
    return data.data;
  };

  // Execute swap transaction with enhanced feedback
  const executeSwap = useMutation({
    mutationFn: async (swapData: {
      fromToken: string;
      toToken: string;
      fromAmount: string;
      toAmount: string;
      slippage: number;
    }) => {
      const response = await apiRequest('POST', '/api/swap/execute', swapData);
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Swap failed');
      }
      
      return data.data;
    },
    onSuccess: (data: SwapTransaction) => {
      toast({
        title: "🎉 Swap Initiated Successfully!",
        description: `Transaction ${data.transactionId.slice(0, 8)}... is being processed`,
      });
      
      // Reset form
      setFromAmount('');
      setToAmount('');
      setPriceImpact(0);
      
      // Invalidate balance queries
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/balances'] });
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Swap Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate quote when amounts change with improved debouncing
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0 && fromToken !== toToken) {
      setIsQuoting(true);
      
      const timer = setTimeout(async () => {
        try {
          const quote = await getSwapQuote(fromToken, toToken, fromAmount);
          setToAmount(quote.outputAmount);
          setPriceImpact(quote.priceImpact);
        } catch (error) {
          console.error('Quote error:', error);
          setToAmount('');
          setPriceImpact(0);
        } finally {
          setIsQuoting(false);
        }
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setToAmount('');
      setIsQuoting(false);
      setPriceImpact(0);
    }
  }, [fromAmount, fromToken, toToken, slippage]);

  const handleSwapDirection = () => {
    const tempToken = fromToken;
    const tempAmount = fromAmount;
    
    setFromToken(toToken);
    setToToken(tempToken);
    setFromAmount(toAmount);
    setToAmount(tempAmount);
  };

  const handleMaxAmount = (tokenSymbol: string) => {
    const token = availableTokens.find(t => t.symbol === tokenSymbol);
    if (token && parseFloat(token.balance) > 0) {
      setFromAmount(token.balance);
    }
  };

  const handleSwap = () => {
    if (!fromAmount || !toAmount || parseFloat(fromAmount) <= 0) {
      toast({
        title: "⚠️ Invalid Amount",
        description: "Please enter a valid amount to swap",
        variant: "destructive",
      });
      return;
    }

    executeSwap.mutate({
      fromToken,
      toToken,
      fromAmount,
      toAmount,
      slippage
    });
  };

  const getFromTokenInfo = () => availableTokens.find(t => t.symbol === fromToken);
  const getToTokenInfo = () => availableTokens.find(t => t.symbol === toToken);
  const isSwapDisabled = !fromAmount || !toAmount || parseFloat(fromAmount) <= 0 || executeSwap.isPending || isQuoting;

  return (
    <Card className="h-full border-2 border-border/50 shadow-lg bg-gradient-to-br from-surface to-surface/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-accent/5 to-accent/10 rounded-t-xl border-b border-border/30">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <ArrowUpDown className="w-5 h-5" />
            </div>
            <span className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent text-xl">
              Advanced Token Swap
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs bg-success/20 text-success border-success/30">
              <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse mr-1"></div>
              Live Pricing
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-muted-foreground hover:text-accent transition-colors"
              data-testid="button-advanced-settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* From Token Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">From</label>
            <div className="flex items-center space-x-2">
              <Wallet className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {getFromTokenInfo()?.balance || '0.00000000'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleMaxAmount(fromToken)}
                className="h-5 px-2 text-xs text-accent hover:text-accent/80"
                data-testid="button-max-from"
              >
                MAX
              </Button>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-background/30 to-background/50 rounded-xl p-4 border-2 border-border/20 hover:border-accent/30 transition-all">
            <div className="flex items-center space-x-3">
              <Select value={fromToken} onValueChange={setFromToken}>
                <SelectTrigger className="w-32 border-none bg-muted/50 hover:bg-muted/70" data-testid="select-from-token">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getFromTokenInfo()?.icon}</span>
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {availableTokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{token.icon}</span>
                        <div className="flex flex-col">
                          <span className="font-medium">{token.symbol}</span>
                          <span className="text-xs text-muted-foreground">{token.name}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex-1 relative">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(e.target.value)}
                  className="text-right text-xl font-bold border-none bg-transparent focus:ring-0 focus:border-none p-0 h-auto"
                  data-testid="input-from-amount"
                />
                {getFromTokenInfo() && (
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    ≈ ${(parseFloat(fromAmount || '0') * parseFloat(getFromTokenInfo()?.price?.replace('$', '').replace(',', '') || '0')).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>{getFromTokenInfo()?.price}</span>
                <div className={`flex items-center space-x-1 ${
                  (getFromTokenInfo()?.change24h || 0) >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {(getFromTokenInfo()?.change24h || 0) >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{Math.abs(getFromTokenInfo()?.change24h || 0).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="flex justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-r from-accent/10 to-accent/5 rounded-full blur-lg"></div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSwapDirection}
            className="relative rounded-full p-3 border-2 border-accent/30 bg-surface hover:bg-accent/10 hover:scale-105 transition-all duration-200 shadow-lg"
            data-testid="button-swap-direction"
          >
            <ArrowDown className="w-5 h-5 text-accent" />
          </Button>
        </div>

        {/* To Token Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground">To</label>
            <div className="flex items-center space-x-2">
              <Wallet className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {getToTokenInfo()?.balance || '0.00000000'}
              </span>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-background/30 to-background/50 rounded-xl p-4 border-2 border-border/20 hover:border-success/30 transition-all">
            <div className="flex items-center space-x-3">
              <Select value={toToken} onValueChange={setToToken}>
                <SelectTrigger className="w-32 border-none bg-muted/50 hover:bg-muted/70" data-testid="select-to-token">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getToTokenInfo()?.icon}</span>
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {availableTokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{token.icon}</span>
                        <div className="flex flex-col">
                          <span className="font-medium">{token.symbol}</span>
                          <span className="text-xs text-muted-foreground">{token.name}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex-1 relative">
                <div className="text-right text-xl font-bold text-success">
                  {isQuoting ? (
                    <div className="flex items-center justify-end space-x-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="text-muted-foreground">Calculating...</span>
                    </div>
                  ) : toAmount ? (
                    toAmount
                  ) : (
                    <span className="text-muted-foreground">0.0</span>
                  )}
                </div>
                {getToTokenInfo() && toAmount && !isQuoting && (
                  <div className="text-right text-xs text-muted-foreground mt-1">
                    ≈ ${(parseFloat(toAmount) * parseFloat(getToTokenInfo()?.price?.replace('$', '').replace(',', '') || '0')).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/20">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span>{getToTokenInfo()?.price}</span>
                <div className={`flex items-center space-x-1 ${
                  (getToTokenInfo()?.change24h || 0) >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {(getToTokenInfo()?.change24h || 0) >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{Math.abs(getToTokenInfo()?.change24h || 0).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        {showAdvanced && (
          <div className="space-y-4 p-4 bg-gradient-to-r from-muted/30 to-muted/10 rounded-xl border border-border/30">
            <div className="flex items-center space-x-2 mb-3">
              <Settings className="w-4 h-4 text-accent" />
              <span className="font-medium text-foreground">Advanced Settings</span>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Slippage Tolerance</label>
                <div className="flex items-center space-x-2">
                  {[0.1, 0.5, 1.0].map((value) => (
                    <Button
                      key={value}
                      variant={slippage === value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSlippage(value)}
                      className={slippage === value ? "bg-accent text-accent-foreground" : ""}
                      data-testid={`button-slippage-${value}`}
                    >
                      {value}%
                    </Button>
                  ))}
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      placeholder="Custom"
                      value={slippage}
                      onChange={(e) => setSlippage(parseFloat(e.target.value) || 0.5)}
                      className="w-20"
                      step="0.1"
                      min="0.1"
                      max="50"
                      data-testid="input-custom-slippage"
                    />
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Swap Route</span>
                <Badge variant="secondary" className="bg-accent/20 text-accent">
                  {swapRoute}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Swap Summary */}
        {fromAmount && toAmount && !isQuoting && (
          <div className="space-y-3 p-4 bg-gradient-to-r from-accent/5 to-accent/10 rounded-xl border border-accent/20">
            <div className="flex items-center space-x-2 mb-3">
              <DollarSign className="w-4 h-4 text-accent" />
              <span className="font-medium text-foreground">Swap Summary</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Exchange Rate</span>
                <span className="font-medium">1 {fromToken} = {(parseFloat(toAmount) / parseFloat(fromAmount)).toFixed(6)} {toToken}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Price Impact</span>
                <span className={`font-medium ${
                  priceImpact > 3 ? 'text-destructive' : priceImpact > 1 ? 'text-orange-500' : 'text-success'
                }`}>
                  {priceImpact.toFixed(3)}%
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Network Fee</span>
                <span className="font-medium">~{(parseFloat(fromAmount) * 0.005).toFixed(8)} {fromToken}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Minimum Received</span>
                <span className="font-medium text-success">{(parseFloat(toAmount) * (1 - slippage / 100)).toFixed(6)} {toToken}</span>
              </div>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <Button
          onClick={handleSwap}
          disabled={isSwapDisabled}
          className="w-full py-4 font-bold text-lg bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
          data-testid="button-execute-swap"
        >
          {executeSwap.isPending ? (
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Processing Swap...</span>
            </div>
          ) : isQuoting ? (
            <div className="flex items-center space-x-3">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Getting Best Price...</span>
            </div>
          ) : fromAmount && toAmount ? (
            <div className="flex items-center space-x-3">
              <Zap className="w-5 h-5" />
              <span>Swap {fromToken} → {toToken}</span>
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <ArrowUpDown className="w-5 h-5" />
              <span>Enter Amount to Swap</span>
            </div>
          )}
        </Button>

        {/* Enhanced Warning Message */}
        {priceImpact > 1 && (
          <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 rounded-xl border-2 border-orange-200 dark:border-orange-800">
            <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold text-orange-700 dark:text-orange-300 mb-2">
                {priceImpact > 3 ? '⚠️ High Price Impact Warning' : '💡 Price Impact Notice'}
              </p>
              <p className="text-orange-600 dark:text-orange-400 mb-2">
                This swap will have a {priceImpact.toFixed(2)}% price impact. {priceImpact > 3 ? 'Consider reducing your swap amount.' : 'This is within acceptable range.'}
              </p>
              <div className="flex items-center space-x-2 text-xs text-orange-500">
                <Clock className="w-3 h-3" />
                <span>Prices update every few seconds based on market conditions</span>
              </div>
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="border-t border-border/30 pt-4 bg-gradient-to-r from-muted/20 to-muted/10 -mx-6 px-6 rounded-b-xl">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse"></div>
              <span>Powered by advanced DEX routing</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>💎 Best rates guaranteed</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}