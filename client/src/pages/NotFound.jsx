import EmptyState from "../components/EmptyState"; 
 
function NotFound() { 
  return ( 
    <div className="container py-5"> 
      <EmptyState 
        title="404 - Page not found" 
        message="The page you are looking for does not exist." 
        actionLabel="Back to home" 
        actionTo="/" 
      /> 
    </div> 
  ); 
} 
 
export default NotFound;