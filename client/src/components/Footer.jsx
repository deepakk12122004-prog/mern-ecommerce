 
import { Link } from "react-router-dom"; 
 
// Props: 
//   brand - store name shown in the footer 
function Footer({ brand = "MERN Store" }) { 
  const year = new Date().getFullYear(); 
 
  return ( 
    <footer className="site-footer mt-5"> 
      <div className="container py-5"> 
        <div className="row g-4"> 
          <div className="col-12 col-md-6 col-lg-5"> 
            <h6 className="mb-3">{brand}</h6> 
            <p className="mb-0"> 
              A simple, friendly online store built with the MERN stack as a 
              portfolio project. 
            </p> 
          </div> 
 
          <div className="col-6 col-md-3 col-lg-3 offset-lg-1"> 
            <h6 className="mb-3">Shop</h6> 
            <ul> 
              <li><Link to="/products">All products</Link></li> 
              <li><Link to="/cart">Cart</Link></li> 
            </ul> 
          </div> 
 
          <div className="col-6 col-md-3 col-lg-3"> 
            <h6 className="mb-3">Account</h6> 
            <ul> 
              <li><Link to="/login">Login</Link></li> 
              <li><Link to="/register">Register</Link></li> 
              <li><Link to="/orders">My orders</Link></li> 
            </ul> 
          </div> 
        </div> 
      </div> 
 
      <div className="footer-bottom py-3"> 
        <div className="container d-flex flex-column flex-sm-row justify-content-between 
gap-1 small"> 
          <span> 
            &copy; {year} {brand}. All rights reserved. 
          </span> 
          <span>Built with React, Express, and MongoDB</span> 
        </div> 
      </div> 
    </footer> 
  ); 
} 
 
export default Footer; 