 import { Link } from "react-router-dom"; 
import { formatPrice } from "../utils/formatPrice"; 
import { optimizeImage } from "../utils/imageUrl"; 
 
// Props: 
//   item - { productId, name, price, image, stock, quantity, 
//            status, countedQuantity, priceChanged } 
//          status is "pending", "ok", "reduced", "out_of_stock" 
//          or "unavailable" (see Cart.jsx) 
//   onQuantityChange - function(productId, newQuantity) 
//   onRemove         - function(productId) 
function CartItem({ item, onQuantityChange, onRemove }) { 
  const { 
    productId, 
    name, 
    price, 
    image, 
    stock, 
    quantity, 
    status, 
    countedQuantity, 
    priceChanged, 
  } = item; 
 
  const unavailable = status === "unavailable"; 
  const outOfStock = status === "out_of_stock"; 
  const reduced = status === "reduced"; 
  const canChange = !unavailable && !outOfStock; 
  const counted = reduced ? countedQuantity : quantity; 
 
  return ( 
    <div className="list-group-item cart-item"> 
      <div className="d-flex gap-3"> 
        <div className="cart-thumb"> 
          {image ? ( 
            <img src={optimizeImage(image, 160)} alt={name} /> 
          ) : ( 
            <div className="img-placeholder" aria-hidden="true"> 
              {(name || "?").charAt(0).toUpperCase()} 
            </div> 
          )} 
        </div> 
 
        <div className="flex-grow-1"> 
          {unavailable ? ( 
            <span className="fw-semibold">{name}</span> 
          ) : ( 
            <Link 
              to={`/products/${productId}`} 
              className="fw-semibold text-decoration-none text-dark" 
            > 
              {name} 
            </Link> 
          )} 
 
          {canChange && ( 
            <div className="text-muted small">{formatPrice(price)} each</div> 
          )} 
 
          {unavailable && ( 
            <div className="mt-1"> 
              <span className="badge bg-danger">No longer available</span> 
              <span className="small text-muted ms-2"> 
                Not included in your total. 
              </span> 
            </div> 
          )} 
          {outOfStock && ( 
            <div className="mt-1"> 
              <span className="badge bg-danger">Out of stock</span> 
              <span className="small text-muted ms-2"> 
                Not included in your total. 
              </span> 
            </div> 
          )} 
          {reduced && ( 
            <div className="mt-1"> 
              <span className="badge bg-warning text-dark"> 
                Only {stock} left 
              </span> 
              <span className="small text-muted ms-2"> 
                Your total counts {countedQuantity}. 
              </span> 
            </div> 
          )} 
          {priceChanged && canChange && ( 
            <div className="small text-muted mt-1"> 
              The price has changed since you added this item. 
            </div> 
          )} 
 
          <div className="d-flex flex-wrap align-items-center gap-3 mt-2"> 
            {canChange && ( 
              <div 
                className="qty-stepper" 
                role="group" 
                aria-label={`Quantity for ${name}`} 
              > 
                <button 
                  type="button" 
                  className="qty-btn" 
                  aria-label="Decrease quantity" 
                  disabled={quantity <= 1} 
                  onClick={() => onQuantityChange(productId, quantity - 1)} 
                > 
                  &minus; 
                </button> 
                <span className="qty-value">{quantity}</span> 
                <button 
                  type="button" 
                  className="qty-btn" 
                  aria-label="Increase quantity" 
                  disabled={quantity >= stock} 
                  onClick={() => onQuantityChange(productId, quantity + 1)} 
                > 
                  + 
                </button> 
              </div> 
            )} 
 
            {canChange && ( 
              <span className="fw-bold">{formatPrice(price * counted)}</span> 
            )} 
 
            <button 
              type="button" 
              className="btn btn-link btn-sm text-danger text-decoration-none ms-auto p-0" 
              onClick={() => onRemove(productId)} 
            > 
              Remove 
            </button> 
          </div> 
        </div> 
      </div> 
    </div> 
  ); 
} 
 
export default CartItem;