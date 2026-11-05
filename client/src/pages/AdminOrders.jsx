import { useState } from "react"; 
import { Link, useSearchParams } from "react-router-dom"; 
import useFetch from "../hooks/useFetch"; 
import { getAdminOrders } from "../api/adminService"; 
import { formatPrice } from "../utils/formatPrice"; 
import { ORDER_STATUSES, capitalize } from "../utils/orderStatus"; 
import { 
PAYMENT_METHOD_LABELS, 
PAYMENT_STATUSES, 
paymentMethodLabel, 
} from "../utils/paymentStatus"; 
import AsyncContent from "../components/AsyncContent"; 
import EmptyState from "../components/EmptyState"; 
import Pagination from "../components/Pagination"; 
import StatusBadge from "../components/StatusBadge"; 
import PaymentBadge from "../components/PaymentBadge"; 
import OrderStatusControl from "../components/OrderStatusControl"; 
import PaymentStatusControl from "../components/PaymentStatusControl"; 
// Orders per page. To test paging with few orders, 
// temporarily change this to 2. 
const PAGE_SIZE = 10; 
const METHODS = Object.keys(PAYMENT_METHOD_LABELS); 
const shortId = (id) => id.slice(-6).toUpperCase(); 
// URL values can be edited by anyone, so only known values are used 
const pick = (value, allowed) => (allowed.includes(value) ? value : ""); 
function readPage(value) { 
const number = parseInt(value, 10); 
if (!Number.isInteger(number) || number < 1) return 1; 
return Math.min(number, 100000); 
} 
function AdminOrders() { 
const [searchParams, setSearchParams] = useSearchParams(); 
const status = pick(searchParams.get("status") || "", ORDER_STATUSES); 
const paymentMethod = pick(searchParams.get("paymentMethod") || "", METHODS); 
const paymentStatus = pick( 
    searchParams.get("paymentStatus") || "", 
    PAYMENT_STATUSES 
  ); 
  const page = readPage(searchParams.get("page")); 
 
  const orders = useFetch( 
    () => 
      getAdminOrders({ 
        status, 
        paymentMethod, 
        paymentStatus, 
        page, 
        limit: PAGE_SIZE, 
      }), 
    [status, paymentMethod, paymentStatus, page] 
  ); 
  const [notice, setNotice] = useState(""); 
 
  const list = orders.data ? orders.data.orders : []; 
  const pagination = orders.data ? orders.data.pagination : null; 
  const hasFilters = Boolean(status || paymentMethod || paymentStatus); 
 
  const updateParams = (changes, keepPage = false) => { 
    const next = new URLSearchParams(searchParams); 
    Object.entries(changes).forEach(([key, value]) => { 
      if (value) next.set(key, value); 
      else next.delete(key); 
    }); 
    if (!keepPage) next.delete("page"); 
    setSearchParams(next); 
    setNotice(""); 
  }; 
 
  const goToPage = (nextPage) => { 
    updateParams({ page: nextPage > 1 ? String(nextPage) : "" }, true); 
    window.scrollTo({ top: 0, behavior: "smooth" }); 
  }; 
 
  // After a change, reload the list so it matches the filters 
  const handleOrderUpdated = (order) => { 
    setNotice( 
      `Order #${shortId(order._id)} is now ${capitalize(order.status)}.` 
    ); 
    orders.reload(); 
  }; 
 
  const handlePaymentUpdated = (order) => { 
    setNotice( 
      `Order #${shortId(order._id)}: payment is now ` + 
        `${capitalize(order.paymentStatus)}.` 
    ); 
    orders.reload(); 
  }; 
 
  const selectClass = "form-select form-select-sm w-auto"; 
 
  return ( 
    <> 
      <div className="mb-3"> 
        <h2 className="h4 mb-1">Orders</h2> 
        <p className="text-muted mb-0"> 
          {pagination 
            ? `${pagination.total} order${pagination.total === 1 ? "" : "s"}` 
            : "Loading..."} 
        </p> 
      </div> 
 
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3"> 
        <select 
          className={selectClass} 
          aria-label="Filter by order status" 
          value={status} 
          onChange={(e) => updateParams({ status: e.target.value })} 
        > 
          <option value="">All order statuses</option> 
          {ORDER_STATUSES.map((s) => ( 
            <option key={s} value={s}> 
              {capitalize(s)} 
            </option> 
          ))} 
        </select> 
 
        <select 
          className={selectClass} 
          aria-label="Filter by payment method" 
          value={paymentMethod} 
          onChange={(e) => updateParams({ paymentMethod: e.target.value })} 
        > 
          <option value="">All payment methods</option> 
          {METHODS.map((m) => ( 
            <option key={m} value={m}> 
              {paymentMethodLabel(m)} 
            </option> 
          ))} 
        </select> 
 
        <select 
          className={selectClass} 
          aria-label="Filter by payment status" 
          value={paymentStatus} 
          onChange={(e) => updateParams({ paymentStatus: e.target.value })} 
        > 
          <option value="">All payment statuses</option> 
          {PAYMENT_STATUSES.map((s) => ( 
            <option key={s} value={s}> 
              {capitalize(s)} 
            </option> 
          ))} 
        </select> 
 
        {hasFilters && ( 
          <button 
            type="button" 
            className="btn btn-link btn-sm text-decoration-none" 
            onClick={() => setSearchParams({})} 
          > 
            Clear filters 
          </button> 
        )} 
      </div> 
 
      {notice && ( 
        <div className="alert alert-success" role="status"> 
          {notice} 
        </div> 
      )} 
 
      <AsyncContent 
        loading={orders.loading} 
        error={orders.error} 
        onRetry={orders.reload} 
        loadingMessage="Loading orders..." 
        isEmpty={list.length === 0} 
        emptyState={ 
          <EmptyState 
            title="No orders found" 
            message={hasFilters ? "No orders match these filters." : "No orders yet."} 
            actionLabel={hasFilters ? "Clear filters" : undefined} 
            onAction={hasFilters ? () => setSearchParams({}) : undefined} 
          /> 
        } 
      > 
        <div className="card"> 
          <div className="table-responsive"> 
            <table className="table align-middle mb-0"> 
              <thead> 
                <tr> 
                  <th>Order</th> 
                  <th>Customer</th> 
                  <th className="text-end">Items</th> 
                  <th className="text-end">Total</th> 
                  <th>Order status</th> 
                  <th>Payment</th> 
                </tr> 
              </thead> 
              <tbody> 
                {list.map((o) => ( 
                  <tr key={o._id}> 
                    <td> 
                      <Link 
                        to={`/admin/orders/${o._id}`} 
                        className="fw-semibold text-decoration-none" 
                      > 
                        #{shortId(o._id)} 
                      </Link> 
                      <div className="small text-muted"> 
                        {new Date(o.createdAt).toLocaleString()} 
                      </div> 
                    </td> 
                    <td> 
                      {o.user ? ( 
                        <> 
                          <div>{o.user.name}</div> 
                          <div className="small text-muted">{o.user.email}</div> 
                        </> 
                      ) : ( 
                        <span className="text-muted">Deleted user</span> 
                      )} 
                    </td> 
                    <td className="text-end"> 
                      {o.items.reduce((sum, i) => sum + i.quantity, 0)} 
                    </td> 
                    <td className="text-end">{formatPrice(o.totalPrice)}</td> 
                    <td> 
                      <StatusBadge status={o.status} /> 
                      <div className="mt-2"> 
                        <OrderStatusControl 
                          order={o} 
                          onUpdated={handleOrderUpdated} 
                          compact 
                        /> 
                      </div> 
                    </td> 
                    <td> 
                      <div className="small mb-1"> 
                        {paymentMethodLabel(o.paymentMethod)} 
                      </div> 
                      <PaymentBadge status={o.paymentStatus} /> 
                      <div className="mt-2"> 
                        <PaymentStatusControl 
                          order={o} 
                          onUpdated={handlePaymentUpdated} 
                          compact 
                        /> 
                      </div> 
                    </td> 
                  </tr> 
                ))} 
              </tbody> 
            </table> 
          </div> 
        </div> 
 
        {pagination && ( 
          <Pagination 
            page={pagination.page} 
            totalPages={pagination.totalPages} 
            onPageChange={goToPage} 
          /> 
        )} 
      </AsyncContent> 
    </> 
  ); 
} 
 
export default AdminOrders;