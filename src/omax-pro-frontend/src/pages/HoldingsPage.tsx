import { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Search, Filter, TrendingUp, DollarSign, Wallet, BarChart3, Settings } from 'lucide-react';

export default function HoldingsPage() {
  useLanguage();
  const [selectedWallet, setSelectedWallet] = useState('W1');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const portfolioStats = {
    invested: '$ 0',
    remaining: '$ 0',
    sold: '$ 0',
    pnl: '0.000%'
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="page-holdings">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-page-title">
          My Holdings
        </h1>
        <p className="text-muted-foreground">View all tokens you've bought</p>
      </div>

      {/* Portfolio Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Wallet className="w-5 h-5 text-accent" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Invested</p>
                <p className="text-lg font-bold text-foreground" data-testid="text-invested">
                  {portfolioStats.invested}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-warning" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-lg font-bold text-foreground" data-testid="text-remaining">
                  {portfolioStats.remaining}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-success" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Sold</p>
                <p className="text-lg font-bold text-foreground" data-testid="text-sold">
                  {portfolioStats.sold}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-destructive" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">P&L</p>
                <p className="text-lg font-bold text-destructive" data-testid="text-pnl">
                  {portfolioStats.pnl}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div className="flex items-center space-x-4">
          {/* Wallet Selector */}
          <Select value={selectedWallet} onValueChange={setSelectedWallet}>
            <SelectTrigger className="w-32" data-testid="select-wallet">
              <div className="flex items-center space-x-2">
                <Wallet className="w-4 h-4 text-accent" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="W1">W1 new</SelectItem>
              <SelectItem value="W2">W2</SelectItem>
              <SelectItem value="W3">W3</SelectItem>
            </SelectContent>
          </Select>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" data-testid="button-preset-n1">N1</Button>
            <Button variant="outline" size="sm" data-testid="button-preset-n2">N2</Button>
            <Button variant="outline" size="sm" data-testid="button-preset-n3">N3</Button>
            <Button variant="ghost" size="icon" className="w-8 h-8" data-testid="button-star">
              <TrendingUp className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8" data-testid="button-settings">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-48"
              data-testid="input-search-holdings"
            />
          </div>

          {/* Filters */}
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            data-testid="button-filters"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      {/* Holdings Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-6 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Token
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Market Cap
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Wallet Name
                  </th>
                  <th className="text-right py-4 px-4 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Remaining
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Empty State */}
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <TrendingUp className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-medium text-foreground mb-2" data-testid="text-empty-holdings-title">
                        Oops, No Holdings Found!
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Try purchasing a token and coming back!
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}