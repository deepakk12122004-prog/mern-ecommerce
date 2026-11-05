import Loading from "./Loading"; 
import ErrorMessage from "./ErrorMessage"; 
 
// Shows the right thing for the 4 states of a data page: 
// loading -> error -> empty -> content (children) 
function AsyncContent({ 
  loading, 
  error, 
  onRetry, 
  isEmpty = false, 
  emptyState = null, 
  loadingMessage = "Loading...", 
  children, 
}) { 
  if (loading) return <Loading message={loadingMessage} />; 
  if (error) return <ErrorMessage message={error} onRetry={onRetry} />; 
  if (isEmpty) return emptyState; 
  return children; 
} 
 
export default AsyncContent;