
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Card, CardContent } from '../ui/card';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { X, Plus, Calendar, TrendingUp, Sparkles, Target, Zap, Info, BarChart3 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface CreatePredictionModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: 'crypto' | 'stocks' | 'sports' | 'weather';
  assetData: any;
}

interface PredictionOption {
  label: string;
  subOptions: { label: string }[];
}

export function CreatePredictionModal({ isOpen, onClose, category, assetData }: CreatePredictionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [marketType, setMarketType] = useState<'binary' | 'multiple_choice' | 'compound'>('binary');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [endDate, setEndDate] = useState('');
  const [options, setOptions] = useState<PredictionOption[]>([
    { label: 'Yes', subOptions: [] },
    { label: 'No', subOptions: [] }
  ]);
  const [newOption, setNewOption] = useState('');

  const createPredictionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/prediction-markets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create prediction');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prediction-markets'] });
      toast({
        title: 'Success!',
        description: 'Your prediction market has been created successfully!',
      });
      onClose();
      resetForm();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create prediction',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setEndDate('');
    setMarketType('binary');
    setOptions(['Yes', 'No']);
    setNewOption('');
  };

  const addOption = () => {
    if (newOption.trim() && !options.some(opt => opt.label === newOption.trim())) {
      const newOpt: PredictionOption = {
        label: newOption.trim(),
        subOptions: marketType === 'compound' ? [{ label: 'Yes' }, { label: 'No' }] : []
      };
      setOptions([...options, newOpt]);
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const getPredictionTemplates = () => {
    switch (category) {
      case 'crypto':
        return {
          suggestions: [
            `Will ${assetData?.name} reach $${(Number(assetData?.currentPrice) * 1.2).toFixed(2)} by end of month?`,
            `Will ${assetData?.name} price increase by 10% in 7 days?`,
            `Will ${assetData?.symbol} market cap exceed $${(Number(assetData?.marketCap) * 1.1).toFixed(0)}?`,
          ],
          defaultDescription: `Current price: $${assetData?.currentPrice} • 24h change: ${assetData?.priceChangePercentage24h}%`,
        };
      case 'stocks':
        return {
          suggestions: [
            `Will ${assetData?.name} (${assetData?.symbol}) close above $${(Number(assetData?.currentPrice) * 1.05).toFixed(2)} this week?`,
            `Will ${assetData?.symbol} stock price increase by 5% in 30 days?`,
            `Will ${assetData?.name} outperform the market this quarter?`,
          ],
          defaultDescription: `Current price: $${assetData?.currentPrice} • Change: ${assetData?.changePercent}%`,
        };
      case 'sports':
        return {
          suggestions: [
            `Will ${assetData?.homeTeam} win against ${assetData?.awayTeam}?`,
            `Will ${assetData?.homeTeam} score more than 2 goals?`,
            `Will the match end in a draw?`,
          ],
          defaultDescription: `${assetData?.eventName} - ${assetData?.league} on ${new Date(assetData?.eventDate).toLocaleDateString()}`,
        };
      case 'weather':
        return {
          suggestions: [
            `Will temperature in ${assetData?.location} exceed ${assetData?.tempMax + 5}°C this week?`,
            `Will it rain in ${assetData?.location} tomorrow?`,
            `Will humidity drop below 50% in ${assetData?.location}?`,
          ],
          defaultDescription: `Current: ${assetData?.temperature}°C, ${assetData?.description}`,
        };
      default:
        return { suggestions: [], defaultDescription: '' };
    }
  };

  const templates = getPredictionTemplates();

  const handleSubmit = () => {
    if (!title || !description || !endDate) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const predictionData = {
      title,
      description,
      category,
      endDate: new Date(endDate).toISOString(),
      expirationTime: new Date(endDate).toISOString(),
      resolutionLink: assetData?.id || '',
      marketType,
      creator: 'User',
      options,
      tags: [category, assetData?.symbol || assetData?.name].filter(Boolean),
      imageUrl: assetData?.image || assetData?.logoUrl || assetData?.homeTeamLogo || '',
    };

    createPredictionMutation.mutate(predictionData);
  };

  const handleMarketTypeChange = (type: 'binary' | 'multiple_choice' | 'compound') => {
    setMarketType(type);
    if (type === 'binary') {
      setOptions([{ label: 'Yes', subOptions: [] }, { label: 'No', subOptions: [] }]);
    } else if (type === 'multiple_choice') {
      setOptions([
        { label: 'Option A', subOptions: [] },
        { label: 'Option B', subOptions: [] },
        { label: 'Option C', subOptions: [] }
      ]);
    } else if (type === 'compound') {
      setOptions([
        { label: 'Team A', subOptions: [{ label: 'Yes' }, { label: 'No' }] },
        { label: 'Team B', subOptions: [{ label: 'Yes' }, { label: 'No' }] }
      ]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-hidden p-0 gap-0 border-2 border-border/50 shadow-2xl bg-gradient-to-br from-surface to-surface/80">
        <DialogHeader className="bg-gradient-to-r from-accent/5 via-accent/10 to-accent/5 px-6 py-4 border-b border-border/30">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <div className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                  Create Prediction Market
                </div>
                <div className="text-sm font-normal text-muted-foreground mt-1">
                  From {category.charAt(0).toUpperCase() + category.slice(1)} Discovery
                </div>
              </div>
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[calc(95vh-80px)]">
          <div className="p-6 space-y-6">
            {/* Asset Info Card */}
            <Card className="border-2 border-border/50 bg-gradient-to-br from-muted/50 to-muted/30 shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {assetData?.image || assetData?.logoUrl ? (
                    <div className="relative">
                      <img
                        src={assetData.image || assetData.logoUrl}
                        alt={assetData.name}
                        className="h-16 w-16 rounded-full object-cover ring-2 ring-accent/20"
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                        <TrendingUp className="h-3 w-3 text-accent-foreground" />
                      </div>
                    </div>
                  ) : null}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg">{assetData?.name || assetData?.eventName}</h3>
                      <Badge variant="outline" className="bg-accent/10 border-accent/30 text-accent">
                        {category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {assetData?.symbol && `${assetData.symbol} • `}
                      {templates.defaultDescription}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prediction Type */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                Market Type
              </Label>
              <RadioGroup value={marketType} onValueChange={(value: any) => handleMarketTypeChange(value)}>
                <div className="grid grid-cols-3 gap-3">
                  <Card className={`cursor-pointer transition-all ${marketType === 'binary' ? 'border-2 border-accent bg-accent/5' : 'border-2 border-border/50 hover:border-accent/50'}`}>
                    <CardContent className="p-3 flex items-center gap-2">
                      <RadioGroupItem value="binary" id="binary" />
                      <Label htmlFor="binary" className="font-medium cursor-pointer flex-1">
                        <div className="text-sm font-semibold">Binary</div>
                        <div className="text-xs text-muted-foreground">Yes/No</div>
                      </Label>
                    </CardContent>
                  </Card>
                  <Card className={`cursor-pointer transition-all ${marketType === 'multiple_choice' ? 'border-2 border-accent bg-accent/5' : 'border-2 border-border/50 hover:border-accent/50'}`}>
                    <CardContent className="p-3 flex items-center gap-2">
                      <RadioGroupItem value="multiple_choice" id="multiple" />
                      <Label htmlFor="multiple" className="font-medium cursor-pointer flex-1">
                        <div className="text-sm font-semibold">Multiple</div>
                        <div className="text-xs text-muted-foreground">3+ options</div>
                      </Label>
                    </CardContent>
                  </Card>
                  <Card className={`cursor-pointer transition-all ${marketType === 'compound' ? 'border-2 border-accent bg-accent/5' : 'border-2 border-border/50 hover:border-accent/50'}`}>
                    <CardContent className="p-3 flex items-center gap-2">
                      <RadioGroupItem value="compound" id="compound" />
                      <Label htmlFor="compound" className="font-medium cursor-pointer flex-1">
                        <div className="text-sm font-semibold">Compound</div>
                        <div className="text-xs text-muted-foreground">Nested</div>
                      </Label>
                    </CardContent>
                  </Card>
                </div>
              </RadioGroup>
            </div>

            <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Quick Templates */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent" />
                Quick Templates
                <span className="text-xs font-normal text-muted-foreground">(Click to use)</span>
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {templates.suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto py-3 px-4 border-2 hover:border-accent hover:bg-accent/5 transition-all"
                    onClick={() => setTitle(suggestion)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      <BarChart3 className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
                      <span className="text-sm flex-1">{suggestion}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-base font-semibold flex items-center gap-2">
                <Info className="h-4 w-4 text-accent" />
                Prediction Question *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What do you want to predict?"
                className="border-2 focus:border-accent h-11"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-base font-semibold">
                Description & Resolution Criteria *
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe how this market will be resolved and any important details..."
                className="border-2 focus:border-accent min-h-[120px] resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Be specific about how and when the prediction will be resolved
              </p>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-base font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-accent" />
                Resolution Date *
              </Label>
              <Input
                id="endDate"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-2 focus:border-accent h-11"
              />
            </div>

            {/* Options (for multiple choice and compound) */}
            {(marketType === 'multiple_choice' || marketType === 'compound') && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Prediction Options</Label>
                <Card className="border-2 border-border/50 bg-muted/30">
                  <CardContent className="p-4 space-y-3">
                    {options.map((option, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Input 
                              value={option.label} 
                              disabled 
                              className="bg-background border-border"
                            />
                          </div>
                          {options.length > 2 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(index)}
                              className="h-10 w-10 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        {marketType === 'compound' && (
                          <div className="ml-4 pl-4 border-l-2 border-muted">
                            <Label className="text-xs text-muted-foreground mb-1 block">Sub-options</Label>
                            <div className="grid grid-cols-2 gap-2">
                              <Input value="Yes" disabled className="text-center bg-background/50" />
                              <Input value="No" disabled className="text-center bg-background/50" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <div className="flex gap-2">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add new option..."
                    onKeyPress={(e) => e.key === 'Enter' && addOption()}
                    className="border-2 focus:border-accent"
                  />
                  <Button onClick={addOption} variant="outline" className="border-2 hover:border-accent">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="border-t border-border/30 bg-gradient-to-r from-muted/30 to-muted/20 px-6 py-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-2"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createPredictionMutation.isPending}
              className="flex-1 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70"
            >
              {createPredictionMutation.isPending ? (
                <>Creating...</>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Create Prediction
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
