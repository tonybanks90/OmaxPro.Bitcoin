import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { Header } from "./components/common/Header";
import { Footer } from "./components/common/Footer";
import { MobileNavigation } from "./components/common/MobileNavigation";
import TrendingPage from "./pages/TrendingPage";
import TrenchesPage from "./pages/TrenchesPage";
import TokenPage from "./pages/TokenPage";
import WalletPage from "./pages/WalletPage";
import EarnPage from "./pages/EarnPage";
import HoldingsPage from "./pages/HoldingsPage";
import WalletManagerPage from "./pages/WalletManagerPage";
import SniperPage from "./pages/SniperPage";
import NotFound from "./pages/not-found";
import "./index.css";
import { WalletActorProvider } from "./auth/WalletActorProvider";
import { AuthProvider } from "./auth/AuthProvider";
import ComingSoonPage from "./pages/ComingSoonPage";
import TestOdin from './pages/testodin';
import OdinDiagnostic from './pages/OdinDiagnostic';
import CKBoostWallet from "./components/modals/CKBoostWallet";
import CreatePredictionPage from "./pages/CreatePredictionPage";
import PredictionMarketsPage from "./pages/PredictionMarketsPage";
import PredictionMarketDetailPage from "./pages/PredictionMarketDetailPage";
import DiscoveryPage from "./pages/DiscoveryPage";
import DiscoveryCryptoPage from "./pages/DiscoveryCryptoPage";
import DiscoveryStocksPage from "./pages/DiscoveryStocksPage";
import DiscoverySportsPage from "./pages/DiscoverySportsPage";
import DiscoveryWeatherPage from "./pages/DiscoveryWeatherPage";
import DiscoverySearchPage from "./pages/DiscoverySearchPage";


function Router() {
  return (
    <div className="min-h-screen pb-20 md:pb-12">
      <Header />
      <Switch>
        <Route path="/" component={TrendingPage} />
        <Route path="/create-prediction" component={CreatePredictionPage} />
        <Route path="/prediction-markets" component={PredictionMarketsPage} />
        <Route path="/prediction/:id" component={PredictionMarketDetailPage} />
        <Route path="/trending" component={TrendingPage} />
        <Route path="/ckbtcdeposit" component={CKBoostWallet} />
        <Route path="/trenches" component={TrenchesPage} />
        <Route path="/token/:id" component={TokenPage} />
        <Route path="/wallet" component={WalletPage} />
        <Route path="/testodin" component={TestOdin} />
        <Route path="/diagnostic" component={OdinDiagnostic} />



        <Route path="/earn" component={EarnPage} />
        <Route path="/holdings" component={HoldingsPage} />
        <Route path="/wallet-manager" component={WalletManagerPage} />
        <Route path="/sniper" component={SniperPage} />
        <Route path="/discovery" component={DiscoveryPage} />
        <Route path="/discovery/crypto" component={DiscoveryCryptoPage} />
        <Route path="/discovery/stocks" component={DiscoveryStocksPage} />
        <Route path="/discovery/sports" component={DiscoverySportsPage} />
        <Route path="/discovery/weather" component={DiscoveryWeatherPage} />
        <Route path="/discovery/search" component={DiscoverySearchPage} />
        <Route path="/discovery/:category/:id" component={ComingSoonPage} />
        <Route path="/coming-soon" component={ComingSoonPage} />
        <Route path="/discovery">
          {() => <Redirect to="/discovery/crypto" />}
        </Route>
        <Route path="/discovery/crypto" component={DiscoveryCryptoPage} />
        <Route path="/discovery/stocks" component={DiscoveryStocksPage} />
        <Route path="/discovery/sports" component={DiscoverySportsPage} />
        <Route path="/discovery/weather" component={DiscoveryWeatherPage} />
        <Route path="/discovery/search" component={DiscoverySearchPage} />
        <Route path="/discovery/crypto/:id" component={TokenPage} />
        <Route component={NotFound} />
      </Switch>
      <Footer />
      <MobileNavigation />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <TooltipProvider>
            <AuthProvider>
              <WalletActorProvider>
                <div className="min-h-screen bg-background text-foreground transition-colors">
                  <Toaster />
                  <Router />
                </div>
              </WalletActorProvider>
            </AuthProvider>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
