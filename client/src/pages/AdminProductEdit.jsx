import { useEffect, useState } from "react"; 
import { Link, useLocation, useParams } from "react-router-dom"; 
import useFetch from "../hooks/useFetch"; 
import { updateProduct } from "../api/adminService"; 
import { getProductById, getCategories } from "../api/productService"; 
import { productToFormValues } from "../utils/productForm"; 
import AsyncContent from "../components/AsyncContent"; 
import EmptyState from "../components/EmptyState"; 
import ProductForm from "../components/ProductForm"; 
import ProductImageUploader from "../components/ProductImageUploader"; 
 
// Only rendered once the product has loaded 
function EditBody({ product, categories, banner, onSave, onProductChange }) { 
  return ( 
    <> 
      {banner && ( 
        <div className="alert alert-success" role="status"> 
          {banner} 
        </div> 
      )} 
 
      <div className="card mb-4"> 
        <div className="card-body p-3 p-md-4"> 
          <h3 className="h5 mb-3">Details</h3> 
          {/* key = product id: the form is only rebuilt for a different 
              product, not after an image upload */} 
          <ProductForm 
            key={product._id} 
            initialValues={productToFormValues(product)} 
            categories={categories} 
            submitLabel="Save changes" 
            onSubmit={onSave} 
          /> 
        </div> 
      </div> 
 
      <h3 className="h5 mb-3">Image</h3> 
      <ProductImageUploader product={product} onChange={onProductChange} /> 
    </> 
  ); 
} 
 
function AdminProductEdit() { 
  const { id } = useParams(); 
  const location = useLocation(); 
 
  // Admins can load hidden products too 
  const { data, loading, error, errorStatus, reload } = useFetch( 
    () => getProductById(id), 
    [id] 
  ); 
  const categories = useFetch(() => getCategories(), []); 
 
  const [updated, setUpdated] = useState(null); // newest copy after changes 
  const [saved, setSaved] = useState(false); 
 
  useEffect(() => { 
    setUpdated(null); 
    setSaved(false); 
  }, [id]); 
 
  const product = updated || data; 
  const notFound = errorStatus === 400 || errorStatus === 404; 
  const created = Boolean(location.state && location.state.created); 
 
  // ProductForm calls this with clean values; if it throws, 
  // the form shows the error. 
  const handleSave = async (values) => { 
    setSaved(false); 
    const result = await updateProduct(id, values); 
    setUpdated(result); 
    setSaved(true); 
  }; 
 
  let banner = ""; 
  if (saved) banner = "Changes saved."; 
  else if (created) banner = "Product created. You can add an image below."; 
 
  return ( 
    <> 
      <Link 
        to="/admin/products" 
        className="btn btn-link ps-0 mb-2 text-decoration-none" 
      > 
        &larr; Back to products 
      </Link> 
 
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 
mb-3"> 
        <h2 className="h4 mb-0">Edit product</h2> 
        {product && ( 
          <Link to={`/products/${product._id}`} className="small"> 
            View in shop 
          </Link> 
        )} 
      </div> 
 
      <AsyncContent 
        loading={loading} 
        error={notFound ? "" : error} 
        onRetry={reload} 
        loadingMessage="Loading product..." 
        isEmpty={notFound} 
        emptyState={ 
          <EmptyState 
            title="Product not found" 
            message="It may have been deleted." 
            actionLabel="Back to products" 
            actionTo="/admin/products" 
          /> 
        } 
      > 
        <EditBody 
          product={product} 
          categories={categories.data || []} 
          banner={banner} 
          onSave={handleSave} 
          onProductChange={setUpdated} 
        /> 
      </AsyncContent> 
    </> 
); 
} 
export default AdminProductEdit;