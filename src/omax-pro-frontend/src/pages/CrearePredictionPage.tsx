import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "../components/ui/form";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { X, Plus, Calendar, Link, Hash, User, FileText, Tag, Upload, Image, Coins, BarChart3, TreePine, AlertCircle } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import { useLocation } from "wouter";
import { icService } from "../services/ic-service";
import { Alert, AlertDescription } from "../components/ui/alert";

const createPredictionSchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(200, "Title must be less than 200 characters"),
  description: z.string().min(50, "Description must be at least 50 characters").max(1000, "Description must be less than 1000 characters"),
  category: z.string().min(1, "Category is required"),
  endDate: z.string().min(1, "End date is required"),
  expirationTime: z.string().min(1, "Expiration time is required"),
  resolutionLink: z.string().url("Must be a valid URL for resolution source"),
  resolutionDescription: z.string().optional(),
  predictionType: z.enum(["binary", "multiple", "compound"]),
  creator: z.string().min(3, "Creator name must be at least 3 characters"),
  tags: z.string().optional(),
  imageUrl: z.string().optional(),
  options: z.array(z.object({
    label: z.string().min(1, "Option label is required"),
    subOptions: z.array(z.object({
      label: z.string().min(1, "Sub-option label is required")
    })).optional()
  })).min(1, "At least one option is required")
});

type CreatePredictionForm = z.infer<typeof createPredictionSchema>;

