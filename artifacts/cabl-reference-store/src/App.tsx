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

import Home from '@/pages/Home';
import CategoryView from '@/pages/CategoryView';
import ProductDetail from '@/pages/ProductDetail';
import Checkout from '@/pages/Checkout';
import Search from '@/pages/Search';
import Favorites from '@/pages/Favorites';

const queryClient = new QueryClient();

function Router() {
  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
      <StoreProvider>
        <Header />
        <RoutedErrorBoundary>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/checkout" component={Checkout} />
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
        <Footer />
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
