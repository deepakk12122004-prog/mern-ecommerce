import { NavLink, Outlet } from "react-router-dom"; 
 
const LINKS = [ 
  { to: "/admin", label: "Overview", end: true }, 
  { to: "/admin/products", label: "Products", end: false }, 
  { to: "/admin/orders", label: "Orders", end: false }, 
  { to: "/admin/payments", label: "Payments", end: false }, 
]; 
 
// Shared frame for every admin page: a title, tabs, and the page itself 
// (<Outlet /> is where React Router puts the current admin page). 
function AdminLayout() { 
  const linkClass = ({ isActive }) => "nav-link" + (isActive ? " active" : ""); 
 
  return ( 
    <div className="container py-4"> 
      <h1 className="h3 mb-3">Admin dashboard</h1> 
 
      <ul className="nav nav-pills flex-wrap gap-1 mb-4"> 
        {LINKS.map((link) => ( 
          <li className="nav-item" key={link.to}> 
            <NavLink to={link.to} end={link.end} className={linkClass}> 
              {link.label} 
            </NavLink> 
          </li> 
        ))} 
      </ul> 
 
      <Outlet /> 
    </div> 
  ); 
} 
 
export default AdminLayout;