 
import { useEffect, useState } from "react"; 
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"; 
import useFetch from "../hooks/useFetch"; 
import { getOrderById } from "../api/orderService"; 
import { formatPrice } from "../utils/formatPrice"; 
import { paymentMethodLabel } from "../utils/paymentStatus"; 
import AsyncContent from "../components/AsyncContent"; 
import EmptyState from "../components/EmptyState"; 
import StatusBadge from "../components/StatusBadge"; 
import PaymentBadge from "../components/PaymentBadge"; 
import PayNowPanel from "../components/PayNowPanel"; 
 
function OrderView({ 
  order, 
  justPlaced, 
  autoPay, 
  onAutoStarted, 
  onPaid, 
  onStale, 
}) { 
  const address = order.shippingAddress; 
  const number = order._id.slice(-6).toUpperCase(); 
 
  const isUpi = order.paymentMethod === "UPI"; 
  const upiPending = 
    isUpi && order.paymentStatus === "pending" && order.status !== "cancelled"; 
  const upiPaid = isUpi && order.paymentStatus === "paid"; 
 
  return ( 
    <> 
      {justPlaced && order.paymentMethod === "COD" && ( 
        <div className="alert alert-success" role="status"> 
          <strong>Thank you! Your order has been placed.</strong> You will 
          pay {formatPrice(order.totalPrice)} in cash when it arrives. 
        </div> 
      )} 
      {justPlaced && upiPaid && ( 
        <div className="alert alert-success" role="status"> 
          <strong>Payment received. Thank you!</strong> Your order is 
          confirmed. 
        </div> 
      )} 
      {justPlaced && upiPending && ( 
        <div className="alert alert-info" role="status"> 
          <strong>Your order is placed.</strong> Complete the UPI payment 
          below to confirm it. 
        </div> 
      )} 
 
      {upiPending && ( 
        <PayNowPanel 
          key={order._id} 
          order={order} 
          autoStart={autoPay} 
          onStarted={onAutoStarted} 
          onPaid={onPaid} 
          onStale={onStale} 
        /> 
      )} 
 
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3"> 
        <div> 
          <h1 className="h3 mb-1">Order #{number}</h1> 
          <div className="text-muted small"> 
            Placed on {new Date(order.createdAt).toLocaleString()} 
          </div> 
        </div> 
        <StatusBadge status={order.status} /> 
      </div> 
 
      <div className="row g-4"> 
        <div className="col-12 col-lg-8"> 
          <div className="card"> 
            <div className="card-body"> 
              <h2 className="h5 mb-3">Items</h2> 
              <ul className="list-group list-group-flush"> 
                {order.items.map((item) => ( 
                  <li 
                    key={item.product} 
                    className="list-group-item d-flex justify-content-between gap-3 px-0" 
                  > 
                    <div> 
                      <div className="fw-semibold">{item.name}</div> 
                      <div className="small text-muted"> 
                        {item.quantity} &times; {formatPrice(item.price)} 
                      </div> 
                    </div> 
                    <div className="fw-semibold"> 
                      {formatPrice(item.price * item.quantity)} 
                    </div> 
                  </li> 
                ))} 
              </ul> 
            </div> 
          </div> 
        </div> 
 
        <div className="col-12 col-lg-4"> 
          <div className="card mb-3"> 
            <div className="card-body"> 
              <h2 className="h5 mb-3">Summary</h2> 
              <div className="d-flex justify-content-between mb-2"> 
                <span className="text-muted">Subtotal</span> 
                <span>{formatPrice(order.itemsPrice)}</span> 
              </div> 
              <div className="d-flex justify-content-between mb-2"> 
                <span className="text-muted">Shipping</span> 
                <span> 
                  {order.shippingPrice === 0 
                    ? "Free" 
                    : formatPrice(order.shippingPrice)} 
                </span> 
              </div> 
              <hr /> 
              <div className="d-flex justify-content-between fw-bold fs-5"> 
                <span>Total</span> 
                <span>{formatPrice(order.totalPrice)}</span> 
              </div> 
            </div> 
          </div> 
 
          <div className="card mb-3"> 
            <div className="card-body"> 
              <h2 className="h5 mb-3">Payment</h2> 
              <div className="d-flex justify-content-between align-items-center"> 
                <span>{paymentMethodLabel(order.paymentMethod)}</span> 
                <PaymentBadge status={order.paymentStatus} /> 
              </div> 
              {order.paidAt && ( 
                <div className="small text-muted mt-2"> 
                  Paid on {new Date(order.paidAt).toLocaleString()} 
                </div> 
              )} 
              {order.transactionId && ( 
                <div className="small text-muted mt-1"> 
                  Transaction ID: {order.transactionId} 
                </div> 
              )} 
            </div> 
          </div> 
 
          <div className="card"> 
            <div className="card-body"> 
              <h2 className="h5 mb-3">Shipping address</h2> 
              <address className="mb-0"> 
                {address.fullName} 
                <br /> 
                {address.address} 
                <br /> 
                {address.city}, {address.postalCode} 
                <br /> 
                {address.country} 
                <br /> 
                Phone: {address.phone} 
              </address> 
            </div> 
          </div> 
        </div> 
      </div> 
    </> 
  ); 
} 
 
function OrderDetails() { 
  const { id } = useParams(); 
  const location = useLocation(); 
  const navigate = useNavigate(); 
  const { 
    data, 
    loading, 
    error, 
    errorStatus, 
    reload, 
  } = useFetch(() => getOrderById(id), [id]); 
 
  // After a payment is verified we keep the newest copy of the order here 
  const [updated, setUpdated] = useState(null); 
  useEffect(() => { 
    setUpdated(null); 
  }, [id]); 
 
  const order = updated || data; 
 
  // 400 = not a valid id, 404 = no such order (or not yours) 
  const notFound = errorStatus === 400 || errorStatus === 404; 
 
  const state = location.state || {}; 
  const justPlaced = Boolean(state.placed); 
  const autoPay = Boolean(state.payNow); 
 
  // Once the payment window has been opened automatically, forget 
  // "payNow", so reloading this page does not open it again. 
  const handleAutoStarted = () => { 
    navigate(location.pathname, { 
      replace: true, 
      state: { placed: justPlaced }, 
    }); 
  }; 
 
  // The server says the order changed (for example it was cancelled) 
  const handleStale = () => { 
    setUpdated(null); 
    reload(); 
  }; 
 
  return ( 
    <div className="container py-4 py-lg-5"> 
      <Link 
        to="/orders" 
        className="btn btn-link ps-0 mb-2 text-decoration-none" 
      > 
        &larr; All my orders 
      </Link> 
 
      <AsyncContent 
        loading={loading} 
        error={notFound ? "" : error} 
        onRetry={reload} 
        loadingMessage="Loading your order..." 
        isEmpty={notFound} 
        emptyState={ 
          <EmptyState 
            title="Order not found" 
            message="This order does not exist or is not yours." 
            actionLabel="See my orders" 
            actionTo="/orders" 
          /> 
        } 
      > 
        <OrderView 
          order={order} 
          justPlaced={justPlaced} 
          autoPay={autoPay} 
          onAutoStarted={handleAutoStarted} 
          onPaid={setUpdated} 
          onStale={handleStale} 
        /> 
      </AsyncContent> 
    </div> 
  ); 
} 
 
export default OrderDetails; 