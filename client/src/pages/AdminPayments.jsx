import { useState } from "react"; 
import { Link, useSearchParams } from "react-router-dom"; 
import useFetch from "../hooks/useFetch"; 
import { getAdminPayments, markRefundDone } from "../api/adminService"; 
import { formatPrice } from "../utils/formatPrice"; 
import { capitalize } from "../utils/orderStatus"; 
import AsyncContent from "../components/AsyncContent"; 
import EmptyState from "../components/EmptyState"; 
import Pagination from "../components/Pagination"; 
import StatusBadge from "../components/StatusBadge"; 
import PaymentBadge from "../components/PaymentBadge"; 
import ConfirmDialog from "../components/ConfirmDialog"; 
 
// Payments per page. To test paging with few payments, 
// temporarily change this to 2. 
const PAGE_SIZE = 10; 
 
const ATTEMPT_STATUSES = ["created", "paid", "failed", "cancelled"]; 
const ATTEMPT_LABELS = { 
  created: "Awaiting payment", 
  paid: "Paid", 
  failed: "Failed", 
  cancelled: "Cancelled", 
}; 
const ATTEMPT_STYLES = { 
  created: "bg-secondary", 
  paid: "bg-success", 
  failed: "bg-danger", 
  cancelled: "bg-secondary", 
}; 
 
// URL values can be edited by anyone, so only known values are used 
const pick = (value, allowed) => (allowed.includes(value) ? value : ""); 
 
function readPage(value) { 
  const number = parseInt(value, 10); 
  if (!Number.isInteger(number) || number < 1) return 1; 
  return Math.min(number, 100000); 
} 
 
