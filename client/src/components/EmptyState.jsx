import { Link } from "react-router-dom"; 
 
// Props: 
//   title       - heading text 
//   message     - optional explanation 
//   actionLabel - optional button text 
//   actionTo    - if given, the button is a link to this path 
//   onAction    - if given (and no actionTo), the button runs this function 
function EmptyState({ 
  title = "Nothing here yet", 
  message, 
  actionLabel, 
  actionTo, 
  onAction, 
}) { 
  return ( 
    <div className="text-center py-5"> 
      <div className="empty-icon" aria-hidden="true"> 
        <svg 
          width="32" 
          height="32" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        > 
          <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" /> 
          <path d="M3.3 7.5L12 12l8.7-4.5" /> 
          <path d="M12 12v9" /> 
        </svg> 
      </div> 
 
      <h4>{title}</h4> 
      {message && <p className="text-muted">{message}</p>} 
 
      {actionLabel && actionTo && ( 
        <Link to={actionTo} className="btn btn-primary"> 
          {actionLabel} 
        </Link> 
      )} 
 
      {actionLabel && !actionTo && onAction && ( 
        <button type="button" className="btn btn-primary" onClick={onAction}> 
          {actionLabel} 
        </button> 
      )} 
    </div> 
  ); 
} 
 
export default EmptyState;  