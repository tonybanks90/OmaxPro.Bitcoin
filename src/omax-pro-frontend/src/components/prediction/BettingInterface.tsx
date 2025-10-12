import React, { useState } from 'react';
import type { PredictionMarket, PredictionOption } from '../../types';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { DollarSign, TrendingUp, TrendingDown, Users, Target } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface BettingInterfaceProps {
  market: PredictionMarket;
  selectedOption?: PredictionOption;
  onOptionSelect: (option: PredictionOption) => void;
}

export function BettingInterface({ market, selectedOption, onOptionSelect }: BettingInterfaceProps) {
  const { t } = useLanguage();
  const [betAmount, setBetAmount] = useState('');
  const [betType, setBetType] = useState<'buy' | 'sell'>('buy');

  const calculatePotentialWinnings = () => {
    if (!selectedOption || !betAmount) return 0;
    const amount = parseFloat(betAmount);
    if (isNaN(amount)) return 0;
    return amount * selectedOption.odds;
  };

  const calculatePotentialProfit = () => {
    const winnings = calculatePotentialWinnings();
    const amount = parseFloat(betAmount) || 0;
    return winnings - amount;
  };

  return (
    <div className="space-y-6">
      {/* Market Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>Betting Options</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {market.options.map((option) => (
              <button
                key={option.id}
                onClick={() => onOptionSelect(option)}
                className={`w-full p-4 rounded-lg border-2 transition-all hover:scale-[1.02] ${
                  selectedOption?.id === option.id
                    ? 'border-accent bg-accent/10'
                    : 'border-border hover:border-accent/50'
                }`}
                data-testid={`betting-option-${option.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                    <div className="text-left">
                      <div className="font-medium text-foreground">{option.label}</div>
                      <div className="text-sm text-muted-foreground">
                        Volume: {option.volume}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg" style={{ color: option.color }}>
                      {option.percentage}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {option.odds.toFixed(2)}x odds
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Betting Interface */}
      {selectedOption && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Place Bet</span>
              </div>
              <Badge style={{ backgroundColor: selectedOption.color + '20', color: selectedOption.color }}>
                {selectedOption.label}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Buy/Sell Toggle */}
            <div className="flex bg-surface rounded-lg p-1">
              <Button
                variant={betType === 'buy' ? 'default' : 'ghost'}
                onClick={() => setBetType('buy')}
                className="flex-1"
                data-testid="button-bet-buy"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Buy Yes
              </Button>
              <Button
                variant={betType === 'sell' ? 'default' : 'ghost'}
                onClick={() => setBetType('sell')}
                className="flex-1"
                data-testid="button-bet-sell"
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                Buy No
              </Button>
            </div>

            {/* Bet Amount */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Bet Amount
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
                <Input
                  type="number"
                  placeholder="0.00"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="pl-10"
                  data-testid="input-bet-amount"
                />
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {['10', '25', '50', '100'].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => setBetAmount(amount)}
                  className="text-sm"
                  data-testid={`button-quick-amount-${amount}`}
                >
                  ${amount}
                </Button>
              ))}
            </div>

            {/* Bet Summary */}
            {betAmount && (
              <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Your Bet:</span>
                  <span className="font-medium">${betAmount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Odds:</span>
                  <span className="font-medium">{selectedOption.odds.toFixed(2)}x</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Potential Winnings:</span>
                  <span className="font-medium text-success">
                    ${calculatePotentialWinnings().toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold border-t border-border pt-2">
                  <span>Potential Profit:</span>
                  <span className={calculatePotentialProfit() >= 0 ? 'text-success' : 'text-destructive'}>
                    ${calculatePotentialProfit().toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Place Bet Button */}
            <Button
              className="w-full"
              disabled={!betAmount || parseFloat(betAmount) <= 0}
              data-testid="button-place-bet"
            >
              Place {betType === 'buy' ? 'Buy' : 'Sell'} Bet - ${betAmount || '0.00'}
            </Button>

            {/* Market Info */}
            <div className="bg-muted/20 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Participants:</span>
                </div>
                <span className="font-medium">{market.participants.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">Total Volume:</span>
                <span className="font-medium">{market.totalVolumeUSD}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}