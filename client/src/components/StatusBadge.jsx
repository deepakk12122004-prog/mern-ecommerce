const STATUS_STYLES = { 
pending: "bg-warning text-dark", 
processing: "bg-info text-dark", 
shipped: "bg-primary", 
delivered: "bg-success", 
cancelled: "bg-danger", 
}; 
// Props: status - "pending", "processing", "shipped", ... 
function StatusBadge({ status }) { 
const style = STATUS_STYLES[status] || "bg-secondary"; 
return <span className={`badge text-capitalize ${style}`}>{status}</span>; 
} 
export default StatusBadge; 