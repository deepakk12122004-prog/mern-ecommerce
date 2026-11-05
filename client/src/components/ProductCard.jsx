import { useState, useEffect } from "react"; 
import { Link } from "react-router-dom"; 
import { formatPrice } from "../utils/formatPrice"; 
import { optimizeImage } from "../utils/imageUrl"; 
 
const LOW_STOCK_LIMIT = 5; 
 
// Props: 
//   product     - { _id, name, price, category, stock, image: { url } } 
//   onAddToCart - optional function(product). It may return 
//                 { ok, message }, which is shown under the button. 
//                 If you don't pass it, the button is not shown. 
function ProductCard({ product, onAddToCart }) { 
  const [feedback, setFeedback] = useState(null); 
 
  // Hide the message after 2 seconds 
  useEffect(() => { 
    if (!feedback) return undefined; 
    const timer = setTimeout(() => setFeedback(null), 2000); 
    return () => clearTimeout(timer); 
  }, [feedback]); 
 
  if (!product) return null; 
 
  const { _id, name, price, category, stock, image } = product; 
  const inStock = stock > 0; 
  const lowStock = inStock && stock <= LOW_STOCK_LIMIT; 
  const detailsPath = `/products/${_id}`; 
  const initial = (name || "?").charAt(0).toUpperCase(); 
 
  const handleAdd = () => { 
    const result = onAddToCart(product); 
    if (result && result.message) setFeedback(result); 
  }; 
 
  return ( 
    <article className="card product-card h-100"> 
      <Link 
        to={detailsPath} 
        className="product-media" 
        aria-label={`View ${name}`} 
      > 
        {image && image.url ? ( 
          <img 
            src={optimizeImage(image.url, 600)} 
            alt={name} 
            loading="lazy" 
          /> 
        ) : ( 
          <div className="img-placeholder" aria-hidden="true"> 
            {initial} 
          </div> 
        )} 
        {!inStock && ( 
          <span className="badge bg-dark product-badge">Sold out</span> 
        )} 
        {lowStock && ( 
          <span className="badge bg-warning text-dark product-badge"> 
            Only {stock} left 
          </span> 
        )} 
      </Link> 
 
      <div className="card-body d-flex flex-column p-3"> 
        {category && <span className="product-category mb-1">{category}</span>} 
 
        <h3 className="product-title"> 
          <Link to={detailsPath}>{name}</Link> 
        </h3> 
 
        <div className="mt-auto pt-2"> 
          <span className="product-price">{formatPrice(price)}</span> 
        </div> 
 
        {onAddToCart && ( 
          <> 
            <button 
              type="button" 
              className="btn btn-primary w-100 mt-3" 
              disabled={!inStock} 
              onClick={handleAdd} 
            > 
              {inStock ? "Add to cart" : "Out of stock"} 
            </button> 
            {feedback && ( 
              <div 
                className={`small mt-2 ${ 
                  feedback.ok ? "text-success" : "text-danger" 
                }`} 
                role="status" 
              > 
                {feedback.message} 
              </div> 
            )} 
          </> 
        )} 
      </div> 
    </article> 
  ); 
} 
 
export default ProductCard;