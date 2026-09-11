import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

import { StoreProvider } from '@/lib/StoreContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CairoVoltClone } from '@/components/CairoVoltClone';

import Home from '@/pages/Home';
import CategoryView from '@/pages/CategoryView';
import ProductDetail from '@/pages/ProductDetail';
import Checkout from '@/pages/Checkout';
import Search from '@/pages/Search';
import Favorites from '@/pages/Favorites';

const queryClient = new QueryClient();

function Router() {
  const [location] = useLocation();
  const isCairoVoltRoute =
    location === '/' ||
    location === '/checkout' ||
    location === '/power-banks' ||
    location === '/anker' ||
    location === '/anker/power-banks/anker-powercore-10000' ||
    location === '/anker/power-banks/anker-zolo-a110e-20000';

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
      <StoreProvider>
        {!isCairoVoltRoute && <Header />}
        <RoutedErrorBoundary>
          <Switch>
            <Route path="/" component={() => <CairoVoltClone page="home" />} />
            <Route path="/power-banks" component={() => <CairoVoltClone page="power-banks" />} />
            <Route path="/anker" component={() => <CairoVoltClone page="anker" />} />
            <Route path="/anker/power-banks/anker-powercore-10000" component={() => <CairoVoltClone page="product" />} />
            <Route path="/anker/power-banks/anker-zolo-a110e-20000" component={() => <CairoVoltClone page="product" />} />
            <Route path="/checkout" component={() => <CairoVoltClone page="checkout" />} />
            <Route path="/search" component={Search} />
            <Route path="/favorites" component={Favorites} />
            
            {/* Dynamic routes: catch-all approach */}
            {/* Category or Brand View */}
            <Route path="/:slug" component={CategoryView} />
            
            {/* Product Detail view: /brand/category/product-slug or /category/product-slug */}
            <Route path="/:brandSlug/:categorySlug/:slug" component={ProductDetail} />
            <Route path="/:categorySlug/:slug" component={ProductDetail} />
            
            <Route component={NotFound} />
          </Switch>
        </RoutedErrorBoundary>
        {!isCairoVoltRoute && <Footer />}
      </StoreProvider>
    </div>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
