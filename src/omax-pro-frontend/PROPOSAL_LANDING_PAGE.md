# Landing Page Proposal: OmaxPro Dapp

## Objective
Create a high-impact, personalized landing page that introduces the **OmaxPro Dapp** and its three core pillars:
1.  **Runes Trading Bot** (Automated Trading)
2.  **Prediction Marketplace** (Forecasting)
3.  **Opinion Marketplace** (Social Sentiment)

## 1. Design Strategy & Theme Integration

### Theme Consistency
The landing page will integrate directly with your existing `ThemeContext` (`src/contexts/ThemeContext.tsx`).
*   **Dynamic Theming**: The page will respond to 'dark' vs 'bitcoin' modes.
    *   **Dark Mode**: Uses `hsl(240, 20%, 6%)` background with Cool Blue/Purple accents.
    *   **Bitcoin Mode**: Uses `hsl(0, 0%, 10%)` background with Gold/Orange accents (`--accent: hsl(33, 100%, 52%)`).
*   **Implementation**: We will use the Tailwind semantic classes (`bg-background`, `text-primary`, `border-accent`) effectively so the switch is seamless.

### Component Logic (shadcn/ui)
We will leverage your extensive `src/components/ui` library to ensure the landing page feels part of the application, not a separate marketing site.
*   **Buttons**: Use `Button` variants (`default` for primary actions, `outline` for secondary).
*   **Cards**: Use `Card`, `CardHeader`, `CardContent` for the "Pillars" section.
*   **Carousel**: Use `Carousel` to showcase active prediction markets or recent trades within the Hero or dedicated sections.
*   **Tabs**: Use `Tabs` to let users toggle between "Trader", "Predictor", and "Opinionated" views without scrolling, if they prefer a compact view.

## 2. Detailed User Flow

We want to guide the user from "Curiosity" to "Action" via their specific niche.

### A. The "New User" Journey
1.  **Entry**: User hits `/`.
2.  **Hero Awareness**: Sees the "Three Pillars" animation.
3.  **Selection**: User identifies with one persona (e.g., "I am a Trader").
    *   *Interaction*: Clicks "Explore Trading" or scrolls to the Trading Section.
4.  **Deep Dive (On Page)**:
    *   The "Trading" section expands or highlights.
    *   They see a live-mockup of the `Sniper` interface (using a `Card`).
    *   They see "Live Stats" (e.g., "BTC Volume: 1,200").
5.  **Conversion**:
    *   Click "Start Trading".
    *   **Route**: Navigate to `/sniper`.
    *   **Context**: We can optionally save `preferred_niche: 'trading'` in LocalStorage to highlight this next time.

### B. The "Returning User" Journey
1.  **Entry**: User hits `/`.
2.  **Recognition**: The `Hero` buttons adapt.
    *   Instead of just "Get Started", show "Launch Dashboard" or "Go to Wallet".
3.  **Fast Track**: User clicks "Launch Dashboard" -> navigates to `/trending` (The main app view).

## 3. Proposed Page Structure

### Section 1: Hero (The Gateway)
*   **Visual**: Large typographic header "Trade. Predict. Discuss."
*   **Interactive**: Three large, interactive cards (or a 3D spline/interactive canvas if performance allows, otherwise CSS animations) representing the 3 products.
*   **UI**: `Button` group: "Launch App" (Primary) and "Learn More" (Ghost).

### Section 2: Smart Feeds (Live Preview)
*Use the `Carousel` component here.*
*   **Trading Feed**: Scroller of recent "Rune Mints".
*   **Prediction Feed**: Scroller of "Hot Markets" (e.g., "Will BTC hit 100k?").
*   **Opinion Feed**: Scroller of "Trending Topics".
*   *Why?* Shows the platform is ALIVE before they even login.

### Section 3: The Three Pillars (Detailed Features)

#### A. Runes Trading Bot (The Sniper)
*   **Layout**: Left-Text, Right-Image (Glassmorphic screenshot of `/sniper`).
*   **Features**: "Limit Orders", "Auto-Snipe", "Mempool Tracking".
*   **Theme**: Green/Emerald glows (or Orange in Bitcoin mode).

#### B. Prediction Markets (The Oracle)
*   **Layout**: Right-Text, Left-Image (Screenshot of `/prediction-markets`).
*   **Features**: "Binary Options", "Sports Betting", "Crypto Price Targets".
*   **Theme**: Purple/Indigo glows.

#### C. The Trenches (Opinion Layer)
*   **Layout**: Center-aligned, community focus.
*   **Features**: "Paid Opinions", "Viral Threads", "Reputation System".
*   **Theme**: Blue/Cyan glows.

### Section 4: Trust & Footer
*   **Stats**: Total Volume, Total Users (Mocked or real if available).
*   **Footer**: Standard links.

## 4. Technical Implementation Steps

1.  **Refactor Routing**:
    *   Move `TrendingPage` to `/app` (or keep as `/trending`).
    *   Set `LandingPage` as `/`.
2.  **Scaffold `src/pages/LandingPage.tsx`**:
    *   Import `useTheme`.
    *   Import layout components (`Header`, `Footer`).
3.  **Build Sub-Components**:
    *   `src/components/landing/HeroSection.tsx`
    *   `src/components/landing/ProductShowcase.tsx` (Reusable for the 3 pillars)
    *   `src/components/landing/LiveFeedCarousel.tsx`
4.  **Connect Data (Optional)**:
    *   If possible, fetch 3 real markets for the Carousel to make it dynamic.

## 5. Mock Code Structure

```tsx
// src/pages/LandingPage.tsx
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { HeroSection } from '@/components/landing/HeroSection';
import { ProductShowcase } from '@/components/landing/ProductShowcase';

export default function LandingPage() {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <HeroSection />
      
      {/* Dynamic spacing based on theme logic if needed, 
          though standard Tailwind classes should suffice */}
      <div className="space-y-32 pb-20">
        <ProductShowcase 
            variant="trading" 
            title="Sniper Bot" 
            align="left" 
        />
        <ProductShowcase 
            variant="prediction" 
            title="Prediction Markets" 
            align="right" 
        />
        <ProductShowcase 
            variant="opinion" 
            title="The Trenches" 
            align="left" 
        />
      </div>
    </div>
  );
}
```
