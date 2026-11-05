import { Link } from "react-router-dom"; 
 
const TONES = { 
  default: "", 
  warning: "text-warning-emphasis", 
  danger: "text-danger", 
  success: "text-success", 
}; 
 
// A number with a label, used on the overview. 
// Props: 
//   label - what the number is 
//   value - the number (or text) to show big 
//   hint  - optional small text under the value 
//   to    - optional link (the whole card becomes clickable) 
//   tone  - "default", "warning", "danger" or "success" 
function StatCard({ label, value, hint, to, tone = "default" }) { 
  const card = ( 
    <div className="card h-100"> 
      <div className="card-body"> 
        <div className="text-muted small text-uppercase">{label}</div> 
        <div className={`fs-3 fw-bold ${TONES[tone] || ""}`}>{value}</div> 
        {hint && <div className="small text-muted">{hint}</div>} 
      </div> 
    </div> 
  ); 
 
  if (!to) return card; 
 
  return ( 
    <Link to={to} className="text-decoration-none text-reset d-block h-100"> 
      {card} 
    </Link> 
  ); 
} 
 
export default StatCard;