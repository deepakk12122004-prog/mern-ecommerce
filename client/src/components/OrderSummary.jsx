import { formatPrice } from "../utils/formatPrice"; 
import { FREE_SHIPPING_THRESHOLD } from "../utils/pricing"; 
 
// Price box used on the Cart and Checkout pages. Amounts are in rupees. 
//   updating - true while the prices are being checked with the server 
// `children` is where the page puts its action button. 
function OrderSummary({ 
  itemsPrice, 
  shippingPrice, 
  totalPrice, 
  updating = false, 
  children, 
}) { 
  return ( 
    <div className="card summary-card"> 
      <div className="card-body p-4"> 
        <h2 className="h5 mb-3">Order summary</h2> 
 
        <div className="d-flex justify-content-between mb-2"> 
          <span className="text-muted">Subtotal</span> 
          <span>{formatPrice(itemsPrice)}</span> 
        </div> 
        <div className="d-flex justify-content-between mb-2"> 
          <span className="text-muted">Shipping</span> 
          <span> 
            {shippingPrice === 0 ? "Free" : formatPrice(shippingPrice)} 
          </span> 
        </div> 
        {shippingPrice > 0 && ( 
          <p className="small text-muted mb-0"> 
            Free shipping on orders of {formatPrice(FREE_SHIPPING_THRESHOLD)}{" "} 
            or more. 
          </p> 
        )} 
 
        <hr /> 
        <div className="d-flex justify-content-between fw-bold fs-5 mb-3"> 
          <span>Total</span> 
          <span>{formatPrice(totalPrice)}</span> 
        </div> 
 
        {updating && ( 
          <p className="small text-muted mb-3" role="status"> 
            Checking the latest prices... 
          </p> 
        )} 
 
        {children} 
      </div> 
    </div> 
  ); 
} 
 
export default OrderSummary;