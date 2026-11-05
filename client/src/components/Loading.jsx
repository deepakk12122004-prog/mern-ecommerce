// Props: 
//   message - text shown under the spinner 
function Loading({ message = "Loading..." }) { 
  return ( 
    <div className="text-center py-5" role="status"> 
      <div className="spinner-border text-primary" aria-hidden="true"></div> 
      <p className="mt-3 mb-0 text-muted">{message}</p> 
    </div> 
  ); 
} 
 
export default Loading; 