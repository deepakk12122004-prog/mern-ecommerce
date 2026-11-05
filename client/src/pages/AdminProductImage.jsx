import { useEffect, useState } from "react"; 
import { Link, useParams } from "react-router-dom"; 
import useFetch from "../hooks/useFetch"; 
import { getProductById } from "../api/productService"; 
import AsyncContent from "../components/AsyncContent"; 
import EmptyState from "../components/EmptyState"; 
import ProductImageUploader from "../components/ProductImageUploader"; 
 
// Admin page: /admin/products/:id/image 
// (the route is wrapped in <ProtectedRoute adminOnly /> in App.jsx; 
// the server checks admin rights again on every upload) 
function AdminProductImage() { 
  const { id } = useParams(); 
  const { data, loading, error, errorStatus, reload } = useFetch( 
    () => getProductById(id), 
    [id] 
  ); 
 
  // After an upload we keep the updated product here 
  const [updated, setUpdated] = useState(null); 
  useEffect(() => { 
    setUpdated(null); 
  }, [id]); 
 
  const product = updated || data; 
  const notFound = errorStatus === 400 || errorStatus === 404; 
 
  return ( 
    <div className="container py-4 py-lg-5"> 
      <Link 
        to="/products" 
        className="btn btn-link ps-0 mb-2 text-decoration-none" 
      > 
        &larr; Back to products 
      </Link> 
 
      <h1 className="h3 mb-1">Product image</h1> 
      {product && ( 
        <p className="text-muted mb-3"> 
          {product.name} &middot;{" "} 
          <Link to={`/products/${product._id}`}>View product page</Link> 
        </p> 
      )} 
 
      <AsyncContent 
        loading={loading} 
        error={notFound ? "" : error} 
        onRetry={reload} 
        loadingMessage="Loading product..." 
        isEmpty={notFound} 
        emptyState={ 
          <EmptyState 
            title="Product not found" 
            message="It may have been removed or the link may be wrong." 
            actionLabel="Browse products" 
            actionTo="/products" 
          /> 
        } 
      > 
        <ProductImageUploader product={product} onChange={setUpdated} /> 
      </AsyncContent> 
    </div> 
  ); 
} 
 
export default AdminProductImage;