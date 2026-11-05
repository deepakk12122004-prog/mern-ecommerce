import { useEffect, useRef, useState } from "react"; 
import { 
  uploadProductImage, 
  deleteProductImage, 
} from "../api/productService"; 
import { 
  optimizeImage, 
  validateImageFile, 
  MAX_IMAGE_MB, 
} from "../utils/imageUrl"; 
 
// Props: 
//   product  - the product (needs _id, name, image) 
//   onChange - function(updatedProduct), called after an upload or removal 
function ProductImageUploader({ product, onChange }) { 
  const [file, setFile] = useState(null); 
  const [preview, setPreview] = useState(""); 
  const [progress, setProgress] = useState(0); 
  const [busy, setBusy] = useState(""); // "", "upload" or "remove" 
  const [error, setError] = useState(""); 
  const [message, setMessage] = useState(""); 
  const inputRef = useRef(null); 
 
  const currentUrl = product.image && product.image.url; 
 
  // Show a local preview of the chosen file. 
  // The temporary address is released when the file changes. 
  useEffect(() => { 
    if (!file) { 
      setPreview(""); 
      return undefined; 
    } 
    const url = URL.createObjectURL(file); 
    setPreview(url); 
    return () => URL.revokeObjectURL(url); 
  }, [file]); 
 
  const resetInput = () => { 
    if (inputRef.current) inputRef.current.value = ""; 
  }; 
 
  const handleChoose = (e) => { 
    const chosen = e.target.files && e.target.files[0]; 
    setMessage(""); 
 
    if (!chosen) { 
      setFile(null); 
      setError(""); 
      return; 
    } 
 
    const problem = validateImageFile(chosen); 
    if (problem) { 
      setFile(null); 
      setError(problem); 
      resetInput(); 
      return; 
    } 
 
    setError(""); 
    setFile(chosen); 
  }; 
 
  const handleUpload = async () => { 
    const problem = validateImageFile(file); 
    if (problem) { 
      setError(problem); 
      return; 
    } 
 
    setBusy("upload"); 
    setProgress(0); 
    setError(""); 
    setMessage(""); 
    try { 
      const updated = await uploadProductImage( 
        product._id, 
        file, 
        setProgress 
      ); 
      onChange(updated); 
      setFile(null); 
      resetInput(); 
      setMessage("Image uploaded."); 
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setBusy(""); 
    } 
  }; 
 
  const handleRemove = async () => { 
    if (!window.confirm("Remove this product's image?")) return; 
 
    setBusy("remove"); 
    setError(""); 
    setMessage(""); 
    try { 
      const updated = await deleteProductImage(product._id); 
      onChange(updated); 
      setMessage("Image removed."); 
    } catch (err) { 
      setError(err.message); 
    } finally { 
      setBusy(""); 
    } 
  }; 
 
  const uploading = busy === "upload"; 
 
  return ( 
    <div className="card"> 
      <div className="card-body p-3 p-md-4"> 
        <div className="row g-4"> 
          <div className="col-12 col-md-6"> 
            <h2 className="h6 text-uppercase text-muted mb-2"> 
              Current image 
            </h2> 
            <div className="detail-media"> 
              {currentUrl ? ( 
                <img 
                  src={optimizeImage(currentUrl, 900)} 
                  alt={product.name} 
                /> 
              ) : ( 
                <div className="img-placeholder" aria-hidden="true"> 
                  {(product.name || "?").charAt(0).toUpperCase()} 
                </div> 
              )} 
            </div> 
            {currentUrl && ( 
              <button 
                type="button" 
                className="btn btn-outline-danger btn-sm mt-3" 
                onClick={handleRemove} 
                disabled={Boolean(busy)} 
              > 
                {busy === "remove" ? "Removing..." : "Remove image"} 
              </button> 
            )} 
          </div> 
 
          <div className="col-12 col-md-6"> 
            <h2 className="h6 text-uppercase text-muted mb-2"> 
              Upload a new image 
            </h2> 
 
            <label htmlFor="productImage" className="form-label"> 
              JPG, PNG or WebP, up to {MAX_IMAGE_MB} MB 
            </label> 
            <input 
              ref={inputRef} 
              id="productImage" 
              type="file" 
              className="form-control mb-3" 
              accept="image/jpeg,image/png,image/webp" 
              onChange={handleChoose} 
              disabled={Boolean(busy)} 
            /> 
 
            {preview && ( 
              <div className="mb-3"> 
                <div className="small text-muted mb-1">Preview</div> 
                <img 
                  src={preview} 
                  alt="Selected file preview" 
                  className="img-fluid rounded border" 
                  style={{ maxHeight: "220px" }} 
                /> 
              </div> 
            )} 
 
            {uploading && ( 
              <div className="mb-3" role="status"> 
                <div className="progress" style={{ height: "10px" }}> 
                  <div 
                    className="progress-bar" 
                    style={{ width: `${progress}%` }} 
                  /> 
                </div> 
                <div className="small text-muted mt-1"> 
                  {progress < 100 
                    ? `Uploading... ${progress}%` 
                    : "Processing image..."} 
                </div> 
              </div> 
            )} 
 
            {error && ( 
              <div className="alert alert-danger" role="alert"> 
                {error} 
              </div> 
            )} 
            {message && ( 
              <div className="alert alert-success" role="status"> 
                {message} 
              </div> 
            )} 
 
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleUpload} 
              disabled={!file || Boolean(busy)} 
            > 
              {uploading ? "Uploading..." : "Upload image"} 
            </button> 
          </div> 
        </div> 
      </div> 
    </div> 
  ); 
} 
 
export default ProductImageUploader;