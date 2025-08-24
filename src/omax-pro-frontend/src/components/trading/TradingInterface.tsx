import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowUp, ArrowDown, Settings, Zap, DollarSign } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TradingInterfaceProps {
  tokenSymbol: string;
}

export function TradingInterface({ tokenSymbol }: TradingInterfaceProps) {
  const { t } = useLanguage();
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const quickAmounts = [0.1, 0.25, 0.5, 1, 2, 5];

  const handleTrade = () => {
    console.log(`Executing ${tradeType} order for ${amount} ${tokenSymbol}`);
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
      <div className="grid grid-cols-4 gap-2 mb-4">
        <Button variant="outline" size="sm" data-testid="button-preset-w1">W1</Button>
        <Button variant="outline" size="sm" data-testid="button-preset-n1">N1</Button>
        <Button variant="outline" size="sm" data-testid="button-preset-n2">N2</Button>
        <Button variant="outline" size="sm" data-testid="button-preset-n3">N3</Button>
      </div>

      {/* Amount Presets */}
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
            <DollarSign className="w-3 h-3 text-warning" />
            <span>{amt}</span>
          </Button>
        ))}
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <Input
          type="number"
          placeholder="Enter Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full"
          data-testid="input-trade-amount"
        />
      </div>

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
                <label className="text-sm text-muted-foreground">Slippage Tolerance</label>
                <Input type="number" placeholder="0.5" className="mt-1" data-testid="input-slippage" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Gas Price (Gwei)</label>
                <Input type="number" placeholder="Auto" className="mt-1" data-testid="input-gas-price" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trade Button */}
      <Button
        onClick={handleTrade}
        className={`w-full py-3 font-bold text-lg transition-colors mb-4 ${
          tradeType === 'buy' 
            ? 'bg-accent hover:bg-accent/90 text-accent-foreground' 
            : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
        }`}
        data-testid="button-execute-trade"
      >
        <Zap className="w-5 h-5 mr-2" />
        Quick {tradeType === 'buy' ? 'Buy' : 'Sell'} {amount || '0'} SOL
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
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Mint Authority</span>
            <span className="text-sm text-destructive font-medium">Disabled</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Freeze Authority</span>
            <span className="text-sm text-destructive font-medium">Disabled</span>
          </div>
        </div>
      </div>
    </div>
  );
}
