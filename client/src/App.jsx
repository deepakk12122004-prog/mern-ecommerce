import { Routes, Route, useNavigate } from "react-router-dom"; 
 
import Navbar from "./components/Navbar"; 
import Footer from "./components/Footer"; 
import Loading from "./components/Loading"; 
import ProtectedRoute from "./components/ProtectedRoute"; 
import GuestRoute from "./components/GuestRoute"; 
import AdminLayout from "./components/AdminLayout"; 
import { useAuth } from "./context/AuthContext"; 
import { useCart } from "./context/CartContext"; 
 
import Home from "./pages/Home"; 
import Products from "./pages/Products"; 
import ProductDetails from "./pages/ProductDetails"; 
import Login from "./pages/Login"; 
import Register from "./pages/Register"; 
import Cart from "./pages/Cart"; 
import Checkout from "./pages/Checkout"; 
import Profile from "./pages/Profile"; 
import MyOrders from "./pages/MyOrders"; 
import OrderDetails from "./pages/OrderDetails"; 
import AdminProductImage from "./pages/AdminProductImage"; 
import AdminOverview from "./pages/AdminOverview"; 
import AdminProducts from "./pages/AdminProducts"; 
import AdminProductCreate from "./pages/AdminProductCreate"; 
import AdminProductEdit from "./pages/AdminProductEdit"; 
import AdminOrders from "./pages/AdminOrders"; 
import AdminOrderDetails from "./pages/AdminOrderDetails"; 
import AdminPayments from "./pages/AdminPayments"; 
import NotFound from "./pages/NotFound"; 
 
function App() { 
  const { user, logout, loading } = useAuth(); 
  const { totalItems } = useCart(); 
  const navigate = useNavigate(); 
 
  const handleLogout = () => { 
    navigate("/"); // leave any protected page first 
    logout(); 
  }; 
 
  // On every page load we ask the server who is logged in. 
  // Waiting here avoids a flash of "Login / Register" for people 
  // who are actually logged in. 
  if (loading) { 
    return ( 
      <div className="min-vh-100 d-flex align-items-center justify-content-center"> 
        <Loading message="Loading..." /> 
      </div> 
    ); 
  } 
 
  return ( 
    <div className="d-flex flex-column min-vh-100"> 
      <Navbar user={user} cartCount={totalItems} onLogout={handleLogout} /> 
 
      <main className="flex-grow-1"> 
        <Routes> 
          {/* Public pages */} 
          <Route path="/" element={<Home />} /> 
          <Route path="/products" element={<Products />} /> 
          <Route path="/products/:id" element={<ProductDetails />} /> 
          <Route path="/cart" element={<Cart />} /> 
 
          {/* Only for logged-out visitors */} 
          <Route element={<GuestRoute />}> 
            <Route path="/login" element={<Login />} /> 
            <Route path="/register" element={<Register />} /> 
          </Route> 
 
          {/* Pages that require login */} 
          <Route element={<ProtectedRoute />}> 
            <Route path="/checkout" element={<Checkout />} /> 
            <Route path="/profile" element={<Profile />} /> 
            <Route path="/orders" element={<MyOrders />} /> 
            <Route path="/orders/:id" element={<OrderDetails />} /> 
          </Route> 
 
          {/* Admin pages. ProtectedRoute only hides them from other 
              users on screen. The server checks admin rights again on 
              every request. */} 
          <Route element={<ProtectedRoute adminOnly />}> 
            <Route element={<AdminLayout />}> 
              <Route path="/admin" element={<AdminOverview />} /> 
              <Route path="/admin/products" element={<AdminProducts />} /> 
              <Route 
                path="/admin/products/new" 
                element={<AdminProductCreate />} 
              /> 
              <Route 
                path="/admin/products/:id/edit" 
                element={<AdminProductEdit />} 
              /> 
              <Route path="/admin/orders" element={<AdminOrders />} /> 
              <Route 
                path="/admin/orders/:id" 
                element={<AdminOrderDetails />} 
              /> 
              <Route path="/admin/payments" element={<AdminPayments />} /> 
            </Route> 
            {/* From the image stage (still works) */} 
            <Route 
              path="/admin/products/:id/image" 
              element={<AdminProductImage />} 
            /> 
          </Route> 
 
          {/* Anything else */} 
          <Route path="*" element={<NotFound />} /> 
        </Routes> 
      </main> 
 
<Footer /> 
</div> 
); 
} 
export default App;