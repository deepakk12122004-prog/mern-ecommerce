import { useEffect, useState } from "react"; 
import { Link, useParams } from "react-router-dom"; 
import useFetch from "../hooks/useFetch"; 
import { getAdminOrder } from "../api/adminService"; 
import { formatPrice } from "../utils/formatPrice"; 
import { paymentMethodLabel } from "../utils/paymentStatus"; 
import AsyncContent from "../components/AsyncContent"; 
import EmptyState from "../components/EmptyState"; 
import StatusBadge from "../components/StatusBadge"; 
import PaymentBadge from "../components/PaymentBadge"; 
import OrderStatusControl from "../components/OrderStatusControl"; 
import PaymentStatusControl from "../components/PaymentStatusControl"; 
 
// Only rendered once the order has loaded 
function OrderBody({ order, onOrderUpdated, onPaymentUpdated }) { 
  const address = order.shippingAddress; 
  const refundNeeded = 
    order.status === "cancelled" && order.paymentStatus === "paid"; 
 
  return ( 
    <> 
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3"> 
        <div> 
          <h2 className="h4 mb-1">Order #{order._id.slice(-6).toUpperCase()}</h2> 
          <div className="text-muted small"> 
            Placed {new Date(order.createdAt).toLocaleString()} 
          </div> 
        </div> 
        <div className="text-md-end"> 
          <div className="mb-2"> 
            <StatusBadge status={order.status} /> 
          </div> 
          <OrderStatusControl order={order} onUpdated={onOrderUpdated} /> 
        </div> 
      </div> 
 
      {refundNeeded && ( 
        <div className="alert alert-warning" role="alert"> 
          This order was cancelled after it was paid. Refund{" "} 
          {formatPrice(order.totalPrice)} to the customer, then mark the 
          payment as refunded. 
        </div> 
      )} 
 
      <div className="row g-4"> 
        <div className="col-12 col-lg-8"> 
          <div className="card"> 
            <div className="card-body"> 
              <h3 className="h5 mb-3">Items</h3> 
              <ul className="list-group list-group-flush"> 
                {order.items.map((item) => ( 
                  <li 
                    key={item.product} 
                    className="list-group-item d-flex justify-content-between gap-3 px-0" 
                  > 
                    <div> 
                      <div className="fw-semibold">{item.name}</div> 
                      <div className="small text-muted"> 
                        {item.quantity} &times; {formatPrice(item.price)}{" "} 
                        (price at purchase) 
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
              <h3 className="h5 mb-3">Customer</h3> 
              {order.user ? ( 
                <> 
                  <div>{order.user.name}</div> 
                  <div className="text-muted small">{order.user.email}</div> 
                </> 
              ) : ( 
                <div className="text-muted">This account was deleted.</div> 
              )} 
            </div> 
          </div> 
 
          <div className="card mb-3"> 
            <div className="card-body"> 
              <h3 className="h5 mb-3">Payment</h3> 
              <div className="d-flex justify-content-between align-items-center mb-2"> 
                <span>{paymentMethodLabel(order.paymentMethod)}</span> 
                <PaymentBadge status={order.paymentStatus} /> 
              </div> 
              {order.paidAt && ( 
                <div className="small text-muted mb-2"> 
                  Paid on {new Date(order.paidAt).toLocaleString()} 
                </div> 
              )} 
              <PaymentStatusControl order={order} onUpdated={onPaymentUpdated} /> 
            </div> 
          </div> 
 
          <div className="card mb-3"> 
            <div className="card-body"> 
              <h3 className="h5 mb-3">Shipping address</h3> 
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
 
          <div className="card"> 
            <div className="card-body"> 
              <h3 className="h5 mb-3">Totals</h3> 
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
              <div className="d-flex justify-content-between fw-bold"> 
                <span>Total</span> 
                <span>{formatPrice(order.totalPrice)}</span> 
              </div> 
            </div> 
          </div> 
        </div> 
      </div> 
    </> 
  ); 
} 
 
function AdminOrderDetails() { 
  const { id } = useParams(); 
  const { data, loading, error, errorStatus, reload } = useFetch( 
    () => getAdminOrder(id), 
    [id] 
  ); 
 
  // After a change we keep the newest copy here 
  const [updated, setUpdated] = useState(null); 
  useEffect(() => { 
    setUpdated(null); 
  }, [id]); 
 
  const order = updated || data; 
  const notFound = errorStatus === 400 || errorStatus === 404; 
 
  // The update calls return the order without the customer details, 
  // so we only copy the fields that can change. 
  const handleOrderUpdated = (result) => { 
    setUpdated({ 
      ...order, 
      status: result.status, 
      paymentStatus: result.paymentStatus, 
      paidAt: result.paidAt, 
      updatedAt: result.updatedAt, 
    }); 
  }; 
 
  const handlePaymentUpdated = (result) => { 
    setUpdated({ 
      ...order, 
      paymentStatus: result.paymentStatus, 
      paidAt: result.paidAt, 
      updatedAt: result.updatedAt, 
    }); 
  }; 
 
  return ( 
    <> 
      <Link 
        to="/admin/orders" 
        className="btn btn-link ps-0 mb-2 text-decoration-none" 
      > 
        &larr; Back to orders 
      </Link> 
 
      <AsyncContent 
        loading={loading} 
        error={notFound ? "" : error} 
        onRetry={reload} 
        loadingMessage="Loading order..." 
        isEmpty={notFound} 
        emptyState={ 
          <EmptyState 
            title="Order not found" 
            message="This order does not exist." 
            actionLabel="Back to orders" 
            actionTo="/admin/orders" 
          /> 
        } 
      > 
        <OrderBody 
          order={order} 
          onOrderUpdated={handleOrderUpdated} 
          onPaymentUpdated={handlePaymentUpdated} 
        /> 
      </AsyncContent> 
    </> 
  ); 
} 
 
export default AdminOrderDetails;