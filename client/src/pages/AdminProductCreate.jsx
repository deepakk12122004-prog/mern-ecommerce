import { Link, useNavigate } from "react-router-dom"; 
import useFetch from "../hooks/useFetch"; 
import { createProduct } from "../api/adminService"; 
import { getCategories } from "../api/productService"; 
import { EMPTY_PRODUCT_VALUES } from "../utils/productForm"; 
import ProductForm from "../components/ProductForm"; 
 
function AdminProductCreate() { 
  const navigate = useNavigate(); 
  const categories = useFetch(() => getCategories(), []); 
 
  // The form calls this with clean values. If it throws, the form shows 
  // the error. On success we go to the edit page, where the image can 
  // be uploaded (a product needs to exist before it can have an image). 
  const handleCreate = async (values) => { 
    const product = await createProduct(values); 
    navigate(`/admin/products/${product._id}/edit`, { 
      replace: true, 
      state: { created: true }, 
    }); 
  }; 
 
  return ( 
    <> 
      <Link 
        to="/admin/products" 
        className="btn btn-link ps-0 mb-2 text-decoration-none" 
      > 
        &larr; Back to products 
      </Link> 
 
      <h2 className="h4 mb-3">Add product</h2> 
 
      <div className="card"> 
        <div className="card-body p-3 p-md-4"> 
          <ProductForm 
            initialValues={EMPTY_PRODUCT_VALUES} 
            categories={categories.data || []} 
            submitLabel="Create product" 
            onSubmit={handleCreate} 
          /> 
        </div> 
      </div> 
    </> 
  ); 
} 
 
export default AdminProductCreate;