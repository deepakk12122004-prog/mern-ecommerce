import { useState } from "react"; 
import useForm from "../hooks/useForm"; 
import FormField from "./FormField"; 
import { validateProductForm } from "../utils/productForm"; 
import { CURRENCY_SYMBOL } from "../utils/formatPrice"; 
 
// Props: 
//   initialValues - starting values (see utils/productForm.js) 
//   categories    - existing category names, offered as suggestions 
//   submitLabel   - text of the submit button 
//   onSubmit      - async function(cleanData). If it throws, the error 
//                   (and any field errors from the server) are shown. 
function ProductForm({ 
  initialValues, 
  categories = [], 
  submitLabel = "Save", 
  onSubmit, 
}) { 
  const { values, setValues, handleChange } = useForm(initialValues); 
  const [fieldErrors, setFieldErrors] = useState({}); 
  const [error, setError] = useState(""); 
  const [submitting, setSubmitting] = useState(false); 
 
  const handleSubmit = async (e) => { 
    e.preventDefault(); 
    setError(""); 
 
    const { errors, data } = validateProductForm(values); 
    setFieldErrors(errors); 
    if (Object.keys(errors).length > 0) return; 
 
    setSubmitting(true); 
    try { 
      await onSubmit(data); 
    } catch (err) { 
      setError(err.message); 
      // Messages the server attached to one field go under that input 
      setFieldErrors(err.fieldErrors || {}); 
    } finally { 
      setSubmitting(false); 
    } 
  }; 
 
  return ( 
    <form onSubmit={handleSubmit} noValidate> 
      {/* A disabled fieldset disables every input and button inside */} 
      <fieldset disabled={submitting}> 
        {error && ( 
          <div className="alert alert-danger" role="alert"> 
            {error} 
          </div> 
        )} 
 
        <FormField 
          id="name" 
          label="Name" 
          value={values.name} 
          onChange={handleChange} 
          error={fieldErrors.name} 
          maxLength={120} 
        /> 
 
        <div className="mb-3"> 
          <label htmlFor="description" className="form-label"> 
            Description 
          </label> 
          <textarea 
            id="description" 
            name="description" 
            rows="4" 
            className={`form-control ${ 
              fieldErrors.description ? "is-invalid" : "" 
            }`} 
            value={values.description} 
            onChange={handleChange} 
            maxLength={2000} 
          /> 
          {fieldErrors.description && ( 
            <div className="invalid-feedback">{fieldErrors.description}</div> 
          )} 
        </div> 
 
        <div className="row"> 
          <div className="col-12 col-sm-4"> 
            <FormField 
              id="price" 
              label={`Price (${CURRENCY_SYMBOL})`} 
              type="number" 
              min="0" 
              step="0.01" 
              inputMode="decimal" 
              value={values.price} 
              onChange={handleChange} 
              error={fieldErrors.price} 
            /> 
          </div> 
          <div className="col-12 col-sm-4"> 
            <FormField 
              id="stock" 
              label="Stock" 
              type="number" 
              min="0" 
              step="1" 
              inputMode="numeric" 
              value={values.stock} 
              onChange={handleChange} 
              error={fieldErrors.stock} 
            /> 
          </div> 
          <div className="col-12 col-sm-4"> 
            <FormField 
              id="category" 
              label="Category" 
              list="category-options" 
              value={values.category} 
              onChange={handleChange} 
              error={fieldErrors.category} 
              maxLength={50} 
            /> 
            {/* Suggestions: pick an existing category or type a new one */} 
            <datalist id="category-options"> 
              {categories.map((name) => ( 
                <option key={name} value={name} /> 
              ))} 
            </datalist> 
          </div> 
        </div> 
 
        <div className="form-check form-switch mb-4"> 
          <input 
            className="form-check-input" 
            type="checkbox" 
            role="switch" 
            id="isActive" 
            checked={values.isActive} 
            onChange={(e) => 
              setValues((prev) => ({ ...prev, isActive: e.target.checked })) 
            } 
          /> 
          <label className="form-check-label" htmlFor="isActive"> 
            Visible in the shop 
          </label> 
          <div className="form-text"> 
            Hidden products are not shown to customers, but you can still 
            see them here. 
          </div> 
        </div> 
 
        <button type="submit" className="btn btn-primary"> 
          {submitting ? "Saving..." : submitLabel} 
        </button> 
      </fieldset> 
    </form> 
  ); 
} 
 
export default ProductForm;