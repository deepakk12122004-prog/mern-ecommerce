import { Link } from "react-router-dom"; 
import { useCart } from "../context/CartContext"; 
import useCartQuote from "../hooks/useCartQuote"; 
import CartItem from "../components/CartItem"; 
import OrderSummary from "../components/OrderSummary"; 
import EmptyState from "../components/EmptyState"; 
import ErrorMessage from "../components/ErrorMessage"; 
 
// Combines what the visitor chose (saved in the browser) with what the 
// server says is true (the quote). The server's values win. 
function mergeLine(item, quote) { 
  const line = quote 
    ? quote.items.find((l) => l.productId === item.productId) 
    : null; 
 
  // No answer yet, or the answer was for a different quantity 
  if (!line || line.requestedQuantity !== item.quantity) { 
    return { ...item, status: "pending" }; 
  } 
 
  if (line.status === "unavailable") { 
    return { ...item, status: "unavailable", stock: 0 }; 
  } 
 
  return { 
    ...item, 
    name: line.name, 
    price: line.price, 
    image: line.image || "", 
    stock: line.stock, 
    status: line.status, // "ok", "reduced" or "out_of_stock" 
    countedQuantity: line.quantity, 
    priceChanged: line.price !== item.price, 
  }; 
} 
 
const PROBLEM_STATUSES = ["unavailable", "out_of_stock", "reduced"]; 
 
function Cart() { 
  const { 
    items, 
    totalItems, 
    updateQuantity, 
    removeItem, 
    clearCart, 
    syncWithQuote, 
    itemsPrice, 
    shippingPrice, 
    totalPrice, 
  } = useCart(); 
  const { quote, loading, error, reload } = useCartQuote(items); 
 
  if (items.length === 0) { 
    return ( 
      <div className="container py-5"> 
        <EmptyState 
          title="Your cart is empty" 
          message="Add some products to get started." 
          actionLabel="Browse products" 
          actionTo="/products" 
        /> 
      </div> 
    ); 
  } 
 
  const lines = items.map((item) => mergeLine(item, quote)); 
  const hasPending = lines.some((l) => l.status === "pending"); 
  const hasProblems = lines.some((l) => PROBLEM_STATUSES.includes(l.status)); 
  const hasPriceChange = lines.some((l) => l.priceChanged); 
 
  // "verified" = the totals on screen match the current cart 
  const verified = Boolean(quote) && !loading && !error && !hasPending; 
  const canCheckout = verified && !hasProblems; 
  const needsUpdate = verified && (hasProblems || hasPriceChange); 
 
  // The server's totals when we have them; local estimates until then 
  const totals = quote || { itemsPrice, shippingPrice, totalPrice }; 
 
  let checkoutLabel = "Checking prices..."; 
  if (error) checkoutLabel = "Could not check prices"; 
  else if (verified && hasProblems) checkoutLabel = "Update your cart first"; 
 
  return ( 
    <div className="container py-4 py-lg-5"> 
      <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-3"> 
        <div> 
          <h1 className="h3 mb-1">Shopping cart</h1> 
          <p className="text-muted mb-0"> 
            {totalItems} item{totalItems === 1 ? "" : "s"} 
          </p> 
        </div> 
        <button 
          type="button" 
          className="btn btn-outline-secondary btn-sm" 
          onClick={clearCart} 
        > 
          Clear cart 
        </button> 
      </div> 
 
      {error && <ErrorMessage message={error} onRetry={reload} />} 
 
      {needsUpdate && ( 
        <div className="alert alert-warning d-flex flex-wrap align-items-center 
justify-content-between gap-2"> 
          <span> 
            {hasProblems 
              ? "Some items changed. Unavailable items are not in your total." 
              : "Some prices changed since you added these items."} 
          </span> 
          <button 
            type="button" 
            className="btn btn-sm btn-warning" 
            onClick={() => syncWithQuote(quote.items)} 
          > 
            Update cart 
          </button> 
        </div> 
      )} 
 
      <div className="row g-4"> 
        <div className="col-12 col-lg-8"> 
          <div className="list-group cart-list"> 
            {lines.map((line) => ( 
              <CartItem 
                key={line.productId} 
                item={line} 
                onQuantityChange={updateQuantity} 
                onRemove={removeItem} 
              /> 
            ))} 
          </div> 
          <Link 
            to="/products" 
            className="btn btn-link ps-0 mt-2 text-decoration-none" 
          > 
            &larr; Continue shopping 
          </Link> 
        </div> 
 
        <div className="col-12 col-lg-4"> 
          <OrderSummary 
            itemsPrice={totals.itemsPrice} 
            shippingPrice={totals.shippingPrice} 
            totalPrice={totals.totalPrice} 
            updating={!verified && !error} 
          > 
            {canCheckout ? ( 
              <Link to="/checkout" className="btn btn-primary btn-lg w-100"> 
                Proceed to checkout 
              </Link> 
            ) : ( 
              <button 
                type="button" 
                className="btn btn-primary btn-lg w-100" 
                disabled 
              > 
                {checkoutLabel} 
              </button> 
            )} 
          </OrderSummary> 
        </div> 
      </div> 
    </div> 
  ); 
} 
 
export default Cart; 