function AdminPayments() { 
  const [searchParams, setSearchParams] = useSearchParams(); 
 
  const status = pick(searchParams.get("status") || "", ATTEMPT_STATUSES); 
  const refund = pick(searchParams.get("refund") || "", ["needed"]); 
  const page = readPage(searchParams.get("page")); 
 
  const payments = useFetch( 
    () => getAdminPayments({ status, refund, page, limit: PAGE_SIZE }), 
    [status, refund, page] 
  ); 
 
  const [notice, setNotice] = useState(""); 
  const [toRefund, setToRefund] = useState(null); // the payment being resolved 
  const [busy, setBusy] = useState(false); 
  const [dialogError, setDialogError] = useState(""); 
 
  const list = payments.data ? payments.data.payments : []; 
  const pagination = payments.data ? payments.data.pagination : null; 
  const hasFilters = Boolean(status || refund); 
 
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
 
  const cancelDialog = () => { 
    setToRefund(null); 
    setDialogError(""); 
  }; 
 
  const confirmRefund = async () => { 
    setBusy(true); 
    setDialogError(""); 
    try { 
      await markRefundDone(toRefund._id); 
      setNotice("Refund recorded. The payment is no longer flagged."); 
      setToRefund(null); 
      payments.reload(); 
    } catch (err) { 
      setDialogError(err.message); 
    } finally { 
      setBusy(false); 
    } 
  }; 
 
  const shortId = (id) => id.slice(-6).toUpperCase(); 
 
  return ( 
    <> 
      <div className="mb-3"> 
        <h2 className="h4 mb-1">Online payments</h2> 
        <p className="text-muted mb-0"> 
          {pagination 
            ? `${pagination.total} payment${pagination.total === 1 ? "" : "s"}` 
            : "Loading..."} 
        </p> 
      </div> 
 
      <div className="d-flex flex-wrap align-items-center gap-2 mb-3"> 
        <select 
          className="form-select form-select-sm w-auto" 
          aria-label="Filter by payment attempt status" 
          value={status} 
          onChange={(e) => updateParams({ status: e.target.value })} 
        > 
          <option value="">All statuses</option> 
          {ATTEMPT_STATUSES.map((s) => ( 
            <option key={s} value={s}> 
              {ATTEMPT_LABELS[s]} 
            </option> 
          ))} 
        </select> 
 
        <div className="form-check form-switch mb-0"> 
          <input 
            className="form-check-input" 
            type="checkbox" 
            role="switch" 
            id="refundOnly" 
            checked={refund === "needed"} 
            onChange={(e) => 
              updateParams({ refund: e.target.checked ? "needed" : "" }) 
            } 
          /> 
          <label className="form-check-label" htmlFor="refundOnly"> 
            Refund needed only 
          </label> 
        </div> 
 
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
        loading={payments.loading} 
        error={payments.error} 
        onRetry={payments.reload} 
        loadingMessage="Loading payments..." 
        isEmpty={list.length === 0} 
        emptyState={ 
          <EmptyState 
            title="No payments found" 
            message={ 
              hasFilters 
                ? "No payments match these filters." 
                : "Online payments will appear here." 
            } 
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
                  <th>Date</th> 
                  <th>Order</th> 
                  <th>Customer</th> 
                  <th className="text-end">Amount</th> 
                  <th>Transaction</th> 
                  <th>Status</th> 
                  <th>Refund</th> 
                </tr> 
              </thead> 
              <tbody> 
                {list.map((p) => ( 
                  <tr key={p._id}> 
                    <td className="small"> 
                      {new Date(p.createdAt).toLocaleString()} 
                    </td> 
                    <td> 
                      {p.order && p.order._id ? ( 
                        <> 
                          <Link to={`/admin/orders/${p.order._id}`}> 
                            #{shortId(p.order._id)} 
                          </Link> 
                          <div className="d-flex flex-wrap gap-1 mt-1"> 
                            <StatusBadge status={p.order.status} /> 
                            <PaymentBadge status={p.order.paymentStatus} /> 
                          </div> 
                        </> 
                      ) : ( 
                        <span className="text-muted">Deleted order</span> 
                      )} 
                    </td> 
                    <td> 
                      {p.user && p.user._id ? ( 
                        <> 
                          <div>{p.user.name}</div> 
                          <div className="small text-muted">{p.user.email}</div> 
                        </> 
                      ) : ( 
                        <span className="text-muted">Deleted user</span> 
                      )} 
                    </td> 
                    <td className="text-end">{formatPrice(p.amount)}</td> 
                    <td className="small"> 
                      <div>{p.razorpayPaymentId || "-"}</div> 
                      <div className="text-muted">{p.razorpayOrderId}</div> 
                    </td> 
                    <td> 
                      <span className={`badge ${ATTEMPT_STYLES[p.status]}`}> 
                        {ATTEMPT_LABELS[p.status] || capitalize(p.status)} 
                      </span> 
                      {p.verifiedAt && ( 
                        <div className="small text-muted mt-1"> 
                          {new Date(p.verifiedAt).toLocaleString()} 
                        </div> 
                      )} 
                    </td> 
                    <td> 
                      {p.refundNeeded ? ( 
                        <> 
                          <span className="badge bg-danger">Refund needed</span> 
                          <div className="mt-2"> 
                            {p.needsRefund ? ( 
                              <button 
                                type="button" 
                                className="btn btn-sm btn-outline-success" 
                                onClick={() => setToRefund(p)} 
                              > 
                                Mark refund done 
                              </button> 
                            ) : ( 
                              <Link 
                                to={`/admin/orders/${p.order._id}`} 
                                className="small" 
                              > 
                                Open the order to mark it refunded 
                              </Link> 
                            )} 
                          </div> 
                        </> 
                      ) : p.refundedAt ? ( 
                        <span className="small text-muted"> 
                          Refunded {new Date(p.refundedAt).toLocaleDateString()} 
                        </span> 
                      ) : ( 
                        <span className="text-muted">-</span> 
                      )} 
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
 
      <ConfirmDialog 
        show={Boolean(toRefund)} 
        title="Mark this refund as done?" 
        message={ 
          toRefund && ( 
            <> 
              <p className="mb-2"> 
                Confirm that you already refunded{" "} 
                <strong>{formatPrice(toRefund.amount)}</strong> for payment{" "} 
                <code>{toRefund.razorpayPaymentId}</code> in the Razorpay 
                Dashboard. 
              </p> 
              <p className="mb-0 text-muted small"> 
                This only clears the "refund needed" flag here. It does not 
                send any money. 
              </p> 
            </> 
          ) 
        } 
        confirmLabel="Mark refund done" 
        confirmVariant="success" 
        busy={busy} 
        error={dialogError} 
        onConfirm={confirmRefund} 
        onCancel={cancelDialog} 
      /> 
    </> 
  ); 
} 
 
export default AdminPayments;