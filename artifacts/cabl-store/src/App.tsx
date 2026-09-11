import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { StoreShell } from '@/components/store-shell';
import { StoreProvider } from '@/lib/store';
import NotFound from '@/pages/not-found';
import { BrandPage, CartPage, CategoryPage, CheckoutPage, HomePage, OrderPage, OrdersPage, ProductPage, SearchPage } from '@/pages/store-pages';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return <StoreShell><RoutedErrorBoundary><Switch>
    <Route path="/" component={HomePage}/>
    <Route path="/category/:slug" component={CategoryPage}/>
    <Route path="/brand/:slug" component={BrandPage}/>
    <Route path="/product/:slug" component={ProductPage}/>
    <Route path="/search" component={SearchPage}/>
    <Route path="/cart" component={CartPage}/>
    <Route path="/checkout" component={CheckoutPage}/>
    <Route path="/orders" component={OrdersPage}/>
    <Route path="/order/:id" component={OrderPage}/>
    <Route component={NotFound}/>
  </Switch></RoutedErrorBoundary></StoreShell>;
}

function App() {
  return <QueryClientProvider client={queryClient}><StoreProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router/></WouterRouter></StoreProvider></QueryClientProvider>;
}

export default App;