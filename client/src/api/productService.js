import api from "./axios"; 
 
// Removes empty values, so we never send "?search=&category=". 
function cleanParams(params) { 
  const clean = {}; 
  Object.entries(params).forEach(([key, value]) => { 
    if (value !== undefined && value !== null && value !== "") { 
      clean[key] = value; 
    } 
  }); 
  return clean; 
} 
 
// params can contain: search, category, minPrice, maxPrice, 
//                     sort, page, limit 
// Returns: 
//   products   - array of products 
//   pagination - { page, limit, total, totalPages, 
//                  hasNextPage, hasPrevPage } 
// Axios builds and encodes the query string from the object. 
export async function getProducts(params = {}) { 
  const res = await api.get("/products", { params: cleanParams(params) }); 
  return { products: res.data.data, pagination: res.data.pagination }; 
} 
 
export async function getProductById(id) { 
  // encodeURIComponent stops a strange id from changing the URL path 
  const res = await api.get(`/products/${encodeURIComponent(id)}`); 
  return res.data.data; 
} 
 
// An array of category names, for example ["Books", "Electronics"] 
export async function getCategories() { 
  const res = await api.get("/products/categories"); 
  return res.data.data; 
} 
 
// ---- Admin only ---- 
 
// Uploads a picture for a product. The file goes to OUR server, 
// which sends it to Cloudinary. onProgress(0-100) is optional. 
// Returns the updated product (with image.url). 
export async function uploadProductImage(id, file, onProgress) { 
  const formData = new FormData(); 
  formData.append("image", file); // the field name must be "image" 
 
  const res = await api.post( 
    `/products/${encodeURIComponent(id)}/image`, 
    formData, 
    { 
      timeout: 60000, // uploads can take longer than normal requests 
      // IMPORTANT: our Axios instance sends "application/json" by 
      // default. With that header, Axios turns a FormData into JSON 
      // text and the file is lost. Naming multipart here keeps the 
      // FormData as it is. The browser then adds the boundary itself. 
      headers: { "Content-Type": "multipart/form-data" }, 
      onUploadProgress: (event) => { 
        if (onProgress && event.total) { 
          onProgress(Math.round((event.loaded * 100) / event.total)); 
        } 
      }, 
    } 
  ); 
  return res.data.data; 
} 
 
// Removes a product's picture. Returns the updated product. 
export async function deleteProductImage(id) { 
  const res = await api.delete( 
    `/products/${encodeURIComponent(id)}/image` 
  ); 
  return res.data.data; 
}