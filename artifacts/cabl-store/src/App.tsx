import { lazy, Suspense, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { StoreShell } from '@/components/store-shell';
import { WebMcpTools } from '@/components/webmcp-tools';
import { StoreProvider } from '@/lib/store';
import NotFound from '@/pages/not-found';

const BrandCategoryPage = lazy(() => import('@/pages/store-pages').then((module) => ({ default: module.BrandCategoryPage })));
const BrandPage = lazy(() => import('@/pages/store-pages').then((module) => ({ default: module.BrandPage })));
const CanonicalProductPage = lazy(() => import('@/pages/store-pages').then((module) => ({ default: module.CanonicalProductPage })));
const CartPage = lazy(() => import('@/pages/store-pages').then((module) => ({ default: module.CartPage })));
const CategoryPage = lazy(() => import('@/pages/store-pages').then((module) => ({ default: module.CategoryPage })));
const CategoryPageForSlug = lazy(() => import('@/pages/store-pages').then((module) => ({ default: module.CategoryPageForSlug })));
const CheckoutPage = lazy(() => import('@/pages/store-pages').then((module) => ({ default: module.CheckoutPage })));
const ComparePage = lazy(() => import('@/pages/store-pages').then((module) => ({ default: module.ComparePage })));
const HomePage = lazy(() => import('@/pages/store-pages').then((module) => ({ default: module.HomePage })));
const OrderPage = lazy(() => import('@/pages/store-pages').then((module) => ({ default: module.OrderPage })));
const OrdersPage = lazy(() => import('@/pages/store-pages').then((module) => ({ default: module.OrdersPage })));
const ProductPage = lazy(() => import('@/pages/store-pages').then((module) => ({ default: module.ProductPage })));
const SearchPage = lazy(() => import('@/pages/store-pages').then((module) => ({ default: module.SearchPage })));

const AboutPage = lazy(() => import('@/pages/content-pages').then((module) => ({ default: module.AboutPage })));
const ArticlePage = lazy(() => import('@/pages/content-pages').then((module) => ({ default: module.ArticlePage })));
const ContactPage = lazy(() => import('@/pages/content-pages').then((module) => ({ default: module.ContactPage })));
const FAQPage = lazy(() => import('@/pages/content-pages').then((module) => ({ default: module.FAQPage })));
const LabPage = lazy(() => import('@/pages/content-pages').then((module) => ({ default: module.LabPage })));
const LocationPage = lazy(() => import('@/pages/content-pages').then((module) => ({ default: module.LocationPage })));
const ReturnPage = lazy(() => import('@/pages/content-pages').then((module) => ({ default: module.ReturnPage })));
const SeoGuidePage = lazy(() => import('@/pages/content-pages').then((module) => ({ default: module.SeoGuidePage })));
const SeoGuidesIndexPage = lazy(() => import('@/pages/content-pages').then((module) => ({ default: module.SeoGuidesIndexPage })));
const ShippingPage = lazy(() => import('@/pages/content-pages').then((module) => ({ default: module.ShippingPage })));
const SolutionPage = lazy(() => import('@/pages/content-pages').then((module) => ({ default: module.SolutionPage })));
const VerifyPage = lazy(() => import('@/pages/content-pages').then((module) => ({ default: module.VerifyPage })));

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } });

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

const publicCategoryAliases: Record<string, string> = {
  cables: 'charging-cables',
  'hubs-adapters': 'phone-accessories',
  'car-accessories': 'travel-adapters',
};

function PublicCategoryPage() {
  const { categorySlug = '' } = useParams<{ categorySlug: string }>();
  return <CategoryPageForSlug slug={publicCategoryAliases[categorySlug] || categorySlug} />;
}

function HomeRoute() {
  return (
    <Suspense fallback={
      <section className="reference-hero" aria-busy="true">
        <div className="container reference-hero-inner">
          <div className="reference-hero-copy">
            <span className="eyebrow">CABL / اليمن</span>
            <h1>أصلي يعيش معك..<br /><em>وتورّثه لعيالك.</em></h1>
            <p>منتجات أصلية من براندات تعرفها، تستاهل مكانها على طاولتك.</p>
            <a href={`${import.meta.env.BASE_URL}search`} className="reference-hero-cta">تسوّق المنتجات <span aria-hidden="true">←</span></a>
            <div className="reference-hero-note">اختيارات من كتالوج CABL الحالي</div>
          </div>
          <div className="reference-hero-media" aria-hidden="true">
            <div className="reference-hero-loading" />
          </div>
        </div>
      </section>
    }>
      <HomePage />
    </Suspense>
  );
}

function Router() {
  return <StoreShell><RoutedErrorBoundary><Suspense fallback={null}><Switch>
    <Route path="/" component={HomeRoute}/>
    <Route path="/category/:slug" component={CategoryPage}/>
    <Route path="/brand/:brandSlug/:categorySlug" component={BrandCategoryPage}/>
    <Route path="/brand/:slug" component={BrandPage}/>
    <Route path="/product/:slug" component={ProductPage}/>
    <Route path="/:brandSlug/:categorySlug/:productSlug" component={CanonicalProductPage}/>
    <Route path="/search" component={SearchPage}/>
    <Route path="/compare" component={ComparePage}/>
    <Route path="/cart" component={CartPage}/>
    <Route path="/checkout" component={CheckoutPage}/>
    <Route path="/orders" component={OrdersPage}/>
    <Route path="/order/:id" component={OrderPage}/>
    <Route path="/guides" component={SeoGuidesIndexPage}/>
    <Route path="/guides/:slug" component={SeoGuidePage}/>
    <Route path="/about" component={AboutPage}/>
    <Route path="/blog/:slug" component={ArticlePage}/>
    <Route path="/locations/:slug" component={LocationPage}/>
    <Route path="/solutions/:slug" component={SolutionPage}/>
    <Route path="/lab" component={LabPage}/>
    <Route path="/verify" component={VerifyPage}/>
    <Route path="/shipping" component={ShippingPage}/>
    <Route path="/return-policy" component={ReturnPage}/>
    <Route path="/faq" component={FAQPage}/>
    <Route path="/contact" component={ContactPage}/>
    <Route path="/:categorySlug" component={PublicCategoryPage}/>
    <Route path="/:brandSlug/:categorySlug" component={BrandCategoryPage}/>
    <Route component={NotFound}/>
  </Switch></Suspense></RoutedErrorBoundary></StoreShell>;
}

function App() {
  return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><StoreProvider><WebMcpTools/><Router/></StoreProvider></WouterRouter></QueryClientProvider>;
}

export default App;