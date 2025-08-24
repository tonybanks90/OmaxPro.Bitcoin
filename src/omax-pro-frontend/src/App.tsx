import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { MobileNavigation } from "@/components/common/MobileNavigation";
import TrendingPage from "@/pages/TrendingPage";
import TrenchesPage from "@/pages/TrenchesPage";
import TokenPage from "@/pages/TokenPage";
import WalletPage from "@/pages/WalletPage";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen pb-20 md:pb-12">
      <Header />
      <Switch>
        <Route path="/" component={TrendingPage} />
        <Route path="/trending" component={TrendingPage} />
        <Route path="/trenches" component={TrenchesPage} />
        <Route path="/token/:id" component={TokenPage} />
        <Route path="/wallet" component={WalletPage} />
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
            <div className="min-h-screen bg-background text-foreground transition-colors">
              <Toaster />
              <Router />
            </div>
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
