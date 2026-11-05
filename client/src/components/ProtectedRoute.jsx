import { Navigate, Outlet, useLocation } from "react-router-dom"; 
import { useAuth } from "../context/AuthContext"; 
 
// Wraps pages that need login. App.jsx only shows routes after the 
// first "who am I?" check finishes, so `user` is reliable here. 
//   adminOnly - if true, only users with role "admin" may enter 
// 
// This only controls what the screen shows. The server still checks 
// every request, because anyone can change the frontend in their browser. 
function ProtectedRoute({ adminOnly = false }) { 
  const { user } = useAuth(); 
  const location = useLocation(); 
 
  if (!user) { 
    // Remember where the visitor wanted to go 
    return <Navigate to="/login" replace state={{ from: location }} />; 
  } 
 
  if (adminOnly && user.role !== "admin") { 
    return <Navigate to="/" replace />; 
  } 
 
  return <Outlet />; 
} 
 
export default ProtectedRoute;