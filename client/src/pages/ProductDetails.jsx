import { useState } from "react"; 
import { Link, useParams } from "react-router-dom"; 
import useFetch from "../hooks/useFetch"; 
import { getProductById } from "../api/productService"; 
import { useAuth } from "../context/AuthContext"; 
import { useCart } from "../context/CartContext"; 
import { formatPrice } from "../utils/formatPrice"; 
import { optimizeImage } from "../utils/imageUrl"; 
import { FREE_SHIPPING_THRESHOLD } from "../utils/pricing"; 
import AsyncContent from "../components/AsyncContent"; 
import EmptyState from "../components/EmptyState"; 
 
// Split into two components: the outer one loads the data, 
// the inner one shows it (so it only renders once `product` exists). 
function ProductInfo({ product }) { 
  const { user } = useAuth(); 
  const { addItem } = useCart(); 
  const [quantity, setQuantity] = useState(1); 
  const [feedback, setFeedback] = useState(null); 
 
  const inStock = product.stock > 0; 
  const maxQuantity = Math.min(product.stock, 10); 
  const isAdmin = Boolean(user && user.role === "admin"); 
 
  const handleAdd = () => { 
    setFeedback(addItem(product, quantity)); 
  }; 
 
  return ( 
    <div className="card"> 
      <div className="card-body p-3 p-md-4"> 
        <div className="row g-4 g-lg-5"> 
          <div className="col-12 col-md-6"> 
            <div className="detail-media"> 
              {product.image?.url ? ( 
                <img 
                  src={optimizeImage(product.image.url, 900)} 
                  alt={product.name} 
                /> 
              ) : ( 
                <div className="img-placeholder" aria-hidden="true"> 
                  {(product.name || "?").charAt(0).toUpperCase()} 
                </div> 
              )} 
            </div> 
          </div> 
 
          <div className="col-12 col-md-6"> 
            <span className="product-category">{product.category}</span> 
            <h1 className="h2 mt-1 mb-2">{product.name}</h1> 
            <p className="price-lg">{formatPrice(product.price)}</p> 
 
            <span 
              className={`badge mb-3 ${inStock ? "bg-success" : "bg-danger"}`} 
            > 
              {inStock 
                ? `In stock (${product.stock} available)` 
                : "Out of stock"} 
            </span> 
 
            <p className="text-muted">{product.description}</p> 
 
            {isAdmin && ( 
              <Link 
                to={`/admin/products/${product._id}/image`} 
                className="btn btn-outline-secondary btn-sm mb-2" 
              > 
                Change image (admin) 
              </Link> 
            )} 
            <hr /> 
 
            {inStock && ( 
              <div className="d-flex flex-wrap align-items-center gap-3 mb-3"> 
                <label htmlFor="quantity" className="fw-semibold mb-0"> 
                  Quantity 
                </label> 
                <select 
                  id="quantity" 
                  className="form-select w-auto" 
                  value={quantity} 
                  onChange={(e) => setQuantity(Number(e.target.value))} 
                > 
                  {Array.from({ length: maxQuantity }, (_, i) => i + 1).map( 
                    (n) => ( 
                      <option key={n} value={n}> 
                        {n} 
                      </option> 
                    ) 
                  )} 
                </select> 
                <button 
                  type="button" 
                  className="btn btn-primary btn-lg flex-grow-1 flex-sm-grow-0" 
                  onClick={handleAdd} 
                > 
                  Add to cart 
                </button> 
              </div> 
            )} 
 
            {feedback && ( 
              <div 
                className={`alert ${ 
                  feedback.ok ? "alert-success" : "alert-warning" 
                }`} 
                role="status" 
              > 
                {feedback.message} <Link to="/cart">View cart</Link> 
              </div> 
            )} 
 
            <ul className="perk-list list-unstyled mb-0"> 
              <li> 
                Free shipping on orders over{" "} 
                {formatPrice(FREE_SHIPPING_THRESHOLD)} 
              </li> 
              <li>Cash on delivery available</li> 
            </ul> 
          </div> 
        </div> 
      </div> 
    </div> 
  ); 
} 
 
function ProductDetails() { 
  const { id } = useParams(); // the :id from the URL 
  const { 
    data: product, 
    loading, 
    error, 
    errorStatus, 
    reload, 
  } = useFetch(() => getProductById(id), [id]); 
 
  // 400 = not a valid id, 404 = no such product. Neither can be 
  // fixed by retrying, so no Retry button. 
  const notFound = errorStatus === 400 || errorStatus === 404; 
 
  return ( 
    <div className="container py-4 py-lg-5"> 
      <Link 
        to="/products" 
        className="btn btn-link ps-0 mb-2 text-decoration-none" 
      > 
        &larr; Back to products 
      </Link> 
 
      <AsyncContent 
        loading={loading} 
        error={notFound ? "" : error} 
        onRetry={reload} 
        loadingMessage="Loading product..." 
        isEmpty={notFound} 
        emptyState={ 
          <EmptyState 
            title="Product not found" 
            message="It may have been removed or the link may be wrong." 
            actionLabel="Browse products" 
            actionTo="/products" 
          /> 
        } 
      > 
        <ProductInfo product={product} /> 
      </AsyncContent> 
    </div> 
  ); 
} 
 
export default ProductDetails;