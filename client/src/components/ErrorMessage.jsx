// Props: 
//   message - the error text to show 
//   onRetry - optional function; if given, a "Try again" button appears 
function ErrorMessage({ message = "Something went wrong.", onRetry }) { 
  return ( 
    <div 
      className="alert alert-danger d-flex flex-column flex-sm-row align-items-sm-center 
justify-content-between gap-2" 
      role="alert" 
    > 
      <span>{message}</span> 
      {onRetry && ( 
        <button 
          type="button" 
          className="btn btn-sm btn-outline-danger" 
          onClick={onRetry} 
        > 
          Try again 
        </button> 
      )} 
    </div> 
  ); 
} 
 
export default ErrorMessage; 