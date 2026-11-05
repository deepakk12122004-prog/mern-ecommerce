const STYLES = { 
  pending: "bg-warning text-dark", 
  paid: "bg-success", 
  failed: "bg-danger", 
  refunded: "bg-info text-dark", 
  cancelled: "bg-secondary", 
}; 
 
const LABELS = { 
  pending: "Pending", 
  paid: "Paid", 
  failed: "Failed", 
  refunded: "Refunded", 
  cancelled: "Cancelled", 
}; 
 
// Props: status - "pending", "paid", "failed", "refunded" or "cancelled" 
function PaymentBadge({ status }) { 
  const style = STYLES[status] || "bg-secondary"; 
  return ( 
    <span className={`badge ${style}`}>{LABELS[status] || status || "-"}</span> 
  ); 
} 
 
export default PaymentBadge;