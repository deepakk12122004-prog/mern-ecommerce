import { Link } from "react-router-dom"; 
import useFetch from "../hooks/useFetch"; 
import { getProducts, getCategories } from "../api/productService"; 
import { useCart } from "../context/CartContext"; 
import { formatPrice } from "../utils/formatPrice"; 
import { FREE_SHIPPING_THRESHOLD } from "../utils/pricing"; 
import AsyncContent from "../components/AsyncContent"; 
import ProductGrid from "../components/ProductGrid"; 
import EmptyState from "../components/EmptyState"; 
 
const FEATURES = [ 
  { 
    icon: "\u{1F69A}", 
    title: "Free shipping", 
    text: `On orders over ${formatPrice(FREE_SHIPPING_THRESHOLD)}`, 
  }, 
  { 
    icon: "\u{1F4B5}", 
    title: "Cash on delivery", 
    text: "Pay when your order arrives", 
  }, 
  { 
    icon: "\u{1F4E6}", 
    title: "Order tracking", 
    text: "Follow your order status", 
  }, 
  { 
    icon: "\u26A1", 
    title: "Simple checkout", 
    text: "Order in just a few steps", 
  }, 
]; 
 
function Home() { 
  const { addItem } = useCart(); 
 
  // The 4 newest products, straight from the database 
  const featured = useFetch(() => getProducts({ limit: 4 }), []); 
  const categories = useFetch(() => getCategories(), []); 
 
  const featuredProducts = featured.data ? featured.data.products : []; 
  const categoryList = categories.data || []; 
 
  return ( 
    <> 
      {/* Hero */} 
      <section className="hero"> 
        <div className="container py-5"> 
          <div className="py-md-4 text-center text-md-start"> 
            <h1 className="mb-3"> 
              Shop smarter, 
              <br className="d-none d-md-block" /> live better. 
            </h1> 
            <p className="lead mb-4"> 
              Browse our collection of electronics, fashion, home 
              essentials, and books, all in one place. 
            </p> 
            <div className="d-flex flex-wrap justify-content-center justify-content-md-start 
gap-2"> 
              <Link to="/products" className="btn btn-light btn-lg text-primary"> 
                Shop now 
              </Link> 
              <Link to="/cart" className="btn btn-outline-light btn-lg"> 
                View cart 
              </Link> 
            </div> 
          </div> 
        </div> 
      </section> 
 
      {/* Features */} 
      <section className="feature-strip"> 
        <div className="container py-4"> 
          <div className="row g-3"> 
            {FEATURES.map((f) => ( 
              <div className="col-12 col-sm-6 col-lg-3" key={f.title}> 
                <div className="feature"> 
                  <span className="feature-icon" aria-hidden="true"> 
                    {f.icon} 
                  </span> 
                  <div> 
                    <div className="fw-semibold">{f.title}</div> 
                    <div className="small text-muted">{f.text}</div> 
                  </div> 
                </div> 
              </div> 
            ))} 
          </div> 
        </div> 
      </section> 
 
      <div className="container py-5"> 
        {/* Categories */} 
        {categoryList.length > 0 && ( 
          <section className="mb-5"> 
            <h2 className="section-title mb-3">Shop by category</h2> 
            <div className="row g-3"> 
              {categoryList.map((category) => ( 
                <div className="col-6 col-md-3" key={category}> 
                  <Link 
                    to={`/products?category=${encodeURIComponent(category)}`} 
                    className="category-tile" 
                  > 
                    <span>{category}</span> 
                    <span aria-hidden="true">&rarr;</span> 
                  </Link> 
                </div> 
              ))} 
            </div> 
          </section> 
        )} 
 
        {/* Featured products */} 
        <section> 
          <div className="d-flex justify-content-between align-items-end mb-3"> 
            <h2 className="section-title">Featured products</h2> 
            <Link to="/products" className="fw-semibold text-decoration-none"> 
              View all &rarr; 
            </Link> 
          </div> 
 
          <AsyncContent 
            loading={featured.loading} 
            error={featured.error} 
            onRetry={featured.reload} 
            loadingMessage="Loading featured products..." 
            isEmpty={featuredProducts.length === 0} 
            emptyState={ 
              <EmptyState title="No products yet" message="Check back soon." /> 
            } 
          > 
            <ProductGrid products={featuredProducts} onAddToCart={addItem} /> 
          </AsyncContent> 
        </section> 
      </div> 
    </> 
  ); 
} 
 
export default Home; 