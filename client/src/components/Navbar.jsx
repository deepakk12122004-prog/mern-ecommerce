import { useState } from "react"; 
import { Link, NavLink } from "react-router-dom"; 
 
function CartIcon() { 
  return ( 
    <svg 
      width="20" 
      height="20" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      aria-hidden="true" 
    > 
      <circle cx="9" cy="21" r="1" /> 
      <circle cx="20" cy="21" r="1" /> 
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /> 
    </svg> 
  ); 
} 
 
// Props: 
//   brand     - store name shown on the left 
//   user      - logged-in user object ({ name, role }) or null 
//   cartCount - number of items in the cart 
//   onLogout  - function called when Logout is clicked 
function Navbar({ brand = "MERN Store", user = null, cartCount = 0, onLogout }) { 
  const [isOpen, setIsOpen] = useState(false); 
  const closeMenu = () => setIsOpen(false); 
 
  // NavLink tells us if the link matches the current URL 
  const linkClass = ({ isActive }) => "nav-link" + (isActive ? " active" : ""); 
  const profileClass = ({ isActive }) => 
    "nav-link d-flex align-items-center gap-2" + (isActive ? " active" : ""); 
 
  const handleLogout = () => { 
    closeMenu(); 
    if (onLogout) onLogout(); 
  }; 
 
  const firstName = user ? user.name.split(" ")[0] : ""; 
  const initial = user ? user.name.charAt(0).toUpperCase() : ""; 
 
  return ( 
    <nav className="navbar navbar-expand-lg site-nav sticky-top"> 
      <div className="container"> 
        <Link className="navbar-brand" to="/" onClick={closeMenu}> 
          <span className="brand-mark" aria-hidden="true"> 
            M 
          </span> 
          {brand} 
        </Link> 
 
        <button 
          className="navbar-toggler border-0" 
          type="button" 
          aria-controls="mainNav" 
          aria-expanded={isOpen} 
          aria-label="Toggle navigation" 
          onClick={() => setIsOpen((prev) => !prev)} 
        > 
          <span className="navbar-toggler-icon"></span> 
        </button> 
 
        <div 
          className={`collapse navbar-collapse ${isOpen ? "show" : ""}`} 
          id="mainNav" 
        > 
          <ul className="navbar-nav me-auto mb-2 mb-lg-0"> 
            <li className="nav-item"> 
              <NavLink end to="/" className={linkClass} onClick={closeMenu}> 
                Home 
              </NavLink> 
            </li> 
            <li className="nav-item"> 
              <NavLink to="/products" className={linkClass} onClick={closeMenu}> 
                Products 
              </NavLink> 
            </li> 
            {user && user.role === "admin" && ( 
              <li className="nav-item"> 
                <NavLink to="/admin" className={linkClass} onClick={closeMenu}> 
                  Admin 
                </NavLink> 
              </li> 
            )} 
          </ul> 
 
          <ul className="navbar-nav align-items-lg-center gap-1"> 
            <li className="nav-item"> 
              <NavLink 
                to="/cart" 
                className={({ isActive }) => 
                  "nav-link d-flex align-items-center gap-2" + (isActive ? " active" : "") 
                } 
                onClick={closeMenu} 
              > 
                <CartIcon /> 
                <span>Cart</span> 
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>} 
              </NavLink> 
            </li> 
 
            {user ? ( 
              <> 
                <li className="nav-item"> 
                  <NavLink to="/orders" className={linkClass} onClick={closeMenu}> 
                    My Orders 
                  </NavLink> 
                </li> 
                <li className="nav-item"> 
                  <NavLink to="/profile" className={profileClass} onClick={closeMenu}> 
                    <span className="avatar" aria-hidden="true"> 
                      {initial} 
                    </span> 
                    <span>{firstName}</span> 
                  </NavLink> 
                </li> 
                <li className="nav-item ms-lg-1 mt-2 mt-lg-0"> 
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary btn-sm" 
                    onClick={handleLogout} 
                  > 
                    Logout 
                  </button> 
                </li> 
              </> 
            ) : ( 
              <> 
                <li className="nav-item"> 
                  <NavLink to="/login" className={linkClass} onClick={closeMenu}> 
                    Login 
                  </NavLink> 
                </li> 
                <li className="nav-item ms-lg-1 mt-2 mt-lg-0"> 
                  <Link 
                    to="/register" 
                    className="btn btn-primary btn-sm px-3" 
                    onClick={closeMenu} 
                  > 
                    Register 
                  </Link> 
                </li> 
              </> 
            )} 
          </ul> 
        </div> 
      </div> 
    </nav> 
  ); 
} 
 
export default Navbar;