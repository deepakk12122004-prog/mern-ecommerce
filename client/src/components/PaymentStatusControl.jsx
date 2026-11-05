import { useEffect, useState } from "react"; 
import { updatePaymentStatus } from "../api/adminService"; 
import { nextPaymentOptions } from "../utils/paymentStatus"; 
import { formatPrice } from "../utils/formatPrice"; 
import ConfirmDialog from "./ConfirmDialog"; 
 
const OPTION_LABELS = { 
  paid: "Mark as paid", 
  failed: "Mark as failed", 
  refunded: "Mark as refunded", 
}; 
 
// Lets an admin record what happened to an order's payment. 
// Every change asks for confirmation first. (The server checks the 
// rules again, so a stale screen cannot make an invalid change.) 
// Props: 
//   order     - { _id, paymentMethod, paymentStatus, totalPrice } 
//   onUpdated - function(updatedOrder) 
//   compact   - smaller controls, for table rows 
function PaymentStatusControl({ order, onUpdated, compact = false }) { 
  const options = nextPaymentOptions(order); 
  const [next, setNext] = useState(options[0] || ""); 
  const [busy, setBusy] = useState(false); 
  const [error, setError] = useState(""); 
  const [confirming, setConfirming] = useState(false); 
 
  // When the payment changes, offer its new options 
  useEffect(() => { 
    setNext(nextPaymentOptions(order)[0] || ""); 
    setError(""); 
  }, [order.paymentStatus, order.paymentMethod]); // eslint-disable-line 
 
  if (options.length === 0) { 
    if (compact) return null; 
    return <span className="text-muted small">No payment action needed</span>; 
  } 
 
  const amount = formatPrice(order.totalPrice); 
 
  const messages = { 
    paid: `Confirm that ${amount} was collected for this order.`, 
    failed: 
      "Mark this payment as failed? Use this when the customer refused " + 
      "the order or did not pay.", 
    refunded: `Confirm that ${amount} was refunded to the customer.`, 
  }; 
 
  const apply = async () => { 
    setBusy(true); 
    setError(""); 
    try { 
      const updated = await updatePaymentStatus(order._id, next); 
      setConfirming(false); 
      onUpdated(updated); 
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setBusy(false); 
    } 
  }; 
 
  const size = compact ? "form-select-sm" : ""; 
  const btnSize = compact ? "btn-sm" : ""; 
 
  return ( 
    <div> 
      <div className="d-flex flex-wrap gap-2 align-items-center"> 
        <select 
          className={`form-select ${size} w-auto`} 
          aria-label="New payment status" 
          value={next} 
          onChange={(e) => setNext(e.target.value)} 
          disabled={busy} 
        > 
          {options.map((status) => ( 
            <option key={status} value={status}> 
              {OPTION_LABELS[status] || status} 
            </option> 
          ))} 
        </select> 
        <button 
          type="button" 
          className={`btn btn-outline-primary ${btnSize}`} 
          onClick={() => setConfirming(true)} 
          disabled={busy || !next} 
        > 
          Update payment 
        </button> 
      </div> 
 
      <ConfirmDialog 
        show={confirming} 
        title="Update payment status?" 
        message={messages[next]} 
        confirmLabel={OPTION_LABELS[next] || "Confirm"} 
        confirmVariant={next === "paid" ? "success" : "primary"} 
        busy={busy} 
        error={error} 
        onConfirm={apply} 
        onCancel={() => { 
          setConfirming(false); 
          setError(""); 
        }} 
      /> 
    </div> 
  ); 
} 
 
export default PaymentStatusControl;