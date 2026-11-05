import { StrictMode } from "react"; 
import { createRoot } from "react-dom/client"; 
import { BrowserRouter } from "react-router-dom"; 
 
import "bootstrap/dist/css/bootstrap.min.css"; 
import "./index.css"; 
 
import App from "./App.jsx"; 
import { AuthProvider } from "./context/AuthContext.jsx"; 
import { CartProvider } from "./context/CartContext.jsx"; 
 
createRoot(document.getElementById("root")).render( 
  <StrictMode> 
    <BrowserRouter> 
      {/* Providers make user + cart data available to every component */} 
      <AuthProvider> 
        <CartProvider> 
          <App /> 
        </CartProvider> 
      </AuthProvider> 
    </BrowserRouter> 
  </StrictMode> 
); 
 
 
 


