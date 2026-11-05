import { Navigate, Outlet, useLocation } from "react-router-dom"; 
import { useAuth } from "../context/AuthContext"; 
 
// Wraps pages only for logged-out visitors (Login, Register). 
// Once someone is logged in, it sends them onward: back to the page 
// they originally wanted, or to Home. 
function GuestRoute() { 
  const { user } = useAuth(); 
  const location = useLocation(); 
 
  if (user) { 
    const from = location.state && location.state.from; 
    const target = from ? from.pathname + (from.search || "") : "/"; 
    return <Navigate to={target} replace />; 
  } 
 
  return <Outlet />; 
} 
 
export default GuestRoute;