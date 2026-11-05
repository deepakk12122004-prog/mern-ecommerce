import { useCallback, useRef, useState } from "react"; 
import { loadRazorpay } from "../utils/loadRazorpay"; 
import { 
  createRazorpayOrder, 
  verifyRazorpayPayment, 
  reportPaymentFailure, 
} from "../api/paymentService"; 
 
// Shown at the top of the payment window. Change it to your shop name. 
const STORE_NAME = "My Store"; 
const BRAND_COLOR = "#4f46e5"; 
 
// This is a UPI order, so the window shows ONLY UPI. 
const UPI_ONLY = { 
  display: { 
    blocks: { 
      upi: { name: "Pay using UPI", instruments: [{ method: "upi" }] }, 
    }, 
    sequence: ["block.upi"], 
    preferences: { show_default_blocks: false }, 
  }, 
}; 
 
// Keeps only a few short, safe fields of a Razorpay error 
function pickError(error) { 
  const e = error || {}; 
  return { 
    code: e.code, 
    description: e.description, 
    reason: e.reason, 
    step: e.step, 
  }; 
} 
 
// Opens Razorpay's payment window and waits until it ends. 
// Resolves with: 
//   { type: "success", proof }           the customer paid 
//   { type: "dismissed", failedOnce }    the window was closed 
function openPaymentWindow(Razorpay, session) { 
  return new Promise((resolve) => { 
    let finished = false; 
    let failedOnce = false; 
 
    const finish = (result) => { 
      if (!finished) { 
        finished = true; 
        resolve(result); 
      } 
    }; 
 
    // Fire and forget: tells the server what happened (recorded only) 
    const report = (reason, error) => { 
      reportPaymentFailure({ 
        orderId: session.orderId, 
        razorpayOrderId: session.razorpayOrderId, 
        reason, 
        error: pickError(error), 
      }).catch(() => {}); 
    }; 
 
    const paymentWindow = new Razorpay({ 
      key: session.keyId, // the PUBLIC key id 
      amount: session.amount, // paise, decided by our server 
      currency: session.currency, 
      order_id: session.razorpayOrderId, 
      name: STORE_NAME, 
      description: session.description, 
      prefill: session.prefill, 
      theme: { color: BRAND_COLOR }, 
      config: UPI_ONLY, 
 
      // Razorpay calls this after a payment went through. It is only a 
      // CLAIM. Our server must still verify the signature. 
      handler: (response) => 
        finish({ 
          type: "success", 
          proof: { 
            razorpayOrderId: response.razorpay_order_id, 
            razorpayPaymentId: response.razorpay_payment_id, 
            razorpaySignature: response.razorpay_signature, 
          }, 
        }), 
 
      modal: { 
        confirm_close: true, // asks "are you sure?" before closing 
        ondismiss: () => { 
          if (!failedOnce) report("cancelled"); 
          finish({ type: "dismissed", failedOnce }); 
        }, 
      }, 
    }); 
 
    // A failed attempt. The window stays open so the customer can retry. 
    paymentWindow.on("payment.failed", (response) => { 
      failedOnce = true; 
      report("failed", response && response.error); 
    }); 
 
    paymentWindow.open(); 
  }); 
} 
 
// Runs the whole online payment for one order. 
//   onPaid(order)  - called with the updated order after the SERVER 
//                    has verified the payment 
//   onStale()      - called when the server says the order changed 
//                    (for example it was cancelled), so the page reloads 
// Returns { pay, retryConfirm, stage, error, notice, canRetry } 
//   stage: "idle", "starting", "waiting" or "verifying" 
export default function useRazorpayPayment({ onPaid, onStale } = {}) { 
  const [stage, setStage] = useState("idle"); 
  const [error, setError] = useState(""); 
  const [notice, setNotice] = useState(""); 
  const [canRetry, setCanRetry] = useState(false); 
 
  const busyRef = useRef(false); 
  // The proof of a successful payment, kept if we could not reach 
  // the server to verify it, so we can try again 
  const proofRef = useRef(null); 
 
  // Asks OUR server to check the payment. Only the server's answer 
  // can make an order paid. 
  const confirm = useCallback( 
    async (orderId, proof) => { 
      setStage("verifying"); 
      try { 
        const order = await verifyRazorpayPayment({ orderId, ...proof }); 
        proofRef.current = null; 
        setCanRetry(false); 
        setNotice("Payment received. Thank you!"); 
        if (onPaid) onPaid(order); 
      } catch (err) { 
        setError(err.message); 
        const serverUnreachable = !err.status || err.status >= 500; 
        if (serverUnreachable) { 
          // The money may have been taken: keep the proof and allow a retry 
          proofRef.current = { orderId, proof }; 
          setCanRetry(true); 
        } else if (err.status === 409 && onStale) { 
          onStale(); 
        } 
      } 
    }, 
    [onPaid, onStale] 
  ); 
 
  const pay = useCallback( 
    async (order) => { 
      if (busyRef.current) return; // never two windows at once 
      busyRef.current = true; 
      setError(""); 
      setNotice(""); 
      setCanRetry(false); 
      proofRef.current = null; 
      setStage("starting"); 
 
      try { 
        const Razorpay = await loadRazorpay(); 
        const session = await createRazorpayOrder(order._id); 
 
        setStage("waiting"); 
        const outcome = await openPaymentWindow(Razorpay, session); 
 
        if (outcome.type === "success") { 
          await confirm(order._id, outcome.proof); 
        } else if (outcome.failedOnce) { 
          setNotice( 
            "The payment did not go through. Your order is saved. " + 
              "You can try again with the button below." 
          ); 
        } else { 
          setNotice( 
            "Payment cancelled. Your order is saved. " + 
              "You can pay any time with the button below." 
          ); 
        } 
      } catch (err) { 
        setError(err.message); 
        if (err.status === 409 && onStale) onStale(); 
      } finally { 
        busyRef.current = false; 
        setStage("idle"); 
      } 
    }, 
    [confirm, onStale] 
  ); 
 
  // Tries again to verify a payment that was made but not confirmed 
  const retryConfirm = useCallback(async () => { 
    const saved = proofRef.current; 
    if (!saved || busyRef.current) return; 
    busyRef.current = true; 
    setError(""); 
    setCanRetry(false); 
    try { 
      await confirm(saved.orderId, saved.proof); 
    } finally { 
      busyRef.current = false; 
      setStage("idle"); 
    } 
  }, [confirm]); 
 
  return { pay, retryConfirm, stage, error, notice, canRetry }; 
} 