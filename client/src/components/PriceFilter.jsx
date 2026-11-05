import { useState, useEffect } from "react"; 
import { CURRENCY_SYMBOL, formatPrice } from "../utils/formatPrice"; 
 
const MAX_PRICE = 1000000; 
 
// Props: 
//   minPrice, maxPrice - current values from the URL (text, may be "") 
//   onApply            - function(min, max), called with text values. 
//                        The PARENT decides what to do with them. 
// All prices are in rupees. 
function PriceFilter({ minPrice = "", maxPrice = "", onApply }) { 
  const [min, setMin] = useState(minPrice); 
  const [max, setMax] = useState(maxPrice); 
  const [error, setError] = useState(""); 
 
  // Keep the inputs in sync when the URL changes 
  // (Clear all filters, browser back button) 
  useEffect(() => { 
    setMin(minPrice); 
    setMax(maxPrice); 
    setError(""); 
  }, [minPrice, maxPrice]); 
 
  const isBad = (text) => { 
    if (text === "") return false; 
    const number = Number(text); 
    return !(number >= 0 && number <= MAX_PRICE); 
  }; 
 
  const handleSubmit = (e) => { 
    e.preventDefault(); 
 
    if (isBad(min) || isBad(max)) { 
      setError( 
        `Prices must be between ${formatPrice(0)} and ${formatPrice(MAX_PRICE)}.` 
      ); 
      return; 
    } 
    if (min !== "" && max !== "" && Number(min) > Number(max)) { 
      setError("Minimum price cannot be higher than maximum."); 
      return; 
    } 
 
    setError(""); 
    if (onApply) onApply(min, max); 
  }; 
 
  const handleClear = () => { 
    setMin(""); 
    setMax(""); 
    setError(""); 
    if (onApply) onApply("", ""); 
  }; 
 
  return ( 
    <form onSubmit={handleSubmit} noValidate> 
      <span className="filter-label d-block mb-1"> 
        Price ({CURRENCY_SYMBOL}) 
      </span> 
      <div className="d-flex flex-wrap align-items-center gap-2"> 
        <div className="input-group" style={{ width: "9rem" }}> 
          <span className="input-group-text">{CURRENCY_SYMBOL}</span> 
          <input 
            type="number" 
            className="form-control" 
            placeholder="Min" 
            aria-label="Minimum price in rupees" 
            min="0" 
            step="0.01" 
            inputMode="decimal" 
            value={min} 
            onChange={(e) => setMin(e.target.value)} 
          /> 
        </div> 
        <span className="text-muted">to</span> 
        <div className="input-group" style={{ width: "9rem" }}> 
          <span className="input-group-text">{CURRENCY_SYMBOL}</span> 
          <input 
            type="number" 
            className="form-control" 
            placeholder="Max" 
            aria-label="Maximum price in rupees" 
            min="0" 
            step="0.01" 
            inputMode="decimal" 
            value={max} 
            onChange={(e) => setMax(e.target.value)} 
          /> 
        </div> 
        <button type="submit" className="btn btn-outline-primary"> 
          Apply 
        </button> 
        {(minPrice || maxPrice) && ( 
          <button 
            type="button" 
            className="btn btn-link text-decoration-none px-1" 
            onClick={handleClear} 
          > 
            Clear 
          </button> 
        )} 
      </div> 
      {error && ( 
        <div className="text-danger small mt-1" role="alert"> 
          {error} 
        </div> 
      )} 
    </form> 
  ); 
} 
 
export default PriceFilter;