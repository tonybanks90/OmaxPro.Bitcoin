import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Zap, 
  Target, 
  Diamond, 
  Settings as SettingsIcon,
  X,
  ChevronRight
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [buySlippage, setBuySlippage] = useState('25');
  const [buyAmount, setBuyAmount] = useState('0.01');
  const [minBuyTip, setMinBuyTip] = useState('0.005');
  const [maxBuyTip, setMaxBuyTip] = useState('0.005');
  const [buyFee, setBuyFee] = useState('0.001');
  const [smartMevProtection, setSmartMevProtection] = useState(true);
  const [activeTab, setActiveTab] = useState('N1');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto bg-background border-border">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl sm:text-2xl font-bold text-foreground">
              Settings
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              data-testid="button-close-settings"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 space-y-2">
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-4">
              PRESETS
            </div>
            
            <Button variant="ghost" className="w-full justify-start h-auto p-3 bg-muted/50">
              <Zap className="w-4 h-4 mr-3 text-accent" />
              <span>Quick Buy</span>
            </Button>

            <Button variant="ghost" className="w-full justify-start h-auto p-3">
              <Target className="w-4 h-4 mr-3 text-muted-foreground" />
              <span>Quick Sell</span>
            </Button>

            <Button variant="default" className="w-full justify-start h-auto p-3 bg-accent/20 border-l-2 border-accent">
              <Diamond className="w-4 h-4 mr-3 text-accent" />
              <span>Buy Sniper</span>
            </Button>

            <Button variant="ghost" className="w-full justify-start h-auto p-3">
              <Target className="w-4 h-4 mr-3 text-muted-foreground" />
              <span>Sell Sniper</span>
            </Button>

            <Button variant="ghost" className="w-full justify-start h-auto p-3">
              <SettingsIcon className="w-4 h-4 mr-3 text-muted-foreground" />
              <span>Customize</span>
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-2">Buy Sniper</h2>
              <p className="text-sm text-muted-foreground">
                Customize trading presets up to 5 different settings.
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-md mb-6">
                <TabsTrigger value="N1">N1</TabsTrigger>
                <TabsTrigger value="N2">N2</TabsTrigger>
                <TabsTrigger value="N3">N3</TabsTrigger>
              </TabsList>

              <TabsContent value="N1" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Buy Slippage */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Buy Slippage</label>
                    <p className="text-xs text-muted-foreground">Loss due to volatility.</p>
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        value={buySlippage}
                        onChange={(e) => setBuySlippage(e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-sm">%</span>
                    </div>
                  </div>

                  {/* Buy Amount */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Buy Amount</label>
                    <p className="text-xs text-muted-foreground">Amount of SOL to snipe with.</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white">≡</span>
                      </div>
                      <Input
                        type="number"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        className="flex-1"
                        step="0.001"
                      />
                    </div>
                  </div>

                  {/* Min Buy Tip */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Minimum Buy Tip</label>
                    <p className="text-xs text-muted-foreground">Minimum tip value.</p>
                    <Input
                      type="number"
                      value={minBuyTip}
                      onChange={(e) => setMinBuyTip(e.target.value)}
                      step="0.001"
                      className="w-full"
                    />
                  </div>

                  {/* Max Buy Tip */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Maximum Buy Tip</label>
                    <p className="text-xs text-muted-foreground">Maximum tip value.</p>
                    <Input
                      type="number"
                      value={maxBuyTip}
                      onChange={(e) => setMaxBuyTip(e.target.value)}
                      step="0.001"
                      className="w-full"
                    />
                  </div>

                  {/* Buy Fee */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Buy Fee</label>
                    <p className="text-xs text-muted-foreground">Extra SOL for validators.</p>
                    <Input
                      type="number"
                      value={buyFee}
                      onChange={(e) => setBuyFee(e.target.value)}
                      step="0.001"
                      className="w-full"
                    />
                  </div>

                  {/* Smart-MEV Protection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Smart-MEV Protection</label>
                    <p className="text-xs text-muted-foreground">Protect from MEV attacks.</p>
                    <div className="flex items-center space-x-4">
                      <Button
                        variant={!smartMevProtection ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSmartMevProtection(false)}
                      >
                        OFF
                      </Button>
                      <Button
                        variant={smartMevProtection ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSmartMevProtection(true)}
                      >
                        ON
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="N2">
                <div className="text-center py-8 text-muted-foreground">
                  N2 preset configuration coming soon...
                </div>
              </TabsContent>

              <TabsContent value="N3">
                <div className="text-center py-8 text-muted-foreground">
                  N3 preset configuration coming soon...
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