const categories = [
  { value: 'sports', label: 'Sports', icon: '⚽' },
  { value: 'politics', label: 'Politics', icon: '🏛️' },
  { value: 'crypto', label: 'Crypto', icon: '₿' },
  { value: 'tech', label: 'Technology', icon: '💻' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { value: 'ai', label: 'AI', icon: '🤖' },
  { value: 'runes', label: 'Runes', icon: '⚡' }
];

const predictionTypes = [
  {
    value: 'binary',
    label: 'Binary (Yes/No)',
    description: 'Simple yes/no predictions. Creates 2 ICRC-2 ledgers (YES, NO).',
    icon: <Coins className="h-5 w-5" />,
    example: 'Will Bitcoin reach $110K by year end?'
  },
  {
    value: 'multiple',
    label: 'Multiple Choice',
    description: 'Multiple outcome predictions. Creates N ICRC-2 ledgers, one for each outcome.',
    icon: <BarChart3 className="h-5 w-5" />,
    example: 'Who will win the 2025 election? (Candidate A, B, C, etc.)'
  },
  {
    value: 'compound',
    label: 'Compound Predictions',
    description: 'Each outcome has Yes/No sub-predictions. Creates 2 × N ledgers.',
    icon: <TreePine className="h-5 w-5" />,
    example: 'Each team to win group stage? → each team has Yes/No'
  }
];

export default function CreatePredictionPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string>("");

  // Initialize IC Service
  useEffect(() => {
    const initializeService = async () => {
      try {
        await icService.initialize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize IC service:', error);
        setInitError(error instanceof Error ? error.message : 'Failed to initialize IC service');
      }
    };

    initializeService();
  }, []);

  const form = useForm<CreatePredictionForm>({
    resolver: zodResolver(createPredictionSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      endDate: "",
      expirationTime: "",
      resolutionLink: "",
      resolutionDescription: "",
      predictionType: "binary",
      creator: "",
      tags: "",
      imageUrl: "",
      options: [{ label: "Yes", subOptions: [] }, { label: "No", subOptions: [] }]
    }
  });

  const { fields: optionFields, append: addOption, remove: removeOption } = useFieldArray({
    control: form.control,
    name: "options"
  });

  const predictionType = form.watch("predictionType");

  // Update options when prediction type changes
  const handlePredictionTypeChange = (type: "binary" | "multiple" | "compound") => {
    form.setValue("predictionType", type);
    
    if (type === "binary") {
      form.setValue("options", [
        { label: "Yes", subOptions: [] },
        { label: "No", subOptions: [] }
      ]);
    } else if (type === "multiple") {
      form.setValue("options", [
        { label: "Option A", subOptions: [] },
        { label: "Option B", subOptions: [] }
      ]);
    } else if (type === "compound") {
      form.setValue("options", [
        { label: "Team A", subOptions: [{ label: "Yes" }, { label: "No" }] },
        { label: "Team B", subOptions: [{ label: "Yes" }, { label: "No" }] }
      ]);
    }
  };

  const createPredictionMutation = useMutation({
    mutationFn: async (data: CreatePredictionForm) => {
      if (!isInitialized) {
        throw new Error("IC Service not initialized");
      }

      // Prepare market data
      const marketData = {
        title: data.title,
        description: data.description,
        category: data.category,
        endDate: data.endDate,
        expirationTime: data.expirationTime,
        resolutionLink: data.resolutionLink,
        resolutionDescription: data.resolutionDescription || "",
        tags: tags,
        imageUrl: data.imageUrl
      };

      let marketId;

      // Call appropriate IC method based on prediction type
      if (data.predictionType === "binary") {
        marketId = await icService.createBinaryMarket(marketData);
      } else if (data.predictionType === "multiple") {
        const outcomes = data.options.map(option => option.label);
        marketId = await icService.createMultipleChoiceMarket({
          ...marketData,
          outcomes
        });
      } else if (data.predictionType === "compound") {
        const subjects = data.options.map(option => option.label);
        marketId = await icService.createCompoundMarket({
          ...marketData,
          subjects
        });
      } else {
        throw new Error("Invalid prediction type");
      }

      return { marketId, type: data.predictionType };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["markets"] });
      queryClient.invalidateQueries({ queryKey: ["active-markets"] });
      
      toast({
        title: "Prediction Market Created! 🎉",
        description: `Your ${data.type} prediction market has been created successfully with ID: ${data.marketId.toString()}`,
      });
      
      // Navigate to markets page or specific market
      navigate("/prediction-markets");
    },
    onError: (error) => {
      console.error('Market creation error:', error);
      toast({
        title: "Failed to Create Market",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: CreatePredictionForm) => {
    if (!isInitialized) {
      toast({
        title: "Service Not Ready",
        description: "Please wait for the IC service to initialize",
        variant: "destructive"
      });
      return;
    }

    createPredictionMutation.mutate(data);
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 8) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        form.setValue("imageUrl", result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Show initialization error
  if (initError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to connect to Internet Computer: {initError}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show loading state
  if (!isInitialized) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Connecting to Internet Computer...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Prediction Market</h1>
        <p className="text-muted-foreground">
          Create decentralized prediction markets with ICRC-2 tokens on the Internet Computer.
        </p>
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            ✅ Connected to Internet Computer • Each market type creates corresponding ICRC-2 ledgers automatically
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter a clear, specific question"
                            {...field}
                            data-testid="input-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Provide detailed information about resolution criteria, conditions, and important details..."
                            className="min-h-[120px]"
                            {...field}
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-category">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.value} value={category.value}>
                                  <div className="flex items-center gap-2">
                                    <span>{category.icon}</span>
                                    <span>{category.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="creator"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Creator Name
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Your username" 
                              {...field}
                              data-testid="input-creator"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Prediction Type & Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5" />
                    Prediction Type & Token Creation
                  </CardTitle>
                  <CardDescription>
                    Each market type automatically creates ICRC-2 ledgers for trading
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={predictionType} onValueChange={(value) => handlePredictionTypeChange(value as "binary" | "multiple" | "compound")}>
                    <TabsList className="grid w-full grid-cols-3">
                      {predictionTypes.map((type) => (
                        <TabsTrigger 
                          key={type.value} 
                          value={type.value} 
                          className="flex items-center gap-2"
                          onClick={() => handlePredictionTypeChange(type.value as "binary" | "multiple" | "compound")}
                        >
                          {type.icon}
                          <span className="hidden sm:inline">{type.label}</span>
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    
                    {predictionTypes.map((type) => (
                      <TabsContent key={type.value} value={type.value} className="mt-6">
                        <div className="bg-muted/50 rounded-lg p-4 mb-4">
                          <h3 className="font-semibold mb-2">{type.label}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{type.description}</p>
                          <p className="text-sm italic">Example: {type.example}</p>
                        </div>

                        <div className="space-y-4">
                          {optionFields.map((field, index) => (
                            <div key={field.id} className="border rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="font-medium">
                                  {predictionType === "compound" ? `Subject ${index + 1}` : `Option ${index + 1}`}
                                </span>
                                {(predictionType === "multiple" || predictionType === "compound") && optionFields.length > 2 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeOption(index)}
                                    data-testid={`button-remove-option-${index}`}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              
                              <FormField
                                control={form.control}
                                name={`options.${index}.label`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input 
                                        placeholder={
                                          predictionType === "binary" ? (index === 0 ? "Yes" : "No") :
                                          predictionType === "compound" ? "Team/Entity name" : 
                                          "Option label"
                                        }
                                        {...field}
                                        data-testid={`input-option-${index}`}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {predictionType === "compound" && (
                                <div className="mt-3 pl-4 border-l-2 border-muted">
                                  <Label className="text-sm text-muted-foreground">
                                    Tokens created: {field.label || `Subject ${index + 1}`}_YES, {field.label || `Subject ${index + 1}`}_NO
                                  </Label>
                                  <div className="grid grid-cols-2 gap-2 mt-2">
                                    <div className="p-2 bg-green-50 border border-green-200 rounded text-center text-sm">
                                      YES Token
                                    </div>
                                    <div className="p-2 bg-red-50 border border-red-200 rounded text-center text-sm">
                                      NO Token
                                    </div>
                                  </div>
                                </div>
                              )}

                              {predictionType === "multiple" && (
                                <div className="mt-2">
                                  <Label className="text-xs text-muted-foreground">
                                    Creates: {field.label || `Option${index + 1}`}_TOKEN ledger
                                  </Label>
                                </div>
                              )}

                              {predictionType === "binary" && (
                                <div className="mt-2">
                                  <Label className="text-xs text-muted-foreground">
                                    Creates: {field.label.toUpperCase()}_TOKEN ledger
                                  </Label>
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {(predictionType === "multiple" || predictionType === "compound") && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => addOption({ 
                                label: predictionType === "compound" ? 
                                  `Subject ${optionFields.length + 1}` : 
                                  `Option ${optionFields.length + 1}`,
                                subOptions: predictionType === "compound" ? [{ label: "Yes" }, { label: "No" }] : []
                              })}
                              className="w-full"
                              data-testid="button-add-option"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Add {predictionType === "compound" ? "Subject" : "Option"}
                            </Button>
                          )}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>

              {/* Timeline & Resolution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Timeline & Resolution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Betting Close Time</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              {...field}
                              data-testid="input-end-date"
                            />
                          </FormControl>
                          <FormDescription>When betting/trading closes</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="expirationTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Market Expiration</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              {...field}
                              data-testid="input-expiration-time"
                            />
                          </FormControl>
                          <FormDescription>When market resolves and expires</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="resolutionLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Link className="h-4 w-4" />
                          Resolution Source
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="url"
                            placeholder="https://official-source.com" 
                            {...field}
                            data-testid="input-resolution-link"
                          />
                        </FormControl>
                        <FormDescription>Official source for market resolution</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="resolutionDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Resolution Criteria</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Detailed criteria for how this prediction will be resolved..."
                            {...field}
                            data-testid="textarea-resolution-description"
                          />
                        </FormControl>
                        <FormDescription>Clear rules for determining the outcome</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Image Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Market Image
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setImagePreview("");
                          form.setValue("imageUrl", "");
                        }}
                        className="w-full"
                      >
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <Label htmlFor="image-upload" className="cursor-pointer">
                        <span className="text-sm text-muted-foreground">
                          Click to upload image
                        </span>
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </Label>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tags */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      data-testid="input-tag"
                    />
                    <Button 
                      type="button" 
                      onClick={addTag}
                      variant="outline"
                      size="sm"
                      data-testid="button-add-tag"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:bg-muted rounded-sm"
                          data-testid={`button-remove-tag-${tag}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Add up to 8 tags to help users discover your market.
                  </p>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <Button 
                      type="submit" 
                      disabled={createPredictionMutation.isPending || !isInitialized}
                      className="w-full"
                      size="lg"
                      data-testid="button-create-prediction"
                    >
                      {createPredictionMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Creating Market...
                        </div>
                      ) : (
                        "Create Prediction Market"
                      )}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => navigate("/prediction-markets")}
                      className="w-full"
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                  </div>

                  {/* Market Creation Info */}
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      💡 <strong>Token Creation:</strong><br />
                      • Binary: 2 ICRC-2 ledgers (YES, NO)<br />
                      • Multiple: N ledgers (per option)<br />
                      • Compound: 2×N ledgers (YES/NO per subject)
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}