import { useEffect, useState } from "react"; 
import { updateOrderStatus } from "../api/adminService"; 
import { NEXT_STATUSES, capitalize } from "../utils/orderStatus"; 
import ConfirmDialog from "./ConfirmDialog"; 
 
// Lets an admin move an order to its next status. 
// Only the statuses that make sense are offered. (The server checks 
// again, so a stale screen cannot make an invalid change.) 
// Props: 
//   order     - { _id, status } 
//   onUpdated - function(updatedOrder), called after a successful change 
//   compact   - smaller controls, for table rows 
function OrderStatusControl({ order, onUpdated, compact = false }) { 
  const options = NEXT_STATUSES[order.status] || []; 
  const [next, setNext] = useState(options[0] || ""); 
  const [busy, setBusy] = useState(false); 
  const [error, setError] = useState(""); 
  const [confirmCancel, setConfirmCancel] = useState(false); 
 
  // When the order's status changes, offer its new options 
  useEffect(() => { 
    setNext((NEXT_STATUSES[order.status] || [])[0] || ""); 
    setError(""); 
  }, [order.status]); 
 
  if (options.length === 0) { 
    return <span className="text-muted small">Final status</span>; 
  } 
 
  const apply = async () => { 
    setBusy(true); 
    setError(""); 
    try { 
      const updated = await updateOrderStatus(order._id, next); 
      setConfirmCancel(false); 
      onUpdated(updated); 
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setBusy(false); 
    } 
  }; 
 
  // Cancelling puts the stock back and cannot be undone: ask first 
  const handleClick = () => { 
    if (next === "cancelled") setConfirmCancel(true); 
    else apply(); 
  }; 
 
  const size = compact ? "form-select-sm" : ""; 
  const btnSize = compact ? "btn-sm" : ""; 
 
  return ( 
    <div> 
      <div className="d-flex flex-wrap gap-2 align-items-center"> 
        <select 
          className={`form-select ${size} w-auto`} 
          aria-label="New status" 
          value={next} 
          onChange={(e) => setNext(e.target.value)} 
          disabled={busy} 
        > 
          {options.map((status) => ( 
            <option key={status} value={status}> 
              {capitalize(status)} 
            </option> 
          ))} 
        </select> 
        <button 
          type="button" 
          className={`btn btn-primary ${btnSize}`} 
          onClick={handleClick} 
          disabled={busy || !next} 
        > 
          {busy && !confirmCancel ? "Updating..." : "Update status"} 
        </button> 
      </div> 
 
      {error && !confirmCancel && ( 
        <div className="text-danger small mt-1" role="alert"> 
          {error} 
        </div> 
      )} 
 
      <ConfirmDialog 
        show={confirmCancel} 
        title="Cancel this order?" 
        message="The items will go back into stock. This cannot be undone." 
        confirmLabel="Cancel order" 
        cancelLabel="Keep order" 
        busy={busy} 
        error={error} 
        onConfirm={apply} 
        onCancel={() => { 
          setConfirmCancel(false); 
          setError(""); 
        }} 
      /> 
    </div> 
  ); 
} 
 
export default OrderStatusControl;