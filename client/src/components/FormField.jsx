// One labelled input with Bootstrap validation styling. 
// `id` is also used as the input's name, so useForm's handleChange works. 
function FormField({ id, label, type = "text", value, onChange, error, ...rest }) { 
  return ( 
    <div className="mb-3"> 
      <label htmlFor={id} className="form-label"> 
        {label} 
      </label> 
      <input 
        id={id} 
        name={id} 
        type={type} 
        className={`form-control ${error ? "is-invalid" : ""}`} 
        value={value} 
        onChange={onChange} 
        {...rest} 
      /> 
      {error && <div className="invalid-feedback">{error}</div>} 
    </div> 
  ); 
} 
 
export default FormField;