import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Copy, Users, DollarSign, Clock, Gift, Star, History, LogIn, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '../hooks/use-toast';
import { Alert, AlertDescription } from '../components/ui/alert';

export default function EarnPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState('omax/@');
  const [selectedPlanet, setSelectedPlanet] = useState('earth');

  // Authentication hook
  const { 
    isReady: authReady, 
    isAuthenticated, 
    identity, 
    principalId, 
    login, 
    logout 
  } = useAuth();

  const planets = [
    { id: 'earth', name: 'Earth', level: 1, unlocked: true, icon: '🌍', color: 'from-green-500 to-blue-500' },
    { id: 'moon', name: 'Moon', level: 2, unlocked: false, icon: '🌙', color: 'from-gray-400 to-gray-600' },
    { id: 'mars', name: 'Mars', level: 3, unlocked: false, icon: '🔴', color: 'from-red-500 to-orange-500' }
  ];

  const handleCopyReferral = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to copy your referral code",
        variant: "destructive"
      });
      return;
    }
    
    navigator.clipboard.writeText(referralCode);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard",
    });
  };

  // Show authentication required screen
  if (authReady && !isAuthenticated) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="page-earn">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="text-4xl mb-4">🌟</div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {t('nav.earn')}
                </h2>
                <p className="text-muted-foreground">
                  Sign in with Internet Identity to access the referral program, track your earnings, and unlock planet levels.
                </p>
              </div>
              
              <Button 
                onClick={login}
                className="w-full"
                size="lg"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Sign in with Internet Identity
              </Button>
              
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Secure Earnings:</strong> Your referral progress and earnings are securely stored on the Internet Computer blockchain.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  // Show loading while auth is initializing
  if (!authReady) {
    return (
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading authentication...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto px-4 sm:px-6 lg:px-8 py-6" data-testid="page-earn">
      {/* User Info Banner */}
      <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Signed in as: {principalId?.slice(0, 8)}...{principalId?.slice(-6)}
              </p>
              <p className="text-xs text-green-600">
                ✅ Ready to earn rewards
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={logout}
            className="text-green-700 border-green-300 hover:bg-green-100"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-page-title">
          {t('nav.earn')}
        </h1>
        <p className="text-muted-foreground">Get a bonus as you share to people.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Planet Selection */}
        <div className="xl:col-span-1">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="text-4xl mb-2">🌟</div>
                <h3 className="text-lg font-bold text-foreground mb-1">Total BTC Earned on that Day</h3>
                <div className="text-6xl font-bold text-foreground mb-4" data-testid="text-total-earned">0</div>
                <div className="bg-accent text-accent-foreground px-4 py-2 rounded-lg inline-block">
                  Coming Soon
                </div>
              </div>

              {/* Planet Levels */}
              <div className="space-y-4">
                {planets.map((planet) => (
                  <div 
                    key={planet.id}
                    className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                      selectedPlanet === planet.id 
                        ? 'border-accent bg-accent/10' 
                        : 'border-border hover:border-accent/50'
                    } ${!planet.unlocked ? 'opacity-50' : ''}`}
                    onClick={() => planet.unlocked && setSelectedPlanet(planet.id)}
                    data-testid={`planet-${planet.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${planet.color} flex items-center justify-center text-2xl`}>
                        {planet.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">{planet.name}</h4>
                        <p className="text-sm text-muted-foreground">Level {planet.level}</p>
                      </div>
                      {!planet.unlocked && (
                        <div className="ml-auto">
                          <div className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs">Locked</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Level Progress */}
              <Card className="mt-6 bg-background border-border">
                <CardContent className="p-4">
                  <div className="text-center">
                    <h4 className="font-medium text-foreground mb-2">Complete previous level to unlock</h4>
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                        <circle
                          cx="60"
                          cy="60"
                          r="54"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          className="text-border"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="54"
                          stroke="currentColor"
                          strokeWidth="8"
                          fill="transparent"
                          strokeDasharray={`${0 * 3.39} 339`}
                          className="text-accent"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-foreground">0%</div>
                          <div className="text-xs text-muted-foreground">Progress</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Target</span>
                        <span className="text-foreground font-medium" data-testid="text-target-amount">$ 0</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Rewards</span>
                        <span className="text-foreground font-medium">❌</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>

        {/* Referral System */}
        <div className="xl:col-span-2">
          {/* Referral Link */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground">Your Referral Link</h3>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    data-testid="button-copy-link"
                    onClick={handleCopyReferral}
                  >
                    Copy
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    data-testid="button-connect-wallet"
                    onClick={() => {
                      toast({
                        title: "Coming Soon",
                        description: "Wallet connection feature will be available soon",
                      });
                    }}
                  >
                    Connect 🔗
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 bg-accent text-accent-foreground p-3 rounded-lg">
                <Users className="w-5 h-5" />
                <Input
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                  className="bg-transparent border-none text-accent-foreground placeholder:text-accent-foreground/70"
                  data-testid="input-referral-code"
                />
                <Button 
                  size="icon" 
                  variant="ghost" 
                  onClick={handleCopyReferral}
                  data-testid="button-copy-referral"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                Access code sharing is exclusively available to qualified Omax partners.
              </p>
            </CardContent>
          </Card>

          {/* Referral History */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="w-5 h-5" />
                <span>Referral History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Amount of Referrals</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-referral-count">0</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Referred Volume</p>
                  <p className="text-lg font-bold text-foreground">Coming Soon</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Earnings</p>
                  <p className="text-lg font-bold text-foreground">Coming Soon</p>
                </div>
              </div>

              <div className="text-center py-12">
                <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-accent" />
                </div>
                <h4 className="font-medium text-foreground mb-2">No referral history found!</h4>
                <p className="text-sm text-muted-foreground">Please try again later.</p>
              </div>
            </CardContent>
          </Card>

          {/* Cash Back & Claim History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>CASHBACK</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gift className="w-8 h-8 text-accent" />
                  </div>
                  <h4 className="font-medium text-foreground mb-2">No cashback found!</h4>
                  <p className="text-sm text-muted-foreground">Please try again later.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>CLAIM HISTORY</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-accent" />
                  </div>
                  <h4 className="font-medium text-foreground mb-2">No claim history found!</h4>
                  <p className="text-sm text-muted-foreground">Please try again later.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}