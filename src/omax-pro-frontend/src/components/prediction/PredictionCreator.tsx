
import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Form, FormControl, FormField, FormItem, FormLabel } from '../ui/form';
import { useToast } from '../../hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Sparkles, 
  TrendingUp, 
  Target, 
  Zap, 
  Info, 
  Calendar, 
  Plus, 
  X,
  BarChart3
} from 'lucide-react';

const predictionSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  endDate: z.string().min(1, 'End date is required'),
  marketType: z.enum(['binary', 'multiple_choice', 'compound']),
  options: z.array(z.object({ 
    label: z.string(),
    subOptions: z.array(z.object({ label: z.string() }))
  })).min(2),
});

type PredictionForm = z.infer<typeof predictionSchema>;

interface PredictionTemplate {
  title: string;
  description: string;
  marketType: 'binary' | 'multiple_choice' | 'compound';
  options: { label: string; subOptions: { label: string }[] }[];
}

interface PredictionCreatorProps {
  assetType?: "token" | "crypto" | "stock" | "sports" | "weather";
  assetData?: any;
  onSuccess?: () => void;
}

export function PredictionCreator({ assetType, assetData, onSuccess }: PredictionCreatorProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [selectedTemplate, setSelectedTemplate] = useState<PredictionTemplate | null>(null);
  const [newOption, setNewOption] = useState("");

  const form = useForm<PredictionForm>({
    resolver: zodResolver(predictionSchema),
    defaultValues: {
      title: "",
      description: "",
      endDate: "",
      marketType: "binary",
      options: [{ label: "Yes", subOptions: [] }, { label: "No", subOptions: [] }]
    }
  });

  const marketType = form.watch("marketType");
  const options = form.watch("options");

  const getTemplatesForAsset = (): PredictionTemplate[] => {
    if (!assetType || !assetData) return [];

    const templates: PredictionTemplate[] = [];

    if (assetType === "token" || assetType === "crypto") {
      const currentPrice = assetData.price || assetData.currentPrice || 0;
      const priceTargets = [
        { multiplier: 1.1, label: "10%" },
        { multiplier: 1.5, label: "50%" },
        { multiplier: 2, label: "2x" },
        { multiplier: 5, label: "5x" }
      ];

      priceTargets.forEach(target => {
        const targetPrice = (currentPrice * target.multiplier).toFixed(6);
        templates.push({
          title: `Will ${assetData.name || assetData.ticker} reach $${targetPrice} (${target.label}) by end of month?`,
          description: `Current price: $${currentPrice}. This market resolves YES if ${assetData.name || assetData.ticker} reaches or exceeds $${targetPrice} by the end of the month.`,
          marketType: 'binary',
          options: [{ label: 'Yes', subOptions: [] }, { label: 'No', subOptions: [] }]
        });
      });
    }

    return templates;
  };

  const templates = getTemplatesForAsset();

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
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create prediction',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (data: PredictionForm) => {
    const predictionData = {
      title: data.title,
      description: data.description,
      category: assetType || 'token',
      endDate: new Date(data.endDate).toISOString(),
      expirationTime: new Date(data.endDate).toISOString(),
      resolutionLink: assetData?.id || '',
      marketType: data.marketType,
      creator: 'User',
      options: data.options.map((opt) => ({ label: opt.label, subOptions: [] })),
      tags: [assetType || 'token', assetData?.symbol || assetData?.ticker || assetData?.name].filter(Boolean),
      imageUrl: assetData?.image || assetData?.logoUrl || '',
    };

    createPredictionMutation.mutate(predictionData);
  };

  const addOption = () => {
    if (newOption.trim() && !options.some(opt => opt.label === newOption.trim())) {
      const newOpt = {
        label: newOption.trim(),
        subOptions: marketType === 'compound' ? [{ label: 'Yes' }, { label: 'No' }] : []
      };
      form.setValue('options', [...options, newOpt]);
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      form.setValue('options', options.filter((_, i) => i !== index));
    }
  };

  return (
    <Card className="border-2 border-border/50 shadow-lg bg-gradient-to-br from-surface to-surface/80">
      <CardHeader className="bg-gradient-to-r from-accent/5 via-accent/10 to-accent/5 border-b border-border/30">
        <CardTitle className="text-2xl font-bold flex items-center gap-3">
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              Create Prediction Market
            </div>
            <div className="text-sm font-normal text-muted-foreground mt-1">
              From {assetData?.name || assetData?.ticker || 'Token'}
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <ScrollArea className="max-h-[600px] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Asset Info Card */}
              {assetData && (
                <Card className="border-2 border-border/50 bg-gradient-to-br from-muted/50 to-muted/30 shadow-lg">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {assetData?.image && (
                        <div className="relative">
                          <img
                            src={assetData.image}
                            alt={assetData.name}
                            className="h-16 w-16 rounded-full object-cover ring-2 ring-accent/20"
                          />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                            <TrendingUp className="h-3 w-3 text-accent-foreground" />
                          </div>
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{assetData?.name || assetData?.ticker}</h3>
                          <Badge variant="outline" className="bg-accent/10 border-accent/30 text-accent">
                            {assetType}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {assetData?.ticker && `${assetData.ticker} • `}
                          Current price: ${assetData?.price?.toFixed(6) || '0.00'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Market Type */}
              <div className="space-y-3">
                <Label className="text-base font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-accent" />
                  Market Type
                </Label>
                <FormField
                  control={form.control}
                  name="marketType"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RadioGroup 
                          value={field.value} 
                          onValueChange={(value: any) => {
                            field.onChange(value);
                            if (value === 'binary') {
                              form.setValue('options', [{ label: 'Yes', subOptions: [] }, { label: 'No', subOptions: [] }]);
                            } else if (value === 'multiple_choice') {
                              form.setValue('options', [
                                { label: 'Option A', subOptions: [] },
                                { label: 'Option B', subOptions: [] },
                                { label: 'Option C', subOptions: [] }
                              ]);
                            } else if (value === 'compound') {
                              form.setValue('options', [
                                { label: 'Team A', subOptions: [{ label: 'Yes' }, { label: 'No' }] },
                                { label: 'Team B', subOptions: [{ label: 'Yes' }, { label: 'No' }] }
                              ]);
                            }
                          }}
                        >
                          <div className="grid grid-cols-3 gap-3">
                            <Card className={`cursor-pointer transition-all ${field.value === 'binary' ? 'border-2 border-accent bg-accent/5' : 'border-2 border-border/50 hover:border-accent/50'}`}>
                              <CardContent className="p-3 flex items-center gap-2">
                                <RadioGroupItem value="binary" id="binary" />
                                <Label htmlFor="binary" className="font-medium cursor-pointer flex-1">
                                  <div className="text-sm font-semibold">Binary</div>
                                  <div className="text-xs text-muted-foreground">Yes/No</div>
                                </Label>
                              </CardContent>
                            </Card>
                            <Card className={`cursor-pointer transition-all ${field.value === 'multiple_choice' ? 'border-2 border-accent bg-accent/5' : 'border-2 border-border/50 hover:border-accent/50'}`}>
                              <CardContent className="p-3 flex items-center gap-2">
                                <RadioGroupItem value="multiple_choice" id="multiple" />
                                <Label htmlFor="multiple" className="font-medium cursor-pointer flex-1">
                                  <div className="text-sm font-semibold">Multiple</div>
                                  <div className="text-xs text-muted-foreground">3+ options</div>
                                </Label>
                              </CardContent>
                            </Card>
                            <Card className={`cursor-pointer transition-all ${field.value === 'compound' ? 'border-2 border-accent bg-accent/5' : 'border-2 border-border/50 hover:border-accent/50'}`}>
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
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

              {/* Quick Templates */}
              {templates.length > 0 && (
                <>
                  <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Zap className="h-4 w-4 text-accent" />
                      Quick Templates
                      <span className="text-xs font-normal text-muted-foreground">(Click to use)</span>
                    </Label>
                    <div className="grid grid-cols-1 gap-2">
                      {templates.slice(0, 3).map((template, index) => (
                        <Button
                          key={index}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="justify-start text-left h-auto py-3 px-4 border-2 hover:border-accent hover:bg-accent/5 transition-all"
                          onClick={() => {
                            form.setValue('title', template.title);
                            form.setValue('description', template.description);
                            form.setValue('marketType', template.marketType);
                            form.setValue('options', template.options);
                          }}
                        >
                          <div className="flex items-start gap-3 w-full">
                            <BarChart3 className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" />
                            <span className="text-sm flex-1">{template.title}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />
                </>
              )}

              {/* Title */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold flex items-center gap-2">
                      <Info className="h-4 w-4 text-accent" />
                      Prediction Question *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="What do you want to predict?"
                        className="border-2 focus:border-accent h-11"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">
                      Description & Resolution Criteria *
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe how this market will be resolved and any important details..."
                        className="border-2 focus:border-accent min-h-[120px] resize-none"
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Be specific about how and when the prediction will be resolved
                    </p>
                  </FormItem>
                )}
              />

              {/* End Date */}
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-accent" />
                      Resolution Date *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="datetime-local"
                        className="border-2 focus:border-accent h-11"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

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
                                type="button"
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
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                      className="border-2 focus:border-accent"
                    />
                    <Button type="button" onClick={addOption} variant="outline" className="border-2 hover:border-accent">
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  className="flex-1 border-2"
                  data-testid="button-reset"
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={createPredictionMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-accent to-accent/80 hover:from-accent/90 hover:to-accent/70"
                  data-testid="button-create-prediction"
                >
                  {createPredictionMutation.isPending ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Create Market
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}