import { useRef, useState } from "react"; 
import { Link, useNavigate } from "react-router-dom"; 
import { useAuth } from "../context/AuthContext"; 
import { useCart } from "../context/CartContext"; 
import useCartQuote from "../hooks/useCartQuote"; 
import useFetch from "../hooks/useFetch"; 
import { createOrder, newIdempotencyKey } from "../api/orderService"; 
import { getPaymentMethods } from "../api/paymentService"; 
import useForm from "../hooks/useForm"; 
import { formatPrice } from "../utils/formatPrice"; 
import FormField from "../components/FormField"; 
import OrderSummary from "../components/OrderSummary"; 
import ErrorMessage from "../components/ErrorMessage"; 
import EmptyState from "../components/EmptyState"; 
import PaymentMethodSelector from "../components/PaymentMethodSelector"; 
 
const REQUIRED = { 
  fullName: "Full name is required.", 
  address: "Address is required.", 
  city: "City is required.", 
  postalCode: "Postal code is required.", 
  country: "Country is required.", 
  phone: "Phone number is required.", 
}; 
 
function validate(values) { 
  const errors = {}; 
  Object.keys(REQUIRED).forEach((key) => { 
    if (!values[key].trim()) errors[key] = REQUIRED[key]; 
  }); 
  const phoneOk = /^[0-9+\-\s]{7,15}$/.test(values.phone.trim()); 
  if (!errors.phone && !phoneOk) { 
    errors.phone = "Enter a valid phone number (7-15 digits)."; 
  } 
  return errors; 
} 
 
function Checkout() { 
  const { user } = useAuth(); 
  const { items, clearCart, itemsPrice, shippingPrice, totalPrice } = useCart(); 
  const { 
    quote, 
    loading: quoteLoading, 
    error: quoteError, 
    reload, 
  } = useCartQuote(items); 
  const navigate = useNavigate(); 
 
  // Which payment methods the server allows right now. 
  // If this cannot be loaded we fall back to Cash on Delivery only. 
  const methodsFetch = useFetch(() => getPaymentMethods(), []); 
  const enabledMethods = methodsFetch.data ? methodsFetch.data.methods : ["COD"]; 
 
  const { values, handleChange } = useForm({ 
    fullName: user.name, 
    address: "", 
    city: "", 
    postalCode: "", 
    country: "", 
    phone: "", 
  }); 
  const [chosenMethod, setChosenMethod] = useState("COD"); 
  const [fieldErrors, setFieldErrors] = useState({}); 
  const [error, setError] = useState(""); 
  const [problems, setProblems] = useState([]); 
  const [submitting, setSubmitting] = useState(false); 
 
  // Stops a very fast double click, before the screen has updated 
  const submittingRef = useRef(false); 
  // One key per cart content and payment method. Retrying the SAME 
  // order reuses the key (so it can never create two orders). A changed 
  // cart or payment method gets a new key. 
  const keyRef = useRef({ fingerprint: "", key: "" }); 
 
  if (items.length === 0) { 
    return ( 
      <div className="container py-5"> 
        <EmptyState 
          title="Nothing to check out" 
          message="Your cart is empty." 
          actionLabel="Browse products" 
          actionTo="/products" 
        /> 
      </div> 
    ); 
  } 
 
  // A method the server does not allow falls back to Cash on Delivery 
  const method = enabledMethods.includes(chosenMethod) ? chosenMethod : "COD"; 
 
  const verified = Boolean(quote) && !quoteLoading && !quoteError; 
  const hasProblems = verified && quote.hasIssues; 
  const canPlaceOrder = verified && !hasProblems; 
 
  // The server's totals when we have them; local estimates until then 
  const totals = quote || { itemsPrice, shippingPrice, totalPrice }; 
 
  // Lines shown in the summary (only things that count) 
  const summaryLines = quote 
    ? quote.items.filter((line) => line.quantity > 0) 
    : items; 
 
  let buttonLabel = method === "UPI" ? "Place order and pay" : "Place order"; 
  if (submitting) buttonLabel = "Placing order..."; 
  else if (!verified && !quoteError) buttonLabel = "Checking prices..."; 
 
  const getKey = () => { 
    const fingerprint = 
      method + 
      "|" + 
      items.map((i) => `${i.productId}:${i.quantity}`).join(","); 
    if (keyRef.current.fingerprint !== fingerprint) { 
      keyRef.current = { fingerprint, key: newIdempotencyKey() }; 
    } 
    return keyRef.current.key; 
  }; 
 
  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    if (submittingRef.current) return; 
    setError(""); 
    setProblems([]); 
 
    if (!canPlaceOrder) { 
      setError("Please review your cart before placing the order."); 
      return; 
    } 
 
    const errors = validate(values); 
    setFieldErrors(errors); 
    if (Object.keys(errors).length > 0) return; 
 
    submittingRef.current = true; 
    setSubmitting(true); 
    try { 
      // Only ids, quantities, the address and the payment method are 
      // sent. Prices and payment status are NOT sent: the server 
      // decides them. 
      const { order } = await createOrder( 
        { 
          items: items.map((i) => ({ 
            productId: i.productId, 
            quantity: i.quantity, 
          })), 
          shippingAddress: values, 
          paymentMethod: method, 
        }, 
        getKey() 
      ); 
 
      clearCart(); 
      // For UPI, the order page opens the payment window right away 
      navigate(`/orders/${order._id}`, { 
        replace: true, 
        state: { placed: true, payNow: method === "UPI" }, 
      }); 
    } catch (err) { 
      submittingRef.current = false; 
      setSubmitting(false); 
      setError(err.message); 
 
      if (err.status === 409) { 
        // Stock or availability changed: show which items, and 
        // refresh the verified cart information. 
        setProblems(err.details || []); 
        reload(); 
      } 
 
      // Address problems found by the server go under their inputs 
      const serverFields = {}; 
      Object.entries(err.fieldErrors || {}).forEach(([key, message]) => { 
        if (key.startsWith("shippingAddress.")) { 
          serverFields[key.replace("shippingAddress.", "")] = message; 
        } 
      }); 
      if (Object.keys(serverFields).length > 0) setFieldErrors(serverFields); 
    } 
  }; 
 
  return ( 
    <div className="container py-4"> 
      <h1 className="h3 mb-4">Checkout</h1> 
 
      <form onSubmit={handleSubmit} noValidate> 
        <div className="row g-4"> 
          <div className="col-12 col-lg-7"> 
            {quoteError && ( 
              <ErrorMessage message={quoteError} onRetry={reload} /> 
            )} 
            {hasProblems && ( 
              <div className="alert alert-warning"> 
                Some items in your cart are unavailable or have limited 
                stock. <Link to="/cart">Review your cart</Link> before 
                ordering. 
              </div> 
            )} 
 
            <div className="card shadow-sm mb-4"> 
              <div className="card-body"> 
                <h2 className="h5 mb-3">Shipping address</h2> 
 
                {error && ( 
                  <div className="alert alert-danger" role="alert"> 
                    {error} 
                    {problems.length > 0 && ( 
                      <> 
                        <ul className="mb-0 mt-2"> 
                          {problems.map((p) => ( 
                            <li key={p.productId}> 
                              {p.name ? `${p.name}: ` : ""} 
                              {p.message} 
                            </li> 
                          ))} 
                        </ul> 
                        <div className="mt-2"> 
                          <Link to="/cart">Review your cart</Link> 
                        </div> 
                      </> 
                    )} 
                  </div> 
                )} 
 
                <FormField 
                  id="fullName" 
                  label="Full name" 
                  value={values.fullName} 
                  onChange={handleChange} 
                  error={fieldErrors.fullName} 
                  autoComplete="name" 
                /> 
                <FormField 
                  id="address" 
                  label="Address" 
                  value={values.address} 
                  onChange={handleChange} 
                  error={fieldErrors.address} 
                  autoComplete="street-address" 
                /> 
                <div className="row"> 
                  <div className="col-12 col-sm-6"> 
                    <FormField 
                      id="city" 
                      label="City" 
                      value={values.city} 
                      onChange={handleChange} 
                      error={fieldErrors.city} 
                    /> 
                  </div> 
                  <div className="col-12 col-sm-6"> 
                    <FormField 
                      id="postalCode" 
                      label="Postal code" 
                      value={values.postalCode} 
                      onChange={handleChange} 
                      error={fieldErrors.postalCode} 
                      autoComplete="postal-code" 
                    /> 
                  </div> 
                </div> 
                <FormField 
                  id="country" 
                  label="Country" 
                  value={values.country} 
                  onChange={handleChange} 
                  error={fieldErrors.country} 
                  autoComplete="country-name" 
                /> 
                <FormField 
                  id="phone" 
                  label="Phone" 
                  type="tel" 
                  value={values.phone} 
                  onChange={handleChange} 
                  error={fieldErrors.phone} 
                  autoComplete="tel" 
                /> 
              </div> 
            </div> 
 
            <div className="card shadow-sm"> 
              <div className="card-body"> 
                <h2 className="h5 mb-3">Payment method</h2> 
                <PaymentMethodSelector 
                  value={method} 
                  onChange={setChosenMethod} 
                  enabledMethods={enabledMethods} 
                  disabled={submitting} 
                /> 
              </div> 
            </div> 
          </div> 
 
          <div className="col-12 col-lg-5"> 
            <OrderSummary 
              itemsPrice={totals.itemsPrice} 
              shippingPrice={totals.shippingPrice} 
              totalPrice={totals.totalPrice} 
              updating={!verified && !quoteError} 
            > 
              <ul className="list-unstyled small text-muted"> 
                {summaryLines.map((line) => ( 
                  <li key={line.productId}> 
                    {line.quantity} &times; {line.name} 
                  </li> 
                ))} 
              </ul> 
 
              {method === "COD" && ( 
                <p className="small mb-3"> 
                  You will pay <strong>{formatPrice(totals.totalPrice)}</strong>{" "} 
                  in cash when your order arrives. 
                </p> 
              )} 
              {method === "UPI" && ( 
                <p className="small mb-3"> 
                  You will pay <strong>{formatPrice(totals.totalPrice)}</strong>{" "} 
                  online with UPI right after placing the order. Your order is 
                  confirmed once the payment is verified. 
                </p> 
              )} 
 
              <button 
                type="submit" 
                className="btn btn-success w-100" 
                disabled={submitting || !canPlaceOrder} 
              > 
                {buttonLabel} 
              </button> 
            </OrderSummary> 
          </div> 
        </div> 
      </form> 
    </div> 
  ); 
} 
 
export default Checkout; 