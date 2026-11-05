import { useEffect, useRef } from "react"; 
import useRazorpayPayment from "../hooks/useRazorpayPayment"; 
import useFetch from "../hooks/useFetch"; 
import { getPaymentMethods } from "../api/paymentService"; 
import { formatPrice } from "../utils/formatPrice"; 
 
const STAGE_LABELS = { 
  starting: "Opening the payment window...", 
  waiting: "Waiting for your payment...", 
  verifying: "Confirming your payment...", 
}; 
 
// Shown on the order page for a UPI order that is not paid yet. 
// Props: 
//   order       - the order (needs _id, totalPrice and createdAt) 
//   autoStart   - open the payment window right away (after checkout) 
//   onStarted   - called once when the window was started automatically 
//   onPaid      - function(updatedOrder), after the server verified it 
//   onStale     - function(), the order changed, reload it 
function PayNowPanel({ order, autoStart = false, onStarted, onPaid, onStale }) { 
  const { pay, retryConfirm, stage, error, notice, canRetry } = 
    useRazorpayPayment({ onPaid, onStale }); 
  const startedRef = useRef(false); 
 
  // How long an unpaid UPI order is kept (set by the server) 
  const settings = useFetch(() => getPaymentMethods(), []); 
  const minutes = settings.data ? settings.data.upiPaymentWindowMinutes : null; 
  const deadline = minutes 
    ? new Date(new Date(order.createdAt).getTime() + minutes * 60 * 1000) 
    : null; 
 
  // Right after checkout, open the payment window automatically 
  useEffect(() => { 
    if (autoStart && !startedRef.current) { 
      startedRef.current = true; 
      if (onStarted) onStarted(); 
      pay(order); 
    } 
    // Only once, when the panel first appears 
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, []); 
 
  const busy = stage !== "idle"; 
 
  return ( 
    <div className="card border-warning mb-4"> 
      <div className="card-body"> 
        <h2 className="h5 mb-2">Complete your payment</h2> 
        <p className="mb-2"> 
          Pay <strong>{formatPrice(order.totalPrice)}</strong> with UPI to 
          confirm your order. Your UPI PIN is entered only in your UPI app 
          and is never seen or stored by this website. 
        </p> 
        {deadline && ( 
          <p className="small text-muted mb-3"> 
            Please pay before{" "} 
            <strong> 
              {deadline.toLocaleTimeString([], { 
                hour: "2-digit", 
                minute: "2-digit", 
              })} 
            </strong> 
            . Unpaid orders are cancelled automatically after {minutes}{" "} 
            minutes. 
          </p> 
        )} 
 
        {error && ( 
          <div className="alert alert-danger" role="alert"> 
            {error} 
          </div> 
        )} 
        {notice && !error && ( 
          <div className="alert alert-info" role="status"> 
            {notice} 
          </div> 
        )} 
 
        <div className="d-flex flex-wrap gap-2 align-items-center"> 
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={() => pay(order)} 
            disabled={busy} 
          > 
            {busy 
              ? STAGE_LABELS[stage] 
              : `Pay ${formatPrice(order.totalPrice)} with UPI`} 
          </button> 
 
          {canRetry && ( 
            <button 
              type="button" 
              className="btn btn-outline-primary" 
              onClick={retryConfirm} 
              disabled={busy} 
            > 
              Try confirming again 
            </button> 
          )} 
        </div> 
      </div> 
    </div> 
  ); 
} 
 
export default PayNowPanel;