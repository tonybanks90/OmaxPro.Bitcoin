import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { 
  Plus, 
  Target, 
  Zap, 
  Settings, 
  X,
  ArrowUpDown,
  DollarSign,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface SniperTask {
  id: string;
  status: 'migrating' | 'completed';
  token: string;
  snipe: string;
  sol: string;
  progress: number;
  presets: string;
}

export default function SniperPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('migrating');
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationForm, setMigrationForm] = useState({
    type: 'buy',
    wallet: 'W1',
    contractAddress: '',
    tokenName: '',
    amounts: { '0.1': false, '0.25': false, '0.5': false, '1': false, '2': false, '5': false },
    customAmount: '',
    minTokens: '0',
    slippage: '25',
    mode: 'fast',
    priorityFee: '0.001',
    minTipAmount: '0.005',
    maxTipAmount: '0.005'
  });

  const [tasks, setTasks] = useState<SniperTask[]>([]);

  const handleAddTask = () => {
    setShowMigrationModal(true);
  };

  const handleSubmitMigration = () => {
    const newTask: SniperTask = {
      id: Date.now().toString(),
      status: 'migrating',
      token: migrationForm.tokenName || 'Unknown Token',
      snipe: migrationForm.contractAddress.slice(0, 8) + '...',
      sol: migrationForm.customAmount || '0',
      progress: 0,
      presets: Object.keys(migrationForm.amounts).filter(k => migrationForm.amounts[k as keyof typeof migrationForm.amounts]).join(', ') || 'Custom'
    };
    
    setTasks(prev => [...prev, newTask]);
    setShowMigrationModal(false);
    
    // Reset form
    setMigrationForm({
      type: 'buy',
      wallet: 'W1',
      contractAddress: '',
      tokenName: '',
      amounts: { '0.1': false, '0.25': false, '0.5': false, '1': false, '2': false, '5': false },
      customAmount: '',
      minTokens: '0',
      slippage: '25',
      mode: 'fast',
      priorityFee: '0.001',
      minTipAmount: '0.005',
      maxTipAmount: '0.005'
    });
  };

  const migratingTasks = tasks.filter(t => t.status === 'migrating');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="page-sniper">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-page-title">
            Sniper
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={handleAddTask}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            data-testid="button-add-task"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
          {/* <Button variant="outline" data-testid="button-get-premium">
            Get Premium
          </Button> */}
        </div>
      </div>

      {/* Sniper Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-border px-6 pt-6">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="migrating" data-testid="tab-migrating">
                  Snipping ({migratingTasks.length})
                </TabsTrigger>
                <TabsTrigger value="completed" data-testid="tab-completed">
                  Completed ({completedTasks.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="migrating" className="mt-0">
                {migratingTasks.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Target className="w-12 h-12 text-accent" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No active sniper tasks</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Create your first sniper task to start automated trading
                    </p>
                    <Button 
                      onClick={handleAddTask}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                      data-testid="button-create-first-task"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Sniper Task
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Table Header */}
                    <div className="grid grid-cols-6 gap-4 px-4 py-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      <div>Task Status</div>
                      <div>Token</div>
                      <div>Snipe</div>
                      <div>BTC</div>
                      <div>Progress</div>
                      <div>Presets</div>
                    </div>
                    
                    {migratingTasks.map(task => (
                      <div key={task.id} className="grid grid-cols-6 gap-4 px-4 py-3 bg-background border border-border rounded-lg">
                        <div>
                          <Badge variant="outline" className="text-warning border-warning">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Snipping
                          </Badge>
                        </div>
                        <div className="font-medium text-foreground">{task.token}</div>
                        <div className="text-muted-foreground">{task.snipe}</div>
                        <div className="text-foreground">{task.sol}</div>
                        <div>
                          <div className="w-full bg-border rounded-full h-2">
                            <div 
                              className="bg-accent h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-muted-foreground">{task.presets}</div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="mt-0">
                <div className="text-center py-16">
                  <div className="w-24 h-24 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-success" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No completed tasks</h3>
                  <p className="text-sm text-muted-foreground">
                    Completed sniper tasks will appear here
                  </p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Migration Modal */}
      {showMigrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Snipe Migration</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowMigrationModal(false)}
                  data-testid="button-close-migration"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Buy/Sell Toggle */}
              <Tabs value={migrationForm.type} onValueChange={(value) => setMigrationForm(prev => ({ ...prev, type: value }))}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="buy" data-testid="tab-buy">
                    <Zap className="w-4 h-4 mr-2" />
                    Buy
                  </TabsTrigger>
                  <TabsTrigger value="sell" data-testid="tab-sell">
                    <ArrowUpDown className="w-4 h-4 mr-2" />
                    Sell
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Wallet Selection */}
              <div className="flex items-center space-x-2">
                <Select value={migrationForm.wallet} onValueChange={(value) => setMigrationForm(prev => ({ ...prev, wallet: value }))}>
                  <SelectTrigger className="w-24" data-testid="select-migration-wallet">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="W1">W1</SelectItem>
                    <SelectItem value="N1">N1</SelectItem>
                    <SelectItem value="N2">N2</SelectItem>
                    <SelectItem value="N3">N3</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" data-testid="button-settings-migration">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>

              {/* Contract Address */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Enter CA</label>
                <Input
                  placeholder="Enter CA"
                  value={migrationForm.contractAddress}
                  onChange={(e) => setMigrationForm(prev => ({ ...prev, contractAddress: e.target.value }))}
                  data-testid="input-contract-address"
                />
              </div>

              {/* Token Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Token Name</label>
                <Input
                  placeholder="Enter token address"
                  value={migrationForm.tokenName}
                  onChange={(e) => setMigrationForm(prev => ({ ...prev, tokenName: e.target.value }))}
                  data-testid="input-token-name"
                />
              </div>

              {/* Amount Presets */}
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  {Object.keys(migrationForm.amounts).map(amount => (
                    <Button
                      key={amount}
                      variant={migrationForm.amounts[amount as keyof typeof migrationForm.amounts] ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMigrationForm(prev => ({ 
                        ...prev, 
                        amounts: { ...prev.amounts, [amount]: !prev.amounts[amount as keyof typeof prev.amounts] }
                      }))}
                      data-testid={`button-amount-${amount}`}
                    >
                      <DollarSign className="w-3 h-3 mr-1" />
                      {amount}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <Input
                placeholder="Enter Amount"
                value={migrationForm.customAmount}
                onChange={(e) => setMigrationForm(prev => ({ ...prev, customAmount: e.target.value }))}
                data-testid="input-custom-amount"
              />

              {/* Advanced Settings */}
              <div className="space-y-3 bg-background border border-border rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-muted-foreground flex-1">Min amount of token you want to snipe</label>
                  <Input
                    type="number"
                    value={migrationForm.minTokens}
                    onChange={(e) => setMigrationForm(prev => ({ ...prev, minTokens: e.target.value }))}
                    className="w-20"
                    data-testid="input-min-tokens"
                  />
                  <span className="text-xs text-muted-foreground">optional</span>
                </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm text-muted-foreground">Slippage</label>
                  <Input
                    type="number"
                    value={migrationForm.slippage}
                    onChange={(e) => setMigrationForm(prev => ({ ...prev, slippage: e.target.value }))}
                    className="w-16"
                    data-testid="input-slippage"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                  
                  <div className="flex items-center space-x-1 ml-4">
                    <Button
                      size="sm"
                      variant={migrationForm.mode === 'fast' ? 'default' : 'outline'}
                      onClick={() => setMigrationForm(prev => ({ ...prev, mode: 'fast' }))}
                      data-testid="button-fast-mode"
                    >
                      Fast
                    </Button>
                    <Button
                      size="sm"
                      variant={migrationForm.mode === 'secure' ? 'default' : 'outline'}
                      onClick={() => setMigrationForm(prev => ({ ...prev, mode: 'secure' }))}
                      data-testid="button-secure-mode"
                    >
                      Secure
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Priority Fee</label>
                    <Input
                      type="number"
                      value={migrationForm.priorityFee}
                      onChange={(e) => setMigrationForm(prev => ({ ...prev, priorityFee: e.target.value }))}
                      className="mt-1"
                      data-testid="input-priority-fee"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Min Tip Amount</label>
                    <Input
                      type="number"
                      value={migrationForm.minTipAmount}
                      onChange={(e) => setMigrationForm(prev => ({ ...prev, minTipAmount: e.target.value }))}
                      className="mt-1"
                      data-testid="input-min-tip"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Max Tip Amount</label>
                    <Input
                      type="number"
                      value={migrationForm.maxTipAmount}
                      onChange={(e) => setMigrationForm(prev => ({ ...prev, maxTipAmount: e.target.value }))}
                      className="mt-1"
                      data-testid="input-max-tip"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                onClick={handleSubmitMigration}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground py-3"
                data-testid="button-submit-migration"
              >
                <Target className="w-4 h-4 mr-2" />
                Snipe 0 SOL
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Once you click on Snipe, your transaction is sent immediately
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}