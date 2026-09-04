import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
  X,
} from 'lucide-react';

type Product = {
  id: number;
  brand: string;
  name: string;
  price: string;
  color: string;
  category: 'POWER_BANKS' | 'CHARGERS' | 'CABLES' | 'TRAVEL';
  image: string;
  sku?: string;
  warranty?: string;
  tag?: string;
};

type HeroSlide = {
  image: string;
  eyebrow: string;
  title: string;
  body: string;
  action: string;
};

const asset = (name: string) => `${import.meta.env.BASE_URL}images/${name}`;

const products: Product[] = [
  { id: 1, brand: 'Vention', name: '20,000mAh Power Bank / 22.5W', price: '$28.09', color: 'USB-C + USB-A + built-in cable', category: 'POWER_BANKS', image: asset('waslah-powerbank.png'), sku: 'XGYP0-40-TY', warranty: '12-month warranty', tag: 'Retail reference' },
  { id: 2, brand: 'Vention', name: '10,000mAh Power Bank / 22.5W', price: '$24.18 SGD', color: 'Built-in charging cable', category: 'POWER_BANKS', image: asset('waslah-powerbank.png'), tag: 'Retail reference' },
  { id: 3, brand: 'Vention', name: '10,000mAh Power Bank / USB-C + Lightning', price: '$24.82 SGD', color: 'Built-in USB-C + Lightning', category: 'POWER_BANKS', image: asset('waslah-powerbank.png'), tag: 'Retail reference' },
  { id: 4, brand: 'Vention', name: '30W Dual-Port GaN Charger', price: '$11.69', color: 'USB-C + USB-A · EU plug', category: 'CHARGERS', image: asset('waslah-charger.png'), tag: 'Retail reference' },
  { id: 5, brand: 'Vention', name: '30W GaN Charging Kit', price: '$15.90', color: 'Charger + USB-C to USB-C cable', category: 'CHARGERS', image: asset('waslah-charger.png'), tag: 'Bundle-ready' },
  { id: 6, brand: 'Vention', name: '65W 3-Port GaN Charger', price: '$37.59', color: 'C+C+A · 65W / 65W / 60W', category: 'CHARGERS', image: asset('waslah-charger.png'), tag: 'Retail reference' },
  { id: 7, brand: 'Vention', name: '70W 3-Port GaN Charger', price: '$39.90', color: 'C+C+A · 70W / 70W / 22.5W', category: 'CHARGERS', image: asset('waslah-charger.png'), tag: 'Retail reference' },
  { id: 8, brand: 'Vention', name: '100W 3-Port GaN Charger', price: '$79.39', color: 'C+C+A · 100W / 100W / 30W', category: 'CHARGERS', image: asset('waslah-charger.png'), tag: 'Retail reference' },
  { id: 9, brand: 'Vention', name: 'USB-C to USB-C PD100W Cable', price: '$11.27 SGD', color: '100W fast charge', category: 'CABLES', image: asset('waslah-charger.png'), tag: 'Retail reference' },
  { id: 10, brand: 'Vention', name: '65W GaN Universal Travel Adapter', price: '$95.88 SGD', color: 'Universal travel charging', category: 'TRAVEL', image: asset('waslah-adapter.png'), tag: 'Retail reference' },
];

const heroes: HeroSlide[] = [
  {
    image: asset('waslah-hero.png'),
    eyebrow: 'The Vention shortlist',
    title: 'Charge the next move.',
    body: 'Ten focused products for a smarter charging shelf, ready for wholesale pricing.',
    action: 'Explore the shortlist',
  },
  {
    image: asset('waslah-charger.png'),
    eyebrow: 'Power, without the bulk',
    title: 'GaN that earns its space.',
    body: 'From 30W everyday kits to 100W multi-port chargers, selected for the region.',
    action: 'Shop chargers',
  },
  {
    image: asset('waslah-adapter.png'),
    eyebrow: 'Ready for the road',
    title: 'One adapter. More places.',
    body: 'A 65W universal travel adapter for customers who need one setup everywhere.',
    action: 'Shop travel',
  },
];

const categories = [
  { name: 'Power Banks', count: '3 products', image: asset('waslah-powerbank.png'), filter: 'POWER_BANKS' },
  { name: 'GaN Chargers', count: '5 products', image: asset('waslah-charger.png'), filter: 'CHARGERS' },
  { name: 'Cables', count: '1 product', image: asset('waslah-charger.png'), filter: 'CABLES' },
  { name: 'Travel & Car', count: '1 product', image: asset('waslah-adapter.png'), filter: 'TRAVEL' },
];

const filterOptions = [
  { value: 'ALL', label: 'All products' },
  { value: 'POWER_BANKS', label: 'Power banks' },
  { value: 'CHARGERS', label: 'Chargers' },
  { value: 'CABLES', label: 'Cables' },
  { value: 'TRAVEL', label: 'Travel & car' },
];

function App() {
  const [slide, setSlide] = useState(0);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cart, setCart] = useState<Product[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % heroes.length), 6500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const visibleProducts = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesFilter = activeFilter === 'ALL' || product.category === activeFilter;
      const matchesQuery = !cleanQuery || `${product.brand} ${product.name} ${product.category}`.toLowerCase().includes(cleanQuery);
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const announce = (message: string) => setToast(message);

  const toggleFavorite = (id: number) => {
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
    announce(favorites.includes(id) ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const addToCart = (product: Product) => {
    setCart((current) => current.some((item) => item.id === product.id) ? current : [...current, product]);
    setCartOpen(true);
    announce(`${product.name} added to bag`);
  };

  const chooseCategory = (filter: string) => {
    setActiveFilter(filter);
    scrollTo('discover');
  };

  const submitEmail = () => {
    if (email.trim()) {
      setSubscribed(true);
      announce('You are on the list');
    }
  };

  return (
    <div className="site-shell">
      <div className="top-strip" data-testid="banner-promotion">
        Retail references only · wholesale pricing available on request
        <button type="button" onClick={() => scrollTo('discover')} data-testid="button-promotion-details">View shortlist</button>
      </div>

      <header className="main-header" data-testid="header-storefront">
        <div className="header-inner">
          <div className="header-row">
            <button
              className="mobile-menu"
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileMenuOpen((current) => !current)}
              data-testid="button-open-menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <button className="wordmark" type="button" onClick={() => scrollTo('top')} data-testid="button-wordmark">
              waslah<span>.</span>
            </button>
            <div className="header-actions">
              <button className="header-action" type="button" onClick={() => setSearchOpen((current) => !current)} aria-label="Search" data-testid="button-search">
                <Search /><span>Search</span>
              </button>
              <button className="header-action" type="button" onClick={() => announce(`${favorites.length} saved item${favorites.length === 1 ? '' : 's'}`)} aria-label="Wishlist" data-testid="button-wishlist">
                <Heart /><span>Wishlist</span>
                {favorites.length > 0 && <span className="count-bubble" data-testid="count-wishlist">{favorites.length}</span>}
              </button>
              <button className="header-action" type="button" onClick={() => setCartOpen(true)} aria-label="Shortlist" data-testid="button-cart">
                <ShoppingBag /><span>Shortlist</span>
                {cart.length > 0 && <span className="count-bubble" data-testid="count-cart">{cart.length}</span>}
              </button>
            </div>
          </div>

          <nav className="desktop-nav" aria-label="Main navigation" data-testid="nav-main">
            <button type="button" onClick={() => chooseCategory('POWER_BANKS')} data-testid="nav-power-banks">Power Banks</button>
            <button type="button" onClick={() => chooseCategory('CHARGERS')} data-testid="nav-chargers">Chargers</button>
            <button type="button" onClick={() => chooseCategory('CABLES')} data-testid="nav-cables">Cables</button>
            <button type="button" onClick={() => chooseCategory('TRAVEL')} data-testid="nav-travel">Travel & Car</button>
            <button type="button" onClick={() => chooseCategory('ALL')} data-testid="nav-brands">Vention</button>
            <button className="nav-highlight" type="button" onClick={() => scrollTo('discover')} data-testid="nav-sale">Request quote</button>
          </nav>

          {mobileMenuOpen && (
            <nav className="desktop-nav" aria-label="Mobile navigation" data-testid="nav-mobile">
              <button type="button" onClick={() => chooseCategory('POWER_BANKS')} data-testid="mobile-nav-power-banks">Power Banks</button>
              <button type="button" onClick={() => chooseCategory('CHARGERS')} data-testid="mobile-nav-chargers">Chargers</button>
              <button type="button" onClick={() => chooseCategory('CABLES')} data-testid="mobile-nav-cables">Cables</button>
              <button type="button" onClick={() => chooseCategory('TRAVEL')} data-testid="mobile-nav-travel">Travel & Car</button>
              <button className="nav-highlight" type="button" onClick={() => scrollTo('discover')} data-testid="mobile-nav-quote">Request quote</button>
            </nav>
          )}

          {searchOpen && (
            <div className="search-panel" data-testid="panel-search">
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                 placeholder="Search products, SKU, specs"
                 aria-label="Search products, SKU, specs"
                data-testid="input-search"
              />
              <button className="search-submit" type="button" onClick={() => scrollTo('discover')} aria-label="Submit search" data-testid="button-submit-search">
                <Search size={18} />
              </button>
              {query && (
                <div className="search-suggestions" data-testid="search-results-count">
                   <p>{visibleProducts.length} result{visibleProducts.length === 1 ? '' : 's'} for “{query}”</p>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main id="top">
        <section className="hero" aria-label="Electronics campaigns" data-testid="section-hero">
          {heroes.map((hero, index) => (
            <article className={`hero-frame ${slide === index ? 'active' : ''}`} key={hero.title} aria-hidden={slide !== index}>
              <img src={hero.image} alt={hero.title} data-testid={`img-hero-${index}`} />
              <div className="hero-shade" />
              <div className="hero-copy">
                <span className="eyebrow">{hero.eyebrow}</span>
                <h1>{hero.title}</h1>
                <p>{hero.body}</p>
                <button className="button-light" type="button" onClick={() => scrollTo('discover')} data-testid={`button-hero-${index}`}>{hero.action}</button>
              </div>
            </article>
          ))}
          <div className="hero-controls" data-testid="controls-hero">
            <button className="hero-arrow" type="button" aria-label="Previous campaign" onClick={() => setSlide((current) => (current - 1 + heroes.length) % heroes.length)} data-testid="button-hero-previous"><ArrowLeft size={17} /></button>
            <div className="hero-dots">
              {heroes.map((hero, index) => (
                <button className={`hero-dot ${slide === index ? 'active' : ''}`} type="button" key={hero.title} aria-label={`Show campaign ${index + 1}`} onClick={() => setSlide(index)} data-testid={`button-hero-dot-${index}`} />
              ))}
            </div>
            <button className="hero-arrow" type="button" aria-label="Next campaign" onClick={() => setSlide((current) => (current + 1) % heroes.length)} data-testid="button-hero-next"><ArrowRight size={17} /></button>
          </div>
        </section>

        <section className="section" id="categories" data-testid="section-categories">
          <div className="section-header">
            <div>
              <span className="eyebrow">Start here</span>
              <h2>Power your<br />next move.</h2>
            </div>
            <p>Four focused categories for a charging shelf that covers everyday carry, desk setups, and travel.</p>
          </div>
          <div className="category-grid">
            {categories.map((category) => (
              <button className="category-tile" type="button" key={category.name} onClick={() => chooseCategory(category.filter)} data-testid={`card-category-${category.filter.toLowerCase()}`}>
                <img src={category.image} alt={`${category.name} collection`} data-testid={`img-category-${category.filter.toLowerCase()}`} />
                <span className="category-info">
                  <h3>{category.name}</h3>
                  <span>{category.count} <ChevronDown size={11} /></span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="section campaign-section" id="campaigns" data-testid="section-campaigns">
          <div className="section-header">
            <div>
              <span className="eyebrow">The edit</span>
              <h2>Charge the<br />moment.</h2>
            </div>
            <p>Vention essentials selected for easy product education, clear specifications, and wholesale conversations.</p>
          </div>
          <div className="campaign-grid">
            <article className="campaign-card">
              <img src={asset('waslah-powerbank.png')} alt="Vention power banks" data-testid="img-campaign-season" />
              <span className="campaign-label"><h3>Power<br />on the go.</h3><button type="button" onClick={() => chooseCategory('POWER_BANKS')} data-testid="button-campaign-season">Shop power banks</button></span>
            </article>
            <article className="campaign-card">
              <img src={asset('waslah-charger.png')} alt="Vention GaN chargers" data-testid="img-campaign-women" />
              <span className="campaign-label"><h3>Small<br />but mighty.</h3><button type="button" onClick={() => chooseCategory('CHARGERS')} data-testid="button-campaign-women">Shop chargers</button></span>
            </article>
            <article className="campaign-card">
              <img src={asset('waslah-adapter.png')} alt="Vention travel adapter" data-testid="img-campaign-men" />
              <span className="campaign-label"><h3>Ready<br />to roam.</h3><button type="button" onClick={() => chooseCategory('TRAVEL')} data-testid="button-campaign-men">Shop travel</button></span>
            </article>
          </div>
        </section>

        <section className="section" id="discover" data-testid="section-discover">
          <div className="section-header">
            <div>
              <span className="eyebrow">Curated for your shelf</span>
              <h2>The Vention<br />shortlist.</h2>
            </div>
            <button className="text-link" type="button" onClick={() => { setActiveFilter('ALL'); setQuery(''); }} data-testid="button-view-all">View all products</button>
          </div>
          <div className="product-toolbar">
            <div className="filter-row" role="tablist" aria-label="Product categories">
              {filterOptions.map((filter) => (
                <button className={`filter-button ${activeFilter === filter.value ? 'active' : ''}`} type="button" key={filter.value} onClick={() => setActiveFilter(filter.value)} data-testid={`filter-${filter.value.toLowerCase()}`}>{filter.label}</button>
              ))}
            </div>
            <button className="sort-button" type="button" onClick={() => announce('Showing our latest arrivals')} data-testid="button-sort">Latest arrivals <ChevronDown size={13} /></button>
          </div>
          <div className="product-grid">
            {visibleProducts.map((product) => (
              <article className="product-card" key={product.id} data-testid={`card-product-${product.id}`}>
                <div className="product-image">
                  <img src={product.image} alt={product.name} data-testid={`img-product-${product.id}`} />
                  <button className={`wish-button ${favorites.includes(product.id) ? 'active' : ''}`} type="button" onClick={() => toggleFavorite(product.id)} aria-label={`Save ${product.name}`} data-testid={`button-favorite-${product.id}`}>
                    <Heart size={15} fill={favorites.includes(product.id) ? 'currentColor' : 'none'} />
                  </button>
                  {product.tag && <span className="product-tag">{product.tag}</span>}
                </div>
                <div className="product-details">
                  <div className="product-brand">{product.brand}</div>
                  <div className="product-name">{product.name}</div>
                  <div className="product-price">{product.price}</div>
                  <div className="product-color">{product.color}</div>
                  {product.sku && <div className="product-color">SKU: {product.sku}</div>}
                  {product.warranty && <div className="product-color">{product.warranty}</div>}
                  <button className="text-link" type="button" onClick={() => addToCart(product)} data-testid={`button-add-product-${product.id}`}>Add to shortlist</button>
                </div>
              </article>
            ))}
            {visibleProducts.length === 0 && <div className="empty-products" data-testid="empty-product-results">No products match that search. Try another SKU or category.</div>}
          </div>
        </section>

        <section className="service-band" id="services" aria-label="Shopping services" data-testid="section-services">
          <div className="service-item"><Truck /><span><strong>Shipping-ready shortlist</strong><span>Built for regional sourcing conversations</span></span></div>
          <div className="service-item"><ShieldCheck /><span><strong>Original Vention products</strong><span>SKU and warranty details where supplied</span></span></div>
          <div className="service-item"><Sparkles /><span><strong>Wholesale quote focus</strong><span>Retail references shown, wholesale pricing pending</span></span></div>
        </section>

        <section className="section newsletter" data-testid="section-newsletter">
          <h2>Keep the<br />current moving.</h2>
          <div className="newsletter-right">
            <p>Leave your email to receive the wholesale-ready shortlist and future sourcing updates.</p>
            {subscribed ? (
              <p data-testid="status-subscribed"><strong>You are on the list.</strong> Watch your inbox.</p>
            ) : (
              <div className="email-form">
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your email address" aria-label="Your email address" data-testid="input-newsletter-email" />
                 <button type="button" onClick={submitEmail} data-testid="button-newsletter-submit">Request the list <ArrowRight size={14} /></button>
              </div>
            )}
            <p className="signup-note">By subscribing, you agree to receive marketing emails.</p>
          </div>
        </section>
      </main>

      <footer className="footer" data-testid="footer-storefront">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">namshi.<p>Everything you want to wear, in one place. Curated for the region, ready for wherever you are going.</p></div>
            <div className="footer-col"><h4>Shop</h4><button type="button" onClick={() => chooseCategory('WOMEN')} data-testid="footer-women">Women</button><button type="button" onClick={() => chooseCategory('MEN')} data-testid="footer-men">Men</button><button type="button" onClick={() => chooseCategory('FOOTWEAR')} data-testid="footer-footwear">Footwear</button><button type="button" onClick={() => chooseCategory('ACCESSORIES')} data-testid="footer-accessories">Accessories</button></div>
            <div className="footer-col"><h4>About</h4><button type="button" onClick={() => announce('Our story is coming soon')} data-testid="footer-story">Our story</button><button type="button" onClick={() => announce('Careers are coming soon')} data-testid="footer-careers">Careers</button><button type="button" onClick={() => announce('Download links are coming soon')} data-testid="footer-app">Get the app</button></div>
            <div className="footer-col"><h4>Help</h4><button type="button" onClick={() => scrollTo('services')} data-testid="footer-delivery">Delivery & returns</button><button type="button" onClick={() => announce('Help centre is coming soon')} data-testid="footer-help">Help centre</button><button type="button" onClick={() => announce('Contact form is coming soon')} data-testid="footer-contact">Contact us</button></div>
            <div className="footer-col"><h4>Follow along</h4><button type="button" onClick={() => announce('Instagram link copied')} data-testid="footer-instagram">Instagram</button><button type="button" onClick={() => announce('TikTok link copied')} data-testid="footer-tiktok">TikTok</button><button type="button" onClick={() => announce('Pinterest link copied')} data-testid="footer-pinterest">Pinterest</button></div>
          </div>
          <div className="footer-bottom"><span>© 2024 Namshi. All rights reserved.</span><div className="footer-socials"><button type="button" onClick={() => announce('United Arab Emirates selected')} data-testid="button-country">UAE <ChevronDown size={12} /></button><button type="button" onClick={() => announce('Language selector opened')} data-testid="button-language">EN <ChevronDown size={12} /></button></div></div>
        </div>
      </footer>

      {cartOpen && (
        <div className="drawer-backdrop" role="presentation" onClick={() => setCartOpen(false)} data-testid="overlay-cart">
          <aside className="cart-drawer" role="dialog" aria-label="Shopping bag" onClick={(event) => event.stopPropagation()} data-testid="drawer-cart">
            <div className="drawer-header"><h2>Your bag <span>({cart.length})</span></h2><button className="close-button" type="button" onClick={() => setCartOpen(false)} aria-label="Close bag" data-testid="button-close-cart"><X size={16} /></button></div>
            {cart.length === 0 ? (
              <div className="cart-empty"><div><ShoppingBag size={29} strokeWidth={1.2} /><p>Your bag is waiting for something good.</p><button className="button-dark" type="button" onClick={() => { setCartOpen(false); scrollTo('discover'); }} data-testid="button-start-shopping">Start shopping</button></div></div>
            ) : (
              <>
                <div>
                  {cart.map((product) => <div className="cart-item" key={product.id}><img src={product.image} alt={product.name} /><div className="cart-item-info"><button className="remove-item" type="button" onClick={() => setCart((current) => current.filter((item) => item.id !== product.id))} data-testid={`button-remove-cart-${product.id}`}>Remove</button><strong>{product.brand}</strong><span>{product.name}</span><br /><span>{product.price}</span></div></div>)}
                </div>
                <div className="drawer-total"><span>Subtotal</span><span data-testid="text-cart-total">AED {cart.reduce((total, product) => total + Number(product.price.replace(/[^0-9]/g, '')), 0).toLocaleString()}</span></div>
                <button className="button-dark checkout-button" type="button" onClick={() => announce('Checkout is ready for your next step')} data-testid="button-checkout">Checkout</button>
              </>
            )}
          </aside>
        </div>
      )}
      {toast && <div className="toast-message" role="status" data-testid="status-toast">{toast}</div>}
    </div>
  );
}

export default App;