import { Link, useSearchParams } from "react-router-dom"; 
import useFetch from "../hooks/useFetch"; 
import { getMyOrders } from "../api/orderService"; 
import { formatPrice } from "../utils/formatPrice"; 
import { paymentMethodLabel } from "../utils/paymentStatus"; 
import AsyncContent from "../components/AsyncContent"; 
import EmptyState from "../components/EmptyState"; 
import Pagination from "../components/Pagination"; 
import StatusBadge from "../components/StatusBadge"; 
import PaymentBadge from "../components/PaymentBadge"; 
 
// Orders per page. To test paging with few orders, 
// temporarily change this to 2. 
const PAGE_SIZE = 10; 
 
function readPage(value) { 
  const number = parseInt(value, 10); 
  if (!Number.isInteger(number) || number < 1) return 1; 
  return Math.min(number, 100000); 
} 
 
// A UPI order that still needs to be paid 
function needsPayment(order) { 
  return ( 
    order.paymentMethod === "UPI" && 
    order.paymentStatus === "pending" && 
    order.status !== "cancelled" 
  ); 
} 
 
function MyOrders() { 
  const [searchParams, setSearchParams] = useSearchParams(); 
  const page = readPage(searchParams.get("page")); 
 
  const { data, loading, error, reload } = useFetch( 
    () => getMyOrders({ page, limit: PAGE_SIZE }), 
    [page] 
  ); 
  const orders = data ? data.orders : []; 
  const pagination = data ? data.pagination : null; 
 
  const goToPage = (nextPage) => { 
    setSearchParams(nextPage > 1 ? { page: String(nextPage) } : {}); 
    window.scrollTo({ top: 0, behavior: "smooth" }); 
  }; 
 
  return ( 
    <div className="container py-4"> 
      <h1 className="h3 mb-3">My orders</h1> 
 
      <AsyncContent 
        loading={loading} 
        error={error} 
        onRetry={reload} 
        loadingMessage="Loading your orders..." 
        isEmpty={orders.length === 0} 
        emptyState={ 
          <EmptyState 
            title="No orders yet" 
            message="When you place an order it will appear here." 
            actionLabel="Start shopping" 
            actionTo="/products" 
          /> 
        } 
      > 
        <div className="row g-3"> 
          {orders.map((order) => ( 
            <div className="col-12" key={order._id}> 
              <div className="card"> 
                <div className="card-body"> 
                  <div className="d-flex flex-wrap justify-content-between gap-2 mb-2"> 
                    <div> 
                      <strong> 
                        Order #{order._id.slice(-6).toUpperCase()} 
                      </strong> 
                      <div className="text-muted small"> 
                        {new Date(order.createdAt).toLocaleDateString()} 
                      </div> 
                    </div> 
                    <StatusBadge status={order.status} /> 
                  </div> 
 
                  <ul className="mb-2 ps-3"> 
                    {order.items.map((item) => ( 
                      <li key={item.product}> 
                        {item.quantity} &times; {item.name} ( 
                        {formatPrice(item.price)}) 
                      </li> 
                    ))} 
                  </ul> 
 
                  <div className="d-flex flex-wrap align-items-center gap-2 small text-muted mb-2"> 
                    <span>{paymentMethodLabel(order.paymentMethod)}</span> 
                    <PaymentBadge status={order.paymentStatus} /> 
                  </div> 
 
                  <div className="d-flex flex-wrap justify-content-between align-items-center gap-2"> 
                    <span className="fw-bold"> 
                      Total {formatPrice(order.totalPrice)} 
                    </span> 
                    <div className="d-flex gap-2"> 
                      {needsPayment(order) && ( 
                        <Link 
                          to={`/orders/${order._id}`} 
                          state={{ payNow: true }} 
                          className="btn btn-primary btn-sm" 
                        > 
                          Pay now 
                        </Link> 
                      )} 
                      <Link 
                        to={`/orders/${order._id}`} 
                        className="btn btn-outline-primary btn-sm" 
                      > 
                        View details 
                      </Link> 
                    </div> 
                  </div> 
                </div> 
              </div> 
            </div> 
          ))} 
        </div> 
 
        {pagination && ( 
          <Pagination 
            page={pagination.page} 
            totalPages={pagination.totalPages} 
            onPageChange={goToPage} 
          /> 
        )} 
      </AsyncContent> 
    </div> 
); 
} 
export default MyOrders